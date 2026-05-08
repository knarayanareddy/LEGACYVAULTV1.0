import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import * as txBuilder from '../services/txBuilderService';

// ─────────────────────────────────────────────────────────────────────────────
// Shared base schema — every tx endpoint requires feePayer
// ─────────────────────────────────────────────────────────────────────────────

const baseTxSchema = z.object({
  feePayer: z.string().min(32).max(44),
});

export async function transactionRoutes(fastify: FastifyInstance) {

  // ═══════════════════════════════════════════════════════════════════════════
  // VAULT LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════════

  fastify.post(
    '/create-vault',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const schema = baseTxSchema.extend({
        vaultNonce: z.number().int().min(0).max(255).default(0),
        inactivityThreshold: z.number().int().min(2592000).max(31536000),
        timelockDuration: z.number().int().min(86400).max(7776000),
        guardianThreshold: z.number().int().min(1).max(20),
      });

      const body = schema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: body.error.message } });
      }

      const result = await txBuilder.buildCreateVaultTx(
        body.data.feePayer,
        body.data.vaultNonce,
        body.data.inactivityThreshold,
        body.data.timelockDuration,
        body.data.guardianThreshold
      );

      return reply.send({ data: result });
    }
  );

  fastify.post(
    '/update-vault-settings',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const schema = baseTxSchema.extend({
        vault: z.string().min(32).max(44),
        inactivityThreshold: z.number().int().optional(),
        timelockDuration: z.number().int().optional(),
        guardianThreshold: z.number().int().optional(),
        arbiter: z.string().optional(),
      });

      const body = schema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: body.error.message } });
      }

      const result = await txBuilder.buildUpdateVaultSettingsTx(
        body.data.feePayer,
        body.data.vault,
        body.data.inactivityThreshold,
        body.data.timelockDuration,
        body.data.guardianThreshold
      );

      return reply.send({ data: result });
    }
  );

  fastify.post(
    '/freeze-vault',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const schema = baseTxSchema.extend({ vault: z.string().min(32).max(44) });
      const body = schema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: body.error.message } });
      }

      const result = await txBuilder.buildFreezeVaultTx(body.data.feePayer, body.data.vault);
      return reply.send({ data: result });
    }
  );

  fastify.post(
    '/unfreeze-vault',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const schema = baseTxSchema.extend({ vault: z.string().min(32).max(44) });
      const body = schema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: body.error.message } });
      }

      const result = await txBuilder.buildUnfreezeVaultTx(body.data.feePayer, body.data.vault);
      return reply.send({ data: result });
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // GUARDIANS
  // ═══════════════════════════════════════════════════════════════════════════

  fastify.post(
    '/add-guardian',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const schema = baseTxSchema.extend({
        vault: z.string().min(32).max(44),
        guardianWallet: z.string().min(32).max(44),
        role: z.enum(['personal', 'professional', 'delegate']),
      });

      const body = schema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: body.error.message } });
      }

      const result = await txBuilder.buildAddGuardianTx(
        body.data.feePayer,
        body.data.vault,
        body.data.guardianWallet,
        body.data.role
      );

      return reply.send({ data: result });
    }
  );

  fastify.post(
    '/remove-guardian',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const schema = baseTxSchema.extend({
        vault: z.string().min(32).max(44),
        guardianWallet: z.string().min(32).max(44),
      });

      const body = schema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: body.error.message } });
      }

      const result = await txBuilder.buildRemoveGuardianTx(
        body.data.feePayer,
        body.data.vault,
        body.data.guardianWallet
      );

      return reply.send({ data: result });
    }
  );

  fastify.post(
    '/set-guardian-threshold',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const schema = baseTxSchema.extend({
        vault: z.string().min(32).max(44),
        threshold: z.number().int().min(1).max(20),
      });

      const body = schema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: body.error.message } });
      }

      const result = await txBuilder.buildSetGuardianThresholdTx(
        body.data.feePayer,
        body.data.vault,
        body.data.threshold
      );

      return reply.send({ data: result });
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // BENEFICIARIES
  // ═══════════════════════════════════════════════════════════════════════════

  fastify.post(
    '/add-beneficiary',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const schema = baseTxSchema.extend({
        vault: z.string().min(32).max(44),
        beneficiaryWallet: z.string().min(32).max(44),
        shareBps: z.number().int().min(1).max(10000),
        active: z.boolean().default(true),
      });

      const body = schema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: body.error.message } });
      }

      const result = await txBuilder.buildAddBeneficiaryTx(
        body.data.feePayer,
        body.data.vault,
        body.data.beneficiaryWallet,
        body.data.shareBps,
        body.data.active
      );

      return reply.send({ data: result });
    }
  );

  fastify.post(
    '/update-beneficiary',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const schema = baseTxSchema.extend({
        vault: z.string().min(32).max(44),
        beneficiaryWallet: z.string().min(32).max(44),
        shareBps: z.number().int().min(1).max(10000).optional(),
        active: z.boolean().optional(),
      });

      const body = schema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: body.error.message } });
      }

      const result = await txBuilder.buildUpdateBeneficiaryTx(
        body.data.feePayer,
        body.data.vault,
        body.data.beneficiaryWallet,
        body.data.shareBps,
        body.data.active
      );

      return reply.send({ data: result });
    }
  );

  fastify.post(
    '/remove-beneficiary',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const schema = baseTxSchema.extend({
        vault: z.string().min(32).max(44),
        beneficiaryWallet: z.string().min(32).max(44),
      });

      const body = schema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: body.error.message } });
      }

      const result = await txBuilder.buildRemoveBeneficiaryTx(
        body.data.feePayer,
        body.data.vault,
        body.data.beneficiaryWallet
      );

      return reply.send({ data: result });
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // DEPOSITS & WITHDRAWALS
  // ═══════════════════════════════════════════════════════════════════════════

  fastify.post(
    '/deposit-sol',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const schema = baseTxSchema.extend({
        vault: z.string().min(32).max(44),
        lamports: z.number().int().positive(),
      });

      const body = schema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: body.error.message } });
      }

      const result = await txBuilder.buildDepositSolTx(
        body.data.feePayer,
        body.data.vault,
        body.data.lamports
      );

      return reply.send({ data: result });
    }
  );

  fastify.post(
    '/withdraw-sol',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const schema = baseTxSchema.extend({
        vault: z.string().min(32).max(44),
        lamports: z.number().int().positive(),
      });

      const body = schema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: body.error.message } });
      }

      const result = await txBuilder.buildWithdrawSolTx(
        body.data.feePayer,
        body.data.vault,
        body.data.lamports
      );

      return reply.send({ data: result });
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // LIVENESS
  // ═══════════════════════════════════════════════════════════════════════════

  fastify.post(
    '/check-in',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const schema = baseTxSchema.extend({ vault: z.string().min(32).max(44) });
      const body = schema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: body.error.message } });
      }

      const result = await txBuilder.buildCheckInTx(body.data.feePayer, body.data.vault);
      return reply.send({ data: result });
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // DOCUMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  fastify.post(
    '/set-document-commitment',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const schema = baseTxSchema.extend({
        vault: z.string().min(32).max(44),
        docHash: z.string().length(64),
        docUri: z.string().max(256),
      });

      const body = schema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: body.error.message } });
      }

      const result = await txBuilder.buildSetDocumentCommitmentTx(
        body.data.feePayer,
        body.data.vault,
        body.data.docHash,
        body.data.docUri
      );

      return reply.send({ data: result });
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // UNLOCK
  // ═══════════════════════════════════════════════════════════════════════════

  fastify.post(
    '/initiate-unlock',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const schema = baseTxSchema.extend({ vault: z.string().min(32).max(44) });
      const body = schema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: body.error.message } });
      }

      const result = await txBuilder.buildInitiateUnlockTx(body.data.feePayer, body.data.vault);
      return reply.send({ data: result });
    }
  );

  fastify.post(
    '/approve-unlock',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const schema = baseTxSchema.extend({ vault: z.string().min(32).max(44) });
      const body = schema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: body.error.message } });
      }

      const result = await txBuilder.buildApproveUnlockTx(body.data.feePayer, body.data.vault);
      return reply.send({ data: result });
    }
  );

  fastify.post(
    '/cancel-unlock',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const schema = baseTxSchema.extend({ vault: z.string().min(32).max(44) });
      const body = schema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: body.error.message } });
      }

      const result = await txBuilder.buildCancelUnlockTx(body.data.feePayer, body.data.vault);
      return reply.send({ data: result });
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // DISTRIBUTION
  // ═══════════════════════════════════════════════════════════════════════════

  fastify.post(
    '/init-dist-sol',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const schema = baseTxSchema.extend({ vault: z.string().min(32).max(44) });
      const body = schema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: body.error.message } });
      }

      const result = await txBuilder.buildInitSolDistributionTx(body.data.feePayer, body.data.vault);
      return reply.send({ data: result });
    }
  );

  fastify.post(
    '/exec-dist-sol-batch',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const schema = baseTxSchema.extend({
        vault: z.string().min(32).max(44),
        startIndex: z.number().int().min(0),
        batchSize: z.number().int().min(1).max(10),
      });

      const body = schema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: body.error.message } });
      }

      const result = await txBuilder.buildExecSolDistributionBatchTx(
        body.data.feePayer,
        body.data.vault,
        body.data.startIndex,
        body.data.batchSize
      );

      return reply.send({ data: result });
    }
  );

  fastify.post(
    '/init-dist-spl',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const schema = baseTxSchema.extend({
        vault: z.string().min(32).max(44),
        mint: z.string().min(32).max(44),
        createMissingAtas: z.boolean().default(false),
      });

      const body = schema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: body.error.message } });
      }

      const result = await txBuilder.buildInitSplDistributionTx(
        body.data.feePayer,
        body.data.vault,
        body.data.mint,
        body.data.createMissingAtas
      );

      return reply.send({ data: result });
    }
  );

  fastify.post(
    '/exec-dist-spl-batch',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const schema = baseTxSchema.extend({
        vault: z.string().min(32).max(44),
        mint: z.string().min(32).max(44),
        startIndex: z.number().int().min(0),
        batchSize: z.number().int().min(1).max(10),
        createMissingAtas: z.boolean().default(false),
      });

      const body = schema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: body.error.message } });
      }

      const result = await txBuilder.buildExecSplDistributionBatchTx(
        body.data.feePayer,
        body.data.vault,
        body.data.mint,
        body.data.startIndex,
        body.data.batchSize,
        body.data.createMissingAtas
      );

      return reply.send({ data: result });
    }
  );

  fastify.post(
    '/finalize-unlock',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const schema = baseTxSchema.extend({ vault: z.string().min(32).max(44) });
      const body = schema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: body.error.message } });
      }

      const result = await txBuilder.buildFinalizeUnlockTx(body.data.feePayer, body.data.vault);
      return reply.send({ data: result });
    }
  );
}
