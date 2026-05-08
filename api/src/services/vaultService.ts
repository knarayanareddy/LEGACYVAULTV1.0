import { PrismaClient } from '@prisma/client';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { connection } from '../config/anchor';
import {
  VaultSummaryResponse,
  VaultUIStatus,
  CheckInHealth,
  UnlockSessionView,
  GuardianView,
  BeneficiaryView,
  VaultAssetView,
  LivenessSummaryResponse,
  LivenessRecord,
  DistributionStateResponse,
  SolSessionView,
  SplSessionView,
  DocumentView,
  ActivityLogView,
  NotificationView,
  PortfolioSummaryResponse,
  PortfolioSnapshotView,
  AssetDistributionSlice,
} from '../types/api';
import { marketDataService } from './marketDataService';
import { findVaultAuthorityPda } from '../lib/pda';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// Status mapping: on-chain protocol status → UI status string
// ─────────────────────────────────────────────────────────────────────────────

function mapProtocolStatusToUI(status: string): VaultUIStatus {
  const map: Record<string, VaultUIStatus> = {
    active:      'locked',
    unlocking:   'unlocking',
    executing:   'unlocked',
    distributed: 'distributed',
    frozen:      'frozen',
  };
  return map[status] ?? 'locked';
}

// ─────────────────────────────────────────────────────────────────────────────
// Liveness health calculation
// ─────────────────────────────────────────────────────────────────────────────

function computeCheckInHealth(
  daysSinceCheckIn: number,
  inactivityDays: number
): CheckInHealth {
  const ratio = daysSinceCheckIn / inactivityDays;
  if (ratio < 0.5) return 'healthy';
  if (ratio < 0.8) return 'warning';
  return 'danger';
}

// ─────────────────────────────────────────────────────────────────────────────
// Vault Summary
// ─────────────────────────────────────────────────────────────────────────────

