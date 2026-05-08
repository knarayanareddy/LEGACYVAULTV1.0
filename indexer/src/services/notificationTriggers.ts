import { PrismaClient } from '@prisma/client';
import { EventContext } from './eventProcessor';
import { logger } from '../lib/logger';

export class NotificationTriggers {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async handleEvent(eventName: string, data: Record<string, any>, _ctx: EventContext) {
    try {
      switch (eventName) {
        case 'VaultCreated':
          await this.createNotification({
            targetWallet: data.owner,
            vaultPubkey: data.vault,
            type: 'system',
            title: 'Vault Created',
            message: `Your LegacyVault is ready. Seed: ${data.vault}`,
            severity: 'info',
          });
          break;

        case 'GuardianAdded':
          await this.createNotification({
            targetWallet: data.guardian,
            vaultPubkey: data.vault,
            type: 'action_required',
            title: 'Guardian Invitation',
            message: `You have been invited as a guardian for vault ${data.vault.slice(0, 8)}...`,
            severity: 'warning',
          });
          break;

        case 'UnlockInitiated':
          // Notify owner and all guardians
          const guardians = await this.prisma.guardian.findMany({
            where: { vaultPubkey: data.vault, status: 'active' },
          });
          const vault = await this.prisma.vault.findUnique({ where: { pubkey: data.vault } });

          const targets = [...guardians.map((g) => g.guardianWallet)];
          if (vault) targets.push(vault.ownerPubkey);

          for (const wallet of targets) {
            await this.createNotification({
              targetWallet: wallet,
              vaultPubkey: data.vault,
              type: 'security',
              title: 'Unlock Initiated',
              message: `An unlock session has been started for vault ${data.vault.slice(0, 8)}...`,
              severity: 'critical',
            });
          }
          break;

        case 'LivenessCheckIn':
          await this.createNotification({
            targetWallet: data.owner,
            vaultPubkey: data.vault,
            type: 'system',
            title: 'Check-in Successful',
            message: 'Your liveness status has been updated.',
            severity: 'info',
          });
          break;

        // Add more triggers as needed
      }
    } catch (error) {
      logger.error({ error, eventName }, 'Failed to trigger notification');
    }
  }

  private async createNotification(params: {
    targetWallet: string;
    vaultPubkey: string;
    type: string;
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
  }) {
    await this.prisma.notification.create({
      data: {
        targetWallet: params.targetWallet,
        vaultPubkey: params.vaultPubkey,
        notificationType: params.type,
        title: params.title,
        message: params.message,
        severity: params.severity,
        read: false,
      },
    });
  }
}
