import { PrismaClient } from '@prisma/client';
import { EventContext } from '../services/eventProcessor';

export async function handleDeposited(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, from, mint, amount, timestamp } = data;

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'deposit',
      description: `Deposited ${amount} ${mint === '11111111111111111111111111111111' ? 'SOL' : 'tokens'} from ${from}`,
      actorWallet: from,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot, mint, amount: amount.toString() },
    },
  });
}

export async function handleWithdrawn(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, to, mint, amount, timestamp } = data;

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'withdrawal',
      description: `Withdrawn ${amount} ${mint === '11111111111111111111111111111111' ? 'SOL' : 'tokens'} to ${to}`,
      actorWallet: to,
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot, mint, amount: amount.toString() },
    },
  });
}
