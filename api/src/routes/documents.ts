import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../services/vaultService';

export async function documentRoutes(fastify: FastifyInstance) {

  // POST /v1/vaults/:vaultPubkey/documents/upload-url
  fastify.post<{ Params: { vaultPubkey: string } }>(
    '/:vaultPubkey/documents/upload-url',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { vaultPubkey } = request.params;
      const wallet = request.user!.wallet;

      const vault = await prisma.vault.findUnique({ where: { pubkey: vaultPubkey } });
      if (!vault || vault.ownerPubkey !== wallet) {
        return reply.code(403).send({
          error: { code: 'FORBIDDEN', message: 'Only the vault owner can upload documents.' },
        });
      }

      const schema = z.object({
        filename: z.string().max(256),
        mimeType: z.string().max(128),
        sizeBytes: z.number().int().positive(),
        documentType: z.enum(['will', 'letter', 'legal', 'identity', 'financial', 'other']),
        hash: z.string().length(64),
      });

      const body = schema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: body.error.message } });
      }

      // Create pending document record
      const doc = await prisma.document.create({
        data: {
          vaultPubkey,
          documentType: body.data.documentType,
          name: body.data.filename,
          sizeBytes: BigInt(body.data.sizeBytes),
          hash: body.data.hash,
          storageUri: '',           // Will be updated on confirm
          storageBackend: 's3',
          encrypted: true,
        },
      });

      // In production: generate a real presigned S3 URL
      const uploadUrl = `https://your-s3-bucket.s3.amazonaws.com/vaults/${vaultPubkey}/${doc.id}?presigned=true`;
      const storageUri = `s3://your-s3-bucket/vaults/${vaultPubkey}/${doc.id}`;

      // Store the expected URI for confirmation step
      await prisma.document.update({
        where: { id: doc.id },
        data: { storageUri },
      });

      return reply.send({
        data: {
          uploadUrl,
          docId: doc.id,
          expiresAt: Math.floor(Date.now() / 1000) + 3600,
        },
      });
    }
  );

  // POST /v1/vaults/:vaultPubkey/documents/:docId/confirm
  fastify.post<{ Params: { vaultPubkey: string; docId: string } }>(
    '/:vaultPubkey/documents/:docId/confirm',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { vaultPubkey, docId } = request.params;

      const schema = z.object({
        onChainTxSignature: z.string().min(1),
      });

      const body = schema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: body.error.message } });
      }

      const doc = await prisma.document.update({
        where: { id: docId, vaultPubkey },
        data: { onChainTx: body.data.onChainTxSignature },
      });

      return reply.send({ data: { id: doc.id, confirmed: true } });
    }
  );

  // DELETE /v1/vaults/:vaultPubkey/documents/:docId
  fastify.delete<{ Params: { vaultPubkey: string; docId: string } }>(
    '/:vaultPubkey/documents/:docId',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { vaultPubkey, docId } = request.params;
      const wallet = request.user!.wallet;

      const vault = await prisma.vault.findUnique({ where: { pubkey: vaultPubkey } });
      if (!vault || vault.ownerPubkey !== wallet) {
        return reply.code(403).send({ error: { code: 'FORBIDDEN', message: 'Forbidden.' } });
      }

      await prisma.document.update({
        where: { id: docId, vaultPubkey },
        data: { revoked: true, revokedAt: new Date() },
      });

      return reply.code(204).send();
    }
  );
}
