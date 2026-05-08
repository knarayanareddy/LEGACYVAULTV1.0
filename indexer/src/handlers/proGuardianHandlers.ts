import { PrismaClient } from '@prisma/client';
import { EventContext } from '../services/eventProcessor';

export async function handleProfessionalGuardianRegistered(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { guardian, profileUri, timestamp } = data;

  await prisma.proGuardianProfile.upsert({
    where: { wallet: guardian },
    update: {
      profileUri,
      onChainSyncedAt: new Date(),
    },
    create: {
      wallet: guardian,
      profileUri,
      registeredAt: BigInt(timestamp),
      onChainSyncedAt: new Date(),
    },
  });

  await prisma.activityLog.create({
    data: {
      vaultPubkey: '', // Global activity
      activityType: 'pro_guardian_registered',
      description: `New professional guardian registered: ${guardian}`,
      actorWallet: guardian,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot },
    },
  });
}

export async function handleProfessionalGuardianKycUpdated(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { guardian, status, timestamp } = data;

  const statusStr = typeof status === 'string' ? status : Object.keys(status)[0];

  await prisma.proGuardianProfile.update({
    where: { wallet: guardian },
    data: {
      kycStatus: statusStr,
      kycUpdatedAt: BigInt(timestamp),
    },
  });
}

export async function handleGuardianBonded(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, guardian, amount, timestamp } = data;

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'guardian_bonded',
      description: `Professional guardian ${guardian} posted bond of ${amount} tokens`,
      actorWallet: guardian,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot, amount: amount.toString() },
    },
  });
}

export async function handleGuardianSlashed(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, guardian, amount, timestamp } = data;

  await prisma.proGuardianProfile.update({
    where: { wallet: guardian },
    data: {
      reputationScore: { decrement: 10 },
    },
  });

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'guardian_slashed',
      description: `Professional guardian ${guardian} slashed by ${amount} tokens due to dispute`,
      actorWallet: guardian,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot, amount: amount.toString() },
    },
  });
}
