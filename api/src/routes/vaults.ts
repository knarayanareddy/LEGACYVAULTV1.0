import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import { redis } from '../config/redis';
import * as vaultService from '../services/vaultService';
import { prisma } from '../services/vaultService';

// ─────────────────────────────────────────────────────────────────────────────
// Role resolution helper
// ─────────────────────────────────────────────────────────────────────────────

async function resolveRole(
  wallet: string,
  vaultPubkey: string
): Promise<'owner' | 'guardian' | 'beneficiary' | 'viewer'> {
  const vault = await prisma.vault.findUnique({ where: { pubkey: vaultPubkey } });
  if (!vault) return 'viewer';
  if (vault.ownerPubkey === wallet) return 'owner';

  const isGuardian = await prisma.guardian.findFirst({
    where: { vaultPubkey, guardianWallet: wallet, status: { in: ['active', 'pending'] } },
  });
  if (isGuardian) return 'guardian';

  const isBeneficiary = await prisma.beneficiary.findFirst({
    where: { vaultPubkey, beneficiaryWallet: wallet },
  });
  if (isBeneficiary) return 'beneficiary';

  return 'viewer';
}

export async function vaultRoutes(fastify: FastifyInstance) {

  // ─── GET /v1/vaults/:vaultPubkey/summary ─────────────────────────────────
  fastify.get<{ Params: { vaultPubkey: string } }>(
    '/:vaultPubkey/summary',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { vaultPubkey } = request.params;
      const wallet = request.user!.wallet;

      const cacheKey = `vault:summary:${vaultPubkey}`;
      const cached = await redis.get(cacheKey);
      if (cached) return reply.send({ data: JSON.parse(cached) });

      const summary = await vaultService.getVaultSummary(vaultPubkey, wallet);
      await redis.setex(cacheKey, 15, JSON.stringify(summary));

      return reply.send({ data: summary });
    }
  );

  // ─── GET /v1/vaults/:vaultPubkey/assets ──────────────────────────────────
  fastify.get<{
    Params: { vaultPubkey: string };
    Querystring: { filter?: string };
  }>(
    '/:vaultPubkey/assets',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { vaultPubkey } = request.params;
      const wallet = request.user!.wallet;
      const filter = (request.query.filter || 'all') as 'all' | 'SOL' | 'SPL' | 'NFT' | 'POSITION';

      const role = await resolveRole(wallet, vaultPubkey);
      if (role === 'viewer') {
        return reply.code(403).send({
          error: { code: 'FORBIDDEN', message: 'Insufficient permissions to view vault assets.' },
        });
      }

      const cacheKey = `vault:assets:${vaultPubkey}:${filter}`;
      const cached = await redis.get(cacheKey);
      if (cached) return reply.send({ data: JSON.parse(cached) });

      const assets = await vaultService.getVaultAssets(vaultPubkey, filter);
      await redis.setex(cacheKey, 30, JSON.stringify(assets));

      return reply.send({ data: assets });
    }
  );

  // ─── GET /v1/vaults/:vaultPubkey/guardians ────────────────────────────────
  fastify.get<{ Params: { vaultPubkey: string } }>(
    '/:vaultPubkey/guardians',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { vaultPubkey } = request.params;
      const wallet = request.user!.wallet;

      const role = await resolveRole(wallet, vaultPubkey);
      if (role === 'viewer' || role === 'beneficiary') {
        return reply.code(403).send({
          error: { code: 'FORBIDDEN', message: 'Insufficient permissions.' },
        });
      }

      const guardians = await vaultService.getVaultGuardians(vaultPubkey);
      return reply.send({ data: guardians });
    }
  );

  // ─── GET /v1/vaults/:vaultPubkey/beneficiaries ───────────────────────────
  fastify.get<{ Params: { vaultPubkey: string } }>(
    '/:vaultPubkey/beneficiaries',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { vaultPubkey } = request.params;
      const wallet = request.user!.wallet;

      const role = await resolveRole(wallet, vaultPubkey);
      if (role === 'viewer') {
        return reply.code(403).send({
          error: { code: 'FORBIDDEN', message: 'Insufficient permissions.' },
        });
      }

      let beneficiaries = await vaultService.getVaultBeneficiaries(vaultPubkey);

      // Beneficiaries only see their own record
      if (role === 'beneficiary') {
        beneficiaries = beneficiaries.filter((b) => b.pubkey === wallet);
      }

      return reply.send({ data: beneficiaries });
    }
  );

  // ─── GET /v1/vaults/:vaultPubkey/liveness/summary ────────────────────────
  fastify.get<{ Params: { vaultPubkey: string } }>(
    '/:vaultPubkey/liveness/summary',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { vaultPubkey } = request.params;
      const wallet = request.user!.wallet;

      const role = await resolveRole(wallet, vaultPubkey);
      if (role === 'viewer') {
        return reply.code(403).send({
          error: { code: 'FORBIDDEN', message: 'Insufficient permissions.' },
        });
      }

      const summary = await vaultService.getLivenessSummary(vaultPubkey);
      return reply.send({ data: summary });
    }
  );

  // ─── GET /v1/vaults/:vaultPubkey/liveness/history ────────────────────────
  fastify.get<{
    Params: { vaultPubkey: string };
    Querystring: { range?: string };
  }>(
    '/:vaultPubkey/liveness/history',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { vaultPubkey } = request.params;
      const range = (request.query.range || '30d') as '30d' | '90d' | '1y';

      const history = await vaultService.getLivenessHistory(vaultPubkey, range);
      return reply.send({ data: history });
    }
  );

  // ─── GET /v1/vaults/:vaultPubkey/distribution/state ──────────────────────
  fastify.get<{ Params: { vaultPubkey: string } }>(
    '/:vaultPubkey/distribution/state',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { vaultPubkey } = request.params;

      const state = await vaultService.getDistributionState(vaultPubkey);
      return reply.send({ data: state });
    }
  );

  // ─── GET /v1/vaults/:vaultPubkey/documents ───────────────────────────────
  fastify.get<{ Params: { vaultPubkey: string } }>(
    '/:vaultPubkey/documents',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { vaultPubkey } = request.params;
      const wallet = request.user!.wallet;

      const role = await resolveRole(wallet, vaultPubkey);
      if (role === 'viewer') {
        return reply.code(403).send({
          error: { code: 'FORBIDDEN', message: 'Insufficient permissions.' },
        });
      }

      const documents = await vaultService.getVaultDocuments(vaultPubkey);

      // Non-owners see limited metadata (no URI)
      if (role !== 'owner') {
        return reply.send({
          data: documents.map((d) => ({ ...d, uri: '[RESTRICTED]' })),
        });
      }

      return reply.send({ data: documents });
    }
  );

  // ─── GET /v1/vaults/:vaultPubkey/documents/:docId/download-url ───────────
  fastify.get<{
    Params: { vaultPubkey: string; docId: string };
  }>(
    '/:vaultPubkey/documents/:docId/download-url',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { vaultPubkey, docId } = request.params;
      const wallet = request.user!.wallet;

      const role = await resolveRole(wallet, vaultPubkey);
      if (role !== 'owner') {
        return reply.code(403).send({
          error: { code: 'FORBIDDEN', message: 'Only the vault owner can download documents.' },
        });
      }

      const doc = await prisma.document.findFirst({
        where: { id: docId, vaultPubkey, revoked: false },
      });

      if (!doc) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: 'Document not found.' },
        });
      }

      const downloadUrl = doc.storageUri;
      const expiresAt = Math.floor(Date.now() / 1000) + 300; // 5 min

      return reply.send({ data: { url: downloadUrl, expiresAt } });
    }
  );

  // ─── GET /v1/vaults/:vaultPubkey/activity ────────────────────────────────
  fastify.get<{
    Params: { vaultPubkey: string };
    Querystring: { limit?: string; offset?: string; type?: string };
  }>(
    '/:vaultPubkey/activity',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { vaultPubkey } = request.params;
      const limit = Math.min(parseInt(request.query.limit || '50', 10), 100);
      const offset = parseInt(request.query.offset || '0', 10);
      const activityType = request.query.type;

      const { activities, total } = await vaultService.getVaultActivity(
        vaultPubkey,
        limit,
        offset,
        activityType
      );

      return reply.send({
        data: activities,
        meta: { total, limit, offset, hasMore: offset + limit < total },
      });
    }
  );

  // ─── GET /v1/vaults/:vaultPubkey/notifications ───────────────────────────
  fastify.get<{
    Params: { vaultPubkey: string };
    Querystring: { limit?: string; unread?: string };
  }>(
    '/:vaultPubkey/notifications',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const wallet = request.user!.wallet;
      const limit = Math.min(parseInt(request.query.limit || '50', 10), 100);
      const unreadOnly = request.query.unread === 'true';

      const notifications = await vaultService.getNotifications(
        wallet,
        limit,
        unreadOnly
      );

      return reply.send({ data: notifications });
    }
  );

  // ─── PATCH /v1/vaults/:vaultPubkey/notifications/:notifId/read ───────────
  fastify.patch<{
    Params: { vaultPubkey: string; notifId: string };
  }>(
    '/:vaultPubkey/notifications/:notifId/read',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { notifId } = request.params;
      const wallet = request.user!.wallet;

      await prisma.notification.updateMany({
        where: { id: notifId, targetWallet: wallet },
        data: { read: true },
      });

      return reply.code(204).send();
    }
  );

  // ─── PATCH /v1/vaults/:vaultPubkey/notifications/read-all ────────────────
  fastify.patch<{ Params: { vaultPubkey: string } }>(
    '/:vaultPubkey/notifications/read-all',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const wallet = request.user!.wallet;
      const { vaultPubkey } = request.params;

      await prisma.notification.updateMany({
        where: { targetWallet: wallet, vaultPubkey },
        data: { read: true },
      });

      return reply.code(204).send();
    }
  );

  // ─── GET /v1/vaults/:vaultPubkey/portfolio/summary ───────────────────────
  fastify.get<{ Params: { vaultPubkey: string } }>(
    '/:vaultPubkey/portfolio/summary',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { vaultPubkey } = request.params;

      const cacheKey = `portfolio:summary:${vaultPubkey}`;
      const cached = await redis.get(cacheKey);
      if (cached) return reply.send({ data: JSON.parse(cached) });

      const summary = await vaultService.getPortfolioSummary(vaultPubkey);
      await redis.setex(cacheKey, 60, JSON.stringify(summary));

      return reply.send({ data: summary });
    }
  );

  // ─── GET /v1/vaults/:vaultPubkey/portfolio/history ───────────────────────
  fastify.get<{
    Params: { vaultPubkey: string };
    Querystring: { range?: string };
  }>(
    '/:vaultPubkey/portfolio/history',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { vaultPubkey } = request.params;
      const range = (request.query.range || '30d') as '30d' | '90d' | '1y';

      const history = await vaultService.getPortfolioHistory(vaultPubkey, range);
      return reply.send({ data: history });
    }
  );

  // ─── GET /v1/vaults/:vaultPubkey/portfolio/distribution ──────────────────
  fastify.get<{ Params: { vaultPubkey: string } }>(
    '/:vaultPubkey/portfolio/distribution',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { vaultPubkey } = request.params;

      const cacheKey = `portfolio:dist:${vaultPubkey}`;
      const cached = await redis.get(cacheKey);
      if (cached) return reply.send({ data: JSON.parse(cached) });

      const distribution = await vaultService.getPortfolioDistribution(vaultPubkey);
      await redis.setex(cacheKey, 60, JSON.stringify(distribution));

      return reply.send({ data: distribution });
    }
  );
}
