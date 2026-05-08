// api/src/services/document.service.ts
import { PrismaClient } from '@prisma/client';
import { uploadToArweave } from './arweave.adapter';
// import { uploadToShadow } from './shadow.adapter';
// import { uploadToS3 } from './s3.adapter';

const prisma = new PrismaClient();

export interface DocumentUploadParams {
  vaultPubkey: string;
  documentType: string;
  name: string;
  buffer: Buffer;
  contentType: string;
}

export async function uploadDocument(params: DocumentUploadParams) {
  // 1. Upload to storage (default Arweave for Build 9)
  const { uri, txId } = await uploadToArweave(params.buffer, params.contentType);

  // 2. Create DB record
  const doc = await prisma.document.create({
    data: {
      vaultPubkey: params.vaultPubkey,
      documentType: params.documentType,
      name: params.name,
      sizeBytes: params.buffer.length,
      hash: 'sha256-placeholder', // Should calculate real hash
      storageUri: uri,
      storageBackend: 'arweave',
      encrypted: true,
      onChainTx: txId,
    },
  });

  return doc;
}

export async function getVaultDocuments(vaultPubkey: string) {
  return await prisma.document.findMany({
    where: { 
      vaultPubkey,
      revoked: false,
    },
    orderBy: { uploadedAt: 'desc' },
  });
}
