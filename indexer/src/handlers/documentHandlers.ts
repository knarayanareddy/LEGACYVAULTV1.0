import { PrismaClient } from '@prisma/client';
import { EventContext } from '../services/eventProcessor';

export async function handleDocumentSet(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, docHash, docUri, timestamp } = data;

  await prisma.vault.update({
    where: { pubkey: vault },
    data: {
      docHash,
      docUri,
      docUpdatedAt: BigInt(timestamp),
    },
  });

  // If we find a matching document record created by the API, link the on-chain tx
  await prisma.document.updateMany({
    where: {
      vaultPubkey: vault,
      hash: docHash,
    },
    data: {
      onChainTx: ctx.signature,
    },
  });

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'document_set',
      description: 'Legacy document hash/URI updated on-chain',
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot, docHash, docUri },
    },
  });
}

export async function handleDocumentRevoked(
  data: Record<string, any>,
  ctx: EventContext,
  prisma: PrismaClient
) {
  const { vault, timestamp } = data;

  await prisma.vault.update({
    where: { pubkey: vault },
    data: {
      docHash: null,
      docUri: null,
      docUpdatedAt: BigInt(timestamp),
    },
  });

  await prisma.activityLog.create({
    data: {
      vaultPubkey: vault,
      activityType: 'document_revoked',
      description: 'Legacy document revoked on-chain',
      txSignature: ctx.signature,
      timestamp: BigInt(timestamp),
      metadata: { slot: ctx.slot },
    },
  });
}
