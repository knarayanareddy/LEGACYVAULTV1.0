import { PrismaClient } from '@prisma/client';
import { EventContext } from '../services/eventProcessor';

export async function handleBeneficiaryAdded(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, beneficiary, shareBps, timestamp } = data;

  await prisma.beneficiary.create({
    data: {
      vaultPubkey: vault,
      beneficiaryWallet: beneficiary,
      shareBps,
      active: true,
      addedAt: BigInt(timestamp),
      updatedAt: BigInt(timestamp),
    },
  });

  await prisma.vault.update({
    where: { pubkey: vault },
    data: {
      beneficiaryCount: { increment: 1 },
      totalBps: { increment: shareBps },
    },
  });

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'beneficiary_added',
      description: `Beneficiary ${beneficiary} added with ${shareBps / 100}% share`,
      actorWallet: beneficiary,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot },
    },
  });
}

export async function handleBeneficiaryUpdated(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, beneficiary, newShareBps, active, timestamp } = data;

  const current = await prisma.beneficiary.findUnique({
    where: {
      vaultPubkey_beneficiaryWallet: { vaultPubkey: vault, beneficiaryWallet: beneficiary },
    },
  });

  if (!current) return;

  const shareDiff = newShareBps - current.shareBps;

  await prisma.beneficiary.update({
    where: {
      vaultPubkey_beneficiaryWallet: { vaultPubkey: vault, beneficiaryWallet: beneficiary },
    },
    data: {
      shareBps: newShareBps,
      active,
      updatedAt: BigInt(timestamp),
    },
  });

  await prisma.vault.update({
    where: { pubkey: vault },
    data: {
      totalBps: { increment: shareDiff },
    },
  });

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'beneficiary_updated',
      description: `Beneficiary ${beneficiary} updated`,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot, newShareBps, active },
    },
  });
}

export async function handleBeneficiaryRemoved(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, beneficiary, timestamp } = data;

  const current = await prisma.beneficiary.findUnique({
    where: {
      vaultPubkey_beneficiaryWallet: { vaultPubkey: vault, beneficiaryWallet: beneficiary },
    },
  });

  if (!current) return;

  await prisma.beneficiary.delete({
    where: {
      vaultPubkey_beneficiaryWallet: { vaultPubkey: vault, beneficiaryWallet: beneficiary },
    },
  });

  await prisma.vault.update({
    where: { pubkey: vault },
    data: {
      beneficiaryCount: { decrement: 1 },
      totalBps: { decrement: current.shareBps },
    },
  });

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'beneficiary_removed',
      description: `Beneficiary ${beneficiary} removed`,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot },
    },
  });
}

export async function handleAssetRuleSet(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, beneficiary, mint, mode, fixedBps, timestamp } = data;

  const modeStr = typeof mode === 'string' ? mode : Object.keys(mode)[0];

  const benRecord = await prisma.beneficiary.findUnique({
    where: {
      vaultPubkey_beneficiaryWallet: { vaultPubkey: vault, beneficiaryWallet: beneficiary },
    },
  });

  if (!benRecord) return;

  await prisma.assetRule.upsert({
    where: {
      beneficiaryId_mint: { beneficiaryId: benRecord.id, mint },
    },
    update: {
      mode: modeStr,
      fixedBps: fixedBps,
    },
    create: {
      beneficiaryId: benRecord.id,
      vaultPubkey: vault,
      mint,
      mode: modeStr,
      fixedBps: fixedBps,
    },
  });

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'asset_rule_set',
      description: `Asset rule for ${mint} set to ${modeStr} for ${beneficiary}`,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot, beneficiary, mint, modeStr },
    },
  });
}

export async function handleAssetRuleCleared(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, beneficiary, mint, timestamp } = data;

  const benRecord = await prisma.beneficiary.findUnique({
    where: {
      vaultPubkey_beneficiaryWallet: { vaultPubkey: vault, beneficiaryWallet: beneficiary },
    },
  });

  if (!benRecord) return;

  await prisma.assetRule.deleteMany({
    where: {
      beneficiaryId: benRecord.id,
      mint,
    },
  });

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'asset_rule_cleared',
      description: `Asset rule for ${mint} cleared for ${beneficiary}`,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot, beneficiary, mint },
    },
  });
}
