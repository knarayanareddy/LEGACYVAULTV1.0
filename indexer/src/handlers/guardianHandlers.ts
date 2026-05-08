import { PrismaClient } from '@prisma/client';
import { EventContext } from '../services/eventProcessor';

export async function handleGuardianAdded(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, guardian, role, timestamp } = data;

  const roleStr = typeof role === 'string' ? role : Object.keys(role)[0];

  await prisma.guardian.create({
    data: {
      vaultPubkey: vault,
      guardianWallet: guardian,
      role: roleStr,
      status: 'pending',
      addedAt: BigInt(timestamp),
    },
  });

  await prisma.vault.update({
    where: { pubkey: vault },
    data: { guardianCount: { increment: 1 } },
  });

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'guardian_added',
      description: `Guardian ${guardian} added with role ${roleStr}`,
      actorWallet: guardian,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot },
    },
  });
}

export async function handleGuardianAccepted(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, guardian, timestamp } = data;

  await prisma.guardian.update({
    where: {
      vaultPubkey_guardianWallet: { vaultPubkey: vault, guardianWallet: guardian },
    },
    data: {
      status: 'active',
      acceptedAt: BigInt(timestamp),
    },
  });

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'guardian_accepted',
      description: `Guardian ${guardian} accepted invitation`,
      actorWallet: guardian,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot },
    },
  });
}

export async function handleGuardianRemoved(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, guardian, timestamp } = data;

  await prisma.guardian.update({
    where: {
      vaultPubkey_guardianWallet: { vaultPubkey: vault, guardianWallet: guardian },
    },
    data: {
      status: 'removed',
      removedAt: BigInt(timestamp),
    },
  });

  await prisma.vault.update({
    where: { pubkey: vault },
    data: { guardianCount: { decrement: 1 } },
  });

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'guardian_removed',
      description: `Guardian ${guardian} removed`,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot },
    },
  });
}

export async function handleGuardianThresholdUpdated(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, newThreshold, timestamp } = data;

  await prisma.vault.update({
    where: { pubkey: vault },
    data: { guardianThreshold: newThreshold },
  });

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'threshold_updated',
      description: `Guardian threshold updated to ${newThreshold}`,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot },
    },
  });
}
