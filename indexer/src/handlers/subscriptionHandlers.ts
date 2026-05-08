import { PrismaClient } from '@prisma/client';
import { EventContext } from '../services/eventProcessor';

export async function handleSubscriptionUpdated(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, tier, expiry, timestamp } = data;

  const tierStr = typeof tier === 'string' ? tier : Object.keys(tier)[0];

  await prisma.vault.update({
    where: { pubkey: vault },
    data: {
      subscriptionTier: tierStr,
      subscriptionExpiry: BigInt(expiry),
    },
  });

  await prisma.subscription.upsert({
    where: { vaultPubkey: vault },
    update: {
      tier: tierStr,
      expiresAt: BigInt(expiry),
      lastPaymentAt: BigInt(timestamp),
      paymentTx: ctx.signature,
    },
    create: {
      vaultPubkey: vault,
      tier: tierStr,
      startedAt: BigInt(timestamp),
      expiresAt: BigInt(expiry),
      lastPaymentAt: BigInt(timestamp),
      paymentTx: ctx.signature,
    },
  });

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'subscription_updated',
      description: `Subscription updated to ${tierStr}`,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot, tier: tierStr, expiry },
    },
  });
}
