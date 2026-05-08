import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger';
import { normalizeEventData } from '../lib/eventDecoder';
import { NotificationTriggers } from './notificationTriggers';

// Import all handler modules (will create these next)
import * as vaultHandlers from '../handlers/vaultHandlers';
import * as guardianHandlers from '../handlers/guardianHandlers';
import * as beneficiaryHandlers from '../handlers/beneficiaryHandlers';
import * as assetHandlers from '../handlers/assetHandlers';
import * as livenessHandlers from '../handlers/livenessHandlers';
import * as documentHandlers from '../handlers/documentHandlers';
import * as unlockHandlers from '../handlers/unlockHandlers';
import * as distributionHandlers from '../handlers/distributionHandlers';
import * as subscriptionHandlers from '../handlers/subscriptionHandlers';
import * as proGuardianHandlers from '../handlers/proGuardianHandlers';

const prisma = new PrismaClient();

export interface EventContext {
  eventName: string;
  eventData: Record<string, any>;
  signature: string;
  slot: number;
  timestamp: number;
}

type EventHandler = (
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) => Promise<void>;

export class EventProcessor {
  private handlers: Map<string, EventHandler> = new Map();
  private notificationTriggers: NotificationTriggers;

  constructor() {
    this.notificationTriggers = new NotificationTriggers(prisma);
    this.registerHandlers();
  }

  private registerHandlers() {
    // Vault
    this.handlers.set('VaultCreated', vaultHandlers.handleVaultCreated);
    this.handlers.set('VaultSettingsUpdated', vaultHandlers.handleVaultSettingsUpdated);
    this.handlers.set('VaultFrozen', vaultHandlers.handleVaultFrozen);
    this.handlers.set('VaultUnfrozen', vaultHandlers.handleVaultUnfrozen);

    // Guardians
    this.handlers.set('GuardianAdded', guardianHandlers.handleGuardianAdded);
    this.handlers.set('GuardianAccepted', guardianHandlers.handleGuardianAccepted);
    this.handlers.set('GuardianRemoved', guardianHandlers.handleGuardianRemoved);
    this.handlers.set('GuardianThresholdUpdated', guardianHandlers.handleGuardianThresholdUpdated);

    // Beneficiaries
    this.handlers.set('BeneficiaryAdded', beneficiaryHandlers.handleBeneficiaryAdded);
    this.handlers.set('BeneficiaryUpdated', beneficiaryHandlers.handleBeneficiaryUpdated);
    this.handlers.set('BeneficiaryRemoved', beneficiaryHandlers.handleBeneficiaryRemoved);
    this.handlers.set('AssetRuleSet', beneficiaryHandlers.handleAssetRuleSet);
    this.handlers.set('AssetRuleCleared', beneficiaryHandlers.handleAssetRuleCleared);

    // Assets
    this.handlers.set('Deposited', assetHandlers.handleDeposited);
    this.handlers.set('Withdrawn', assetHandlers.handleWithdrawn);

    // Liveness
    this.handlers.set('LivenessCheckIn', livenessHandlers.handleCheckIn); // Renamed in program to LivenessCheckIn
    this.handlers.set('LivenessDelegateAdded', livenessHandlers.handleLivenessDelegateAdded);
    this.handlers.set('LivenessDelegateRemoved', livenessHandlers.handleLivenessDelegateRemoved);

    // Documents
    this.handlers.set('DocumentSet', documentHandlers.handleDocumentSet);
    this.handlers.set('DocumentRevoked', documentHandlers.handleDocumentRevoked);

    // Unlock
    this.handlers.set('UnlockInitiated', unlockHandlers.handleUnlockInitiated);
    this.handlers.set('UnlockApproved', unlockHandlers.handleUnlockApproved);
    this.handlers.set('UnlockThresholdMet', unlockHandlers.handleUnlockThresholdMet);
    this.handlers.set('UnlockCancelled', unlockHandlers.handleUnlockCancelled);
    this.handlers.set('DisputeOpened', unlockHandlers.handleDisputeOpened);
    this.handlers.set('DisputeResolved', unlockHandlers.handleDisputeResolved);

    // Distribution
    this.handlers.set('SolDistributionInitialized', distributionHandlers.handleSolDistributionInitialized);
    this.handlers.set('SolBatchExecuted', distributionHandlers.handleSolBatchExecuted);
    this.handlers.set('SplDistributionInitialized', distributionHandlers.handleSplDistributionInitialized);
    this.handlers.set('SplBatchExecuted', distributionHandlers.handleSplBatchExecuted);
    this.handlers.set('UnlockFinalized', distributionHandlers.handleUnlockFinalized);

    // Subscription
    this.handlers.set('SubscriptionUpdated', subscriptionHandlers.handleSubscriptionUpdated);

    // Professional guardians
    this.handlers.set('ProfessionalGuardianRegistered', proGuardianHandlers.handleProfessionalGuardianRegistered);
    this.handlers.set('ProfessionalGuardianKycUpdated', proGuardianHandlers.handleProfessionalGuardianKycUpdated);
    this.handlers.set('GuardianBonded', proGuardianHandlers.handleGuardianBonded);
    this.handlers.set('GuardianSlashed', proGuardianHandlers.handleGuardianSlashed);
  }

  async process(ctx: EventContext) {
    const { eventName, eventData, signature } = ctx;

    const handler = this.handlers.get(eventName);
    if (!handler) {
      logger.debug({ eventName, signature }, 'No handler registered for event');
      return;
    }

    try {
      const normalized = normalizeEventData(eventData);

      await prisma.$transaction(async (tx) => {
        await handler(normalized, ctx, tx as any);
      });

      await this.notificationTriggers.handleEvent(eventName, normalized, ctx);

      logger.info({ eventName, signature }, 'Event processed successfully');
    } catch (error) {
      logger.error({ error, eventName, signature, eventData }, 'Handler failed');
      throw error;
    }
  }
}
