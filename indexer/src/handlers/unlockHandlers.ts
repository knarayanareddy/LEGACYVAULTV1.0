import { PrismaClient } from '@prisma/client';
import { EventContext } from '../services/eventProcessor';
import Redis from 'ioredis';
import { Queue } from 'bullmq';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const notifierQueue = new Queue('notifications', { connection });

export async function handleUnlockInitiated(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, unlockSession, initiatedBy, timestamp } = data;

  await prisma.unlockSession.create({
    data: {
      pubkey: unlockSession,
      vaultPubkey: vault,
      status: 'proposed',
      initiatedBy,
      initiatedAt: BigInt(timestamp),
      approvalCount: 0,
    },
  });

  await prisma.vault.update({
    where: { pubkey: vault },
    data: { status: 'unlocking' },
  });

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'unlock_initiated',
      description: `Unlock session initiated by ${initiatedBy}`,
      actorWallet: initiatedBy,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot, unlockSession },
    },
  });
}

export async function handleUnlockApproved(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, unlockSession, guardian, timestamp } = data;

  // Find the guardian record to get its ID
  const guardianRec = await prisma.guardian.findUnique({
    where: { vaultPubkey_guardianWallet: { vaultPubkey: vault, guardianWallet: guardian } },
  });

  if (!guardianRec) return;

  await prisma.guardianApproval.create({
    data: {
      unlockSessionPubkey: unlockSession,
      guardianId: guardianRec.id,
      guardianWallet: guardian,
      approvedAt: BigInt(timestamp),
      txSignature: ctx.signature,
    },
  });

  await prisma.unlockSession.update({
    where: { pubkey: unlockSession },
    data: { approvalCount: { increment: 1 } },
  });

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'unlock_approved',
      description: `Unlock session approved by guardian ${guardian}`,
      actorWallet: guardian,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot, unlockSession },
    },
  });
}

export async function handleUnlockThresholdMet(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, unlockSession, timelockEndsAt, timestamp } = data;

  await prisma.unlockSession.update({
    where: { pubkey: unlockSession },
    data: {
      status: 'approved',
      approvedAt: BigInt(timestamp),
      timelockStartedAt: BigInt(timestamp),
      timelockEndsAt: BigInt(timelockEndsAt),
    },
  });

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'threshold_met',
      description: `Unlock threshold met. Timelock ends at ${new Date(Number(timelockEndsAt) * 1000).toISOString()}`,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot, unlockSession, timelockEndsAt },
    },
  });

  await notifierQueue.add('timelock-started', {
    vaultAddress: vault,
    type: 'timelock_started',
    data: { vaultAddress: vault, timelockEndsAt: new Date(Number(timelockEndsAt) * 1000) },
  });
}

export async function handleUnlockCancelled(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, unlockSession, cancelledBy, timestamp } = data;

  await prisma.unlockSession.update({
    where: { pubkey: unlockSession },
    data: {
      status: 'cancelled',
      cancelledAt: BigInt(timestamp),
    },
  });

  await prisma.vault.update({
    where: { pubkey: vault },
    data: { status: 'active' },
  });

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'unlock_cancelled',
      description: `Unlock session cancelled by ${cancelledBy}`,
      actorWallet: cancelledBy,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot, unlockSession },
    },
  });
}

export async function handleDisputeOpened(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, unlockSession, dispute, openedBy, timestamp } = data;

  await prisma.disputeCase.create({
    data: {
      pubkey: dispute,
      unlockSessionPubkey: unlockSession,
      vaultPubkey: vault,
      openedBy,
      status: 'open',
      openedAt: BigInt(timestamp),
    },
  });

  await prisma.unlockSession.update({
    where: { pubkey: unlockSession },
    data: { status: 'disputed' },
  });

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'dispute_opened',
      description: `Dispute opened for unlock session by ${openedBy}`,
      actorWallet: openedBy,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot, unlockSession, dispute },
    },
  });
}

export async function handleDisputeResolved(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, unlockSession, dispute, resolvedBy, result, timestamp } = data;

  const resultStr = typeof result === 'string' ? result : Object.keys(result)[0];

  await prisma.disputeCase.update({
    where: { pubkey: dispute },
    data: {
      status: resultStr === 'cancel' ? 'resolved_cancel' : 'resolved_proceed',
      resolvedAt: BigInt(timestamp),
      resolvedBy,
    },
  });

  if (resultStr === 'cancel') {
    await prisma.unlockSession.update({
      where: { pubkey: unlockSession },
      data: { status: 'cancelled', cancelledAt: BigInt(timestamp) },
    });
    await prisma.vault.update({
      where: { pubkey: vault },
      data: { status: 'active' },
    });
  } else {
    await prisma.unlockSession.update({
      where: { pubkey: unlockSession },
      data: { status: 'approved' }, // Resume
    });
  }

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'dispute_resolved',
      description: `Dispute resolved with result: ${resultStr}`,
      actorWallet: resolvedBy,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot, unlockSession, dispute, result: resultStr },
    },
  });
}
