import { PrismaClient } from '@prisma/client';
import { EventContext } from '../services/eventProcessor';

export async function handleCheckIn(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, signer, timestamp } = data;

  await prisma.vault.update({
    where: { pubkey: vault },
    data: {
      lastCheckIn: BigInt(timestamp),
    },
  });

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'check_in',
      description: `Liveness check-in by ${signer}`,
      actorWallet: signer,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot },
    },
  });
}

export async function handleLivenessDelegateAdded(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, delegate, timestamp } = data;

  // Liveness delegates are currently stored in activity logs or metadata
  // In a more complex schema, we would have a dedicated table.
  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'delegate_added',
      description: `Liveness delegate ${delegate} added`,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot, delegate },
    },
  });
}

export async function handleLivenessDelegateRemoved(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, delegate, timestamp } = data;

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'delegate_removed',
      description: `Liveness delegate ${delegate} removed`,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot, delegate },
    },
  });
}
