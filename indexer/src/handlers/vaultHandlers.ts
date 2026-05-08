import { PrismaClient } from '@prisma/client';
import { EventContext } from '../services/eventProcessor';

export async function handleVaultCreated(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, owner, vaultNonce, inactivityThreshold, timelockDuration, guardianThreshold, timestamp } = data;

  await prisma.vault.create({
    data: {
      pubkey: vault,
      ownerPubkey: owner,
      status: 'active',
      createdAt: BigInt(timestamp),
      lastCheckIn: BigInt(timestamp),
      inactivityThreshold: BigInt(inactivityThreshold),
      timelockDuration: BigInt(timelockDuration),
      guardianThreshold,
      guardianCount: 0,
      beneficiaryCount: 0,
      totalBps: 0,
      subscriptionTier: 'free',
      subscriptionExpiry: null,
      panicFreeze: false,
      frozenBy: null,
      frozenAt: null,
      arbiter: null,
    },
  });

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'vault_created',
      description: `Vault created by ${owner}`,
      actorWallet: owner,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot, vaultNonce },
    },
  });
}

export async function handleVaultSettingsUpdated(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, owner, timestamp } = data;

  await prisma.vault.update({
    where: { pubkey: vault },
    data: { updatedAt: new Date() },
  });

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'settings_updated',
      description: 'Vault settings updated',
      actorWallet: owner,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot },
    },
  });
}

export async function handleVaultFrozen(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, frozenBy, timestamp } = data;

  await prisma.vault.update({
    where: { pubkey: vault },
    data: {
      status: 'frozen',
      panicFreeze: true,
      frozenBy,
      frozenAt: BigInt(timestamp),
    },
  });

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'freeze',
      description: `Vault frozen by ${frozenBy}`,
      actorWallet: frozenBy,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot },
    },
  });
}

export async function handleVaultUnfrozen(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, unfrozenBy, timestamp } = data;

  await prisma.vault.update({
    where: { pubkey: vault },
    data: {
      status: 'active',
      panicFreeze: false,
      frozenBy: null,
      frozenAt: null,
    },
  });

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'unfreeze',
      description: `Vault unfrozen by ${unfrozenBy}`,
      actorWallet: unfrozenBy,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot },
    },
  });
}