export async function getVaultSummary(
  vaultPubkey: string,
  _walletPubkey: string
): Promise<VaultSummaryResponse> {
  const vault = await prisma.vault.findUniqueOrThrow({
    where: { pubkey: vaultPubkey },
    include: {
      guardians: {
        where: { status: { in: ['active', 'pending'] } },
      },
    },
  });

  const unlockSession = await prisma.unlockSession.findFirst({
    where: {
      vaultPubkey,
      status: { notIn: ['cancelled', 'executed'] },
    },
    orderBy: { initiatedAt: 'desc' },
  });

  const nowSec = Math.floor(Date.now() / 1000);
  const lastCheckIn = Number(vault.lastCheckIn);
  const inactivityThresholdSec = Number(vault.inactivityThreshold);
  const inactivityThresholdDays = inactivityThresholdSec / 86400;

  const secondsSinceCheckIn = nowSec - lastCheckIn;
  const daysSinceCheckIn = secondsSinceCheckIn / 86400;

  const deadlineSec = lastCheckIn + inactivityThresholdSec;
  const secondsRemaining = deadlineSec - nowSec;
  const daysRemaining = Math.max(0, secondsRemaining / 86400);

  const checkInHealth = computeCheckInHealth(daysSinceCheckIn, inactivityThresholdDays);

  let approvedGuardians = 0;
  if (unlockSession) {
    approvedGuardians = await prisma.guardianApproval.count({
      where: { unlockSessionPubkey: unlockSession.pubkey },
    });
  }

  const latestSnapshot = await prisma.portfolioSnapshot.findFirst({
    where: { vaultPubkey },
    orderBy: { capturedAt: 'desc' },
  });
  const totalUsdValue = latestSnapshot
    ? Number(latestSnapshot.totalUsdValue)
    : 0;

  let unlockSessionView: UnlockSessionView | null = null;
  if (unlockSession) {
    const timelockEndsAt = unlockSession.timelockEndsAt
      ? Number(unlockSession.timelockEndsAt)
      : null;
    const timeRemaining = timelockEndsAt
      ? Math.max(0, timelockEndsAt - nowSec)
      : null;

    unlockSessionView = {
      pubkey: unlockSession.pubkey,
      status: unlockSession.status,
      initiatedBy: unlockSession.initiatedBy,
      initiatedAt: Number(unlockSession.initiatedAt),
      approvedAt: unlockSession.approvedAt ? Number(unlockSession.approvedAt) : null,
      timelockStartedAt: unlockSession.timelockStartedAt
        ? Number(unlockSession.timelockStartedAt)
        : null,
      timelockEndsAt,
      executedAt: unlockSession.executedAt ? Number(unlockSession.executedAt) : null,
      approvalCount: unlockSession.approvalCount,
      threshold: vault.guardianThreshold,
      timeRemaining,
    };
  }

  return {
    pubkey: vault.pubkey,
    ownerPubkey: vault.ownerPubkey,
    status: mapProtocolStatusToUI(vault.status),
    createdAt: Number(vault.createdAt),
    lastCheckIn,
    timelockStart: unlockSession?.timelockStartedAt
      ? Number(unlockSession.timelockStartedAt)
      : null,
    inactivityThreshold: inactivityThresholdSec,
    timelockDuration: Number(vault.timelockDuration),
    guardianThreshold: vault.guardianThreshold,
    totalGuardians: vault.guardianCount,
    totalBeneficiaries: vault.beneficiaryCount,
    totalBps: vault.totalBps,
    subscriptionTier: vault.subscriptionTier as 'free' | 'pro' | 'enterprise',
    subscriptionExpiry: vault.subscriptionExpiry
      ? Number(vault.subscriptionExpiry)
      : null,
    daysSinceCheckIn: parseFloat(daysSinceCheckIn.toFixed(2)),
    daysRemaining: parseFloat(daysRemaining.toFixed(2)),
    checkInHealth,
    approvedGuardians,
    totalUsdValue,
    unlockSession: unlockSessionView,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Assets
// ─────────────────────────────────────────────────────────────────────────────

export async function getVaultAssets(
  vaultPubkey: string,
  filter: 'all' | 'SOL' | 'SPL' | 'NFT' | 'POSITION'
): Promise<VaultAssetView[]> {
  const [vaultAuthPda] = findVaultAuthorityPda(new PublicKey(vaultPubkey));
  const assets: VaultAssetView[] = [];

  if (filter === 'all' || filter === 'SOL') {
    const lamports = await connection.getBalance(vaultAuthPda);
    const solPrice = await marketDataService.getPrice('So11111111111111111111111111111111111111112');

    assets.push({
      type: 'SOL',
      mint: null,
      symbol: 'SOL',
      name: 'Solana',
      icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
      balance: lamports / LAMPORTS_PER_SOL,
      usdValue: (lamports / LAMPORTS_PER_SOL) * solPrice.price,
      change24h: solPrice.change24h,
    });
  }

  if (filter !== 'SOL') {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      vaultAuthPda,
      { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
    );

    for (const { account } of tokenAccounts.value) {
      const parsed = account.data.parsed.info;
      const mint = parsed.mint as string;
      const rawBalance = parsed.tokenAmount.uiAmount as number;
      const decimals = parsed.tokenAmount.decimals as number;

      if (rawBalance === 0) continue;

      const metadata = await marketDataService.getTokenMetadata(mint);
      const priceData = await marketDataService.getPrice(mint);

      let assetType: 'SPL' | 'NFT' | 'POSITION' = 'SPL';
      if (parsed.tokenAmount.amount === '1' && decimals === 0) {
        assetType = 'NFT';
      }

      if (filter !== 'all' && filter !== assetType) continue;

      assets.push({
        type: assetType,
        mint,
        symbol: metadata.symbol,
        name: metadata.name,
        icon: metadata.icon,
        balance: rawBalance,
        usdValue: rawBalance * priceData.price,
        change24h: priceData.change24h,
      });
    }
  }

  return assets;
}

// ─────────────────────────────────────────────────────────────────────────────
// Guardians
// ─────────────────────────────────────────────────────────────────────────────

export async function getVaultGuardians(
  vaultPubkey: string
): Promise<GuardianView[]> {
  const guardians = await prisma.guardian.findMany({
    where: { vaultPubkey, status: { not: 'removed' } },
    orderBy: { addedAt: 'asc' },
  });

  const unlockSession = await prisma.unlockSession.findFirst({
    where: {
      vaultPubkey,
      status: { notIn: ['cancelled', 'executed'] },
    },
    include: { approvals: true },
  });

  const wallets = guardians.map((g) => g.guardianWallet);
  const profiles = await prisma.userProfile.findMany({
    where: { wallet: { in: wallets } },
  });
  const profileMap = new Map(profiles.map((p) => [p.wallet, p]));

  const proProfiles = await prisma.proGuardianProfile.findMany({
    where: { wallet: { in: wallets } },
  });
  const proProfileMap = new Map(proProfiles.map((p) => [p.wallet, p]));

  return guardians.map((g): GuardianView => {
    const profile = profileMap.get(g.guardianWallet);
    const proProfile = proProfileMap.get(g.guardianWallet);

    const isApproved =
      unlockSession?.approvals.some(
        (a) => a.guardianWallet === g.guardianWallet
      ) ?? false;

    const approvalRecord = unlockSession?.approvals.find(
      (a) => a.guardianWallet === g.guardianWallet
    );

    return {
      pubkey: g.guardianWallet,
      role: g.role as 'personal' | 'professional' | 'delegate',
      status: g.status as 'pending' | 'active' | 'inactive' | 'removed',
      approved: isApproved,
      approvalTime: approvalRecord ? Number(approvalRecord.approvedAt) : null,
      name: profile?.name ?? null,
      avatar: profile?.avatarUrl ?? null,
      lastContact: null,
      reputation: proProfile?.reputationScore ?? null,
      bondAmount: null,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Beneficiaries
// ─────────────────────────────────────────────────────────────────────────────

export async function getVaultBeneficiaries(
  vaultPubkey: string
): Promise<BeneficiaryView[]> {
  const beneficiaries = await prisma.beneficiary.findMany({
    where: { vaultPubkey },
    include: { assetRules: true },
    orderBy: { addedAt: 'asc' },
  });

  const wallets = beneficiaries.map((b) => b.beneficiaryWallet);
  const profiles = await prisma.userProfile.findMany({
    where: { wallet: { in: wallets } },
  });
  const profileMap = new Map(profiles.map((p) => [p.wallet, p]));

  return beneficiaries.map((b): BeneficiaryView => {
    const profile = profileMap.get(b.beneficiaryWallet);

    return {
      pubkey: b.beneficiaryWallet,
      shareBps: b.shareBps,
      active: b.active,
      name: profile?.name ?? null,
      avatar: profile?.avatarUrl ?? null,
      assetOverrides: b.assetRules.map((r) => ({
        mint: r.mint,
        mode: r.mode as 'pro-rata' | 'fixed-bps' | 'entire-to-beneficiary',
        fixedBps: r.fixedBps,
      })),
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Liveness
// ─────────────────────────────────────────────────────────────────────────────

export async function getLivenessSummary(
  vaultPubkey: string
): Promise<LivenessSummaryResponse> {
  const vault = await prisma.vault.findUniqueOrThrow({
    where: { pubkey: vaultPubkey },
  });

  const nowSec = Math.floor(Date.now() / 1000);
  const lastCheckIn = Number(vault.lastCheckIn);
  const inactivityThresholdSec = Number(vault.inactivityThreshold);
  const inactivityThresholdDays = inactivityThresholdSec / 86400;

  const daysSinceCheckIn = (nowSec - lastCheckIn) / 86400;
  const daysRemaining = Math.max(
    0,
    (lastCheckIn + inactivityThresholdSec - nowSec) / 86400
  );

  const checkInHealth = computeCheckInHealth(daysSinceCheckIn, inactivityThresholdDays);

  return {
    lastCheckIn,
    daysSinceCheckIn: parseFloat(daysSinceCheckIn.toFixed(2)),
    daysRemaining: parseFloat(daysRemaining.toFixed(2)),
    checkInHealth,
    inactivityThresholdDays,
    delegates: [],
  };
}

export async function getLivenessHistory(
  vaultPubkey: string,
  range: '30d' | '90d' | '1y'
): Promise<LivenessRecord[]> {
  const rangeDays = { '30d': 30, '90d': 90, '1y': 365 }[range];
  const fromTimestamp = Math.floor(Date.now() / 1000) - rangeDays * 86400;

  const activities = await prisma.activityLog.findMany({
    where: {
      vaultPubkey,
      activityType: 'check_in',
      timestamp: { gte: BigInt(fromTimestamp) },
    },
    orderBy: { timestamp: 'asc' },
  });

  return activities.map((a) => ({
    timestamp: Number(a.timestamp),
    signedBy: a.actorWallet ?? '',
    txSignature: a.txSignature,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Distribution state
// ─────────────────────────────────────────────────────────────────────────────

export async function getDistributionState(
  vaultPubkey: string
): Promise<DistributionStateResponse> {
  const unlockSession = await prisma.unlockSession.findFirst({
    where: {
      vaultPubkey,
      status: { notIn: ['cancelled'] },
    },
    include: {
      solDistSession: { include: { batches: { orderBy: { startIndex: 'asc' } } } },
      splDistSessions: { include: { batches: { orderBy: { startIndex: 'asc' } } } },
    },
    orderBy: { initiatedAt: 'desc' },
  });

  const vault = await prisma.vault.findUniqueOrThrow({
    where: { pubkey: vaultPubkey },
  });

  const [vaultAuthPda] = findVaultAuthorityPda(new PublicKey(vaultPubkey));

  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
    vaultAuthPda,
    { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
  );
  const availableMints = tokenAccounts.value
    .filter((ta) => Number(ta.account.data.parsed.info.tokenAmount.uiAmount) > 0)
    .map((ta) => ta.account.data.parsed.info.mint as string);

  let unlockSessionView = null;
  let solSessionView: SolSessionView | null = null;
  let splSessionViews: SplSessionView[] = [];

  if (unlockSession) {
    const nowSec = Math.floor(Date.now() / 1000);
    const timelockEndsAt = unlockSession.timelockEndsAt
      ? Number(unlockSession.timelockEndsAt)
      : null;

    unlockSessionView = {
      pubkey: unlockSession.pubkey,
      status: unlockSession.status,
      initiatedBy: unlockSession.initiatedBy,
      initiatedAt: Number(unlockSession.initiatedAt),
      approvedAt: unlockSession.approvedAt ? Number(unlockSession.approvedAt) : null,
      timelockStartedAt: unlockSession.timelockStartedAt
        ? Number(unlockSession.timelockStartedAt)
        : null,
      timelockEndsAt,
      executedAt: unlockSession.executedAt ? Number(unlockSession.executedAt) : null,
      approvalCount: unlockSession.approvalCount,
      threshold: vault.guardianThreshold,
      timeRemaining: timelockEndsAt ? Math.max(0, timelockEndsAt - nowSec) : null,
    };

    if (unlockSession.solDistSession) {
      const s = unlockSession.solDistSession;
      solSessionView = {
        pubkey: s.pubkey,
        totalBeneficiaries: s.totalBeneficiaries,
        cursor: s.cursor,
        totalLamports: Number(s.totalLamports),
        distributedLamports: Number(s.distributedLamports),
        completed: s.completedAt !== null,
        batches: s.batches.map((b) => ({
          id: b.id,
          startIndex: b.startIndex,
          batchSize: b.batchSize,
          status: b.status as 'pending' | 'processing' | 'completed' | 'failed',
          txSignature: b.txSignature,
          processedAt: b.processedAt ? Number(b.processedAt) : null,
        })),
      };
    }

    for (const spl of unlockSession.splDistSessions) {
      const metadata = await marketDataService.getTokenMetadata(spl.mint);
      splSessionViews.push({
        pubkey: spl.pubkey,
        mint: spl.mint,
        symbol: metadata.symbol,
        totalBeneficiaries: spl.totalBeneficiaries,
        cursor: spl.cursor,
        totalAmount: Number(spl.totalAmount),
        distributedAmount: Number(spl.distributedAmount),
        completed: spl.completedAt !== null,
        createMissingAtas: spl.createMissingAtas,
        batches: spl.batches.map((b) => ({
          id: b.id,
          startIndex: b.startIndex,
          batchSize: b.batchSize,
          status: b.status as 'pending' | 'processing' | 'completed' | 'failed',
          txSignature: b.txSignature,
          processedAt: b.processedAt ? Number(b.processedAt) : null,
        })),
      });
    }
  }

  const canFinalize =
    unlockSession?.status === 'executing' &&
    solSessionView?.completed === true &&
    splSessionViews.every((s) => s.completed);

  return {
    unlockSession: unlockSessionView,
    solSession: solSessionView,
    splSessions: splSessionViews,
    availableMints,
    canFinalize,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Documents
// ─────────────────────────────────────────────────────────────────────────────

export async function getVaultDocuments(
  vaultPubkey: string
): Promise<DocumentView[]> {
  const docs = await prisma.document.findMany({
    where: { vaultPubkey, revoked: false },
    orderBy: { uploadedAt: 'desc' },
  });

  return docs.map((d): DocumentView => ({
    id: d.id,
    type: d.documentType as DocumentView['type'],
    name: d.name,
    sizeBytes: Number(d.sizeBytes),
    hash: d.hash,
    uri: d.storageUri,
    uploadedAt: d.uploadedAt.toISOString(),
    encrypted: d.encrypted,
    revoked: d.revoked,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity log
// ─────────────────────────────────────────────────────────────────────────────

export async function getVaultActivity(
  vaultPubkey: string,
  limit: number,
  offset: number,
  activityType?: string
): Promise<{ activities: ActivityLogView[]; total: number }> {
  const where = {
    vaultPubkey,
    ...(activityType ? { activityType } : {}),
  };

  const [activities, total] = await prisma.$transaction([
    prisma.activityLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    activities: activities.map((a) => ({
      id: a.id,
      activityType: a.activityType,
      description: a.description,
      actorWallet: a.actorWallet,
      txSignature: a.txSignature,
      timestamp: Number(a.timestamp),
      metadata: a.metadata as Record<string, unknown> | null,
    })),
    total,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────────────────────────────────────

export async function getNotifications(
  wallet: string,
  limit: number,
  unreadOnly: boolean
): Promise<NotificationView[]> {
  const notifications = await prisma.notification.findMany({
    where: {
      targetWallet: wallet,
      ...(unreadOnly ? { read: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return notifications.map((n): NotificationView => ({
    id: n.id,
    vaultPubkey: n.vaultPubkey,
    notificationType: n.notificationType,
    title: n.title,
    message: n.message,
    severity: n.severity as 'info' | 'warning' | 'critical',
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Portfolio
// ─────────────────────────────────────────────────────────────────────────────

export async function getPortfolioSummary(
  vaultPubkey: string
): Promise<PortfolioSummaryResponse> {
  const snapshot = await prisma.portfolioSnapshot.findFirst({
    where: { vaultPubkey },
    orderBy: { capturedAt: 'desc' },
  });

  if (!snapshot) {
    return {
      totalUsdValue: 0,
      breakdown: { sol: 0, spl: 0, nft: 0, position: 0 },
    };
  }

  const breakdown = snapshot.breakdown as {
    sol: number;
    spl: number;
    nft: number;
    position: number;
  };

  return {
    totalUsdValue: Number(snapshot.totalUsdValue),
    breakdown,
  };
}

export async function getPortfolioHistory(
  vaultPubkey: string,
  range: '30d' | '90d' | '1y'
): Promise<PortfolioSnapshotView[]> {
  const rangeDays = { '30d': 30, '90d': 90, '1y': 365 }[range];
  const from = new Date(Date.now() - rangeDays * 86400 * 1000);

  const snapshots = await prisma.portfolioSnapshot.findMany({
    where: { vaultPubkey, capturedAt: { gte: from } },
    orderBy: { capturedAt: 'asc' },
  });

  return snapshots.map((s) => ({
    timestamp: s.capturedAt.toISOString(),
    totalUsdValue: Number(s.totalUsdValue),
  }));
}

export async function getPortfolioDistribution(
  vaultPubkey: string
): Promise<AssetDistributionSlice[]> {
  const assets = await getVaultAssets(vaultPubkey, 'all');

  const totalValue = assets.reduce((sum, a) => sum + a.usdValue, 0);
  if (totalValue === 0) return [];

  return assets
    .filter((a) => a.usdValue > 0)
    .sort((a, b) => b.usdValue - a.usdValue)
    .map((a) => ({
      symbol: a.symbol,
      name: a.name,
      usdValue: a.usdValue,
      percentage: parseFloat(((a.usdValue / totalValue) * 100).toFixed(2)),
    }));
}

export { prisma };
