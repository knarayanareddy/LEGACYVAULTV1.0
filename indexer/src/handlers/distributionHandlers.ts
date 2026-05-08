import { PrismaClient } from '@prisma/client';
import { EventContext } from '../services/eventProcessor';

export async function handleSolDistributionInitialized(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, unlockSession, solDistSession, totalBeneficiaries, totalLamports, timestamp } = data;

  await prisma.solDistributionSession.create({
    data: {
      pubkey: solDistSession,
      unlockSessionPubkey: unlockSession,
      vaultPubkey: vault,
      totalBeneficiaries,
      totalLamports: BigInt(totalLamports),
      distributedLamports: 0n,
      initializedAt: BigInt(timestamp),
    },
  });

  await prisma.unlockSession.update({
    where: { pubkey: unlockSession },
    data: { status: 'executing' },
  });

  await prisma.vault.update({
    where: { pubkey: vault },
    data: { status: 'executing' },
  });

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'sol_dist_init',
      description: `SOL distribution initialized for ${Number(totalLamports) / 1e9} SOL`,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot, unlockSession, solDistSession },
    },
  });
}

export async function handleSolBatchExecuted(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, solDistSession, startIndex, batchSize, lamportsDistributed, timestamp } = data;

  await prisma.distributionBatch.create({
    data: {
      solSessionPubkey: solDistSession,
      sessionType: 'sol',
      startIndex,
      batchSize,
      status: 'completed',
      txSignature: ctx.signature,
      processedAt: BigInt(timestamp),
    },
  });

  await prisma.solDistributionSession.update({
    where: { pubkey: solDistSession },
    data: {
      cursor: startIndex + batchSize,
      distributedLamports: { increment: BigInt(lamportsDistributed) },
      ...(startIndex + batchSize >= (await prisma.solDistributionSession.findUnique({ where: { pubkey: solDistSession } }))!.totalBeneficiaries
        ? { completedAt: BigInt(timestamp) }
        : {}),
    },
  });

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'sol_batch_executed',
      description: `SOL distribution batch executed (Index ${startIndex}, Size ${batchSize})`,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot, solDistSession },
    },
  });
}

export async function handleSplDistributionInitialized(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, unlockSession, splDistSession, mint, totalAmount, createMissingAtas, timestamp } = data;

  await prisma.splDistributionSession.create({
    data: {
      pubkey: splDistSession,
      unlockSessionPubkey: unlockSession,
      vaultPubkey: vault,
      mint,
      totalBeneficiaries: (await prisma.vault.findUnique({ where: { pubkey: vault } }))!.beneficiaryCount,
      totalAmount: BigInt(totalAmount),
      createMissingAtas,
      initializedAt: BigInt(timestamp),
    },
  });

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'spl_dist_init',
      description: `SPL distribution initialized for mint ${mint}`,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot, unlockSession, splDistSession, mint },
    },
  });
}

export async function handleSplBatchExecuted(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, splDistSession, startIndex, batchSize, amountDistributed, timestamp } = data;

  await prisma.distributionBatch.create({
    data: {
      splSessionPubkey: splDistSession,
      sessionType: 'spl',
      startIndex,
      batchSize,
      status: 'completed',
      txSignature: ctx.signature,
      processedAt: BigInt(timestamp),
    },
  });

  await prisma.splDistributionSession.update({
    where: { pubkey: splDistSession },
    data: {
      cursor: startIndex + batchSize,
      distributedAmount: { increment: BigInt(amountDistributed) },
      ...(startIndex + batchSize >= (await prisma.splDistributionSession.findUnique({ where: { pubkey: splDistSession } }))!.totalBeneficiaries
        ? { completedAt: BigInt(timestamp) }
        : {}),
    },
  });

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'spl_batch_executed',
      description: `SPL distribution batch executed (Index ${startIndex}, Size ${batchSize})`,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot, splDistSession },
    },
  });
}

export async function handleUnlockFinalized(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, unlockSession, timestamp } = data;

  await prisma.unlockSession.update({
    where: { pubkey: unlockSession },
    data: {
      status: 'executed',
      executedAt: BigInt(timestamp),
    },
  });

  await prisma.vault.update({
    where: { pubkey: vault },
    data: { status: 'distributed' },
  });

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'unlock_finalized',
      description: 'Vault distribution finalized and vault closed',
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot, unlockSession },
    },
  });
}
