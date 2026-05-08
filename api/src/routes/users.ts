import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../services/vaultService';

export async function userRoutes(fastify: FastifyInstance) {

  // GET /v1/users/:wallet/profile
  fastify.get<{ Params: { wallet: string } }>(
    '/:wallet/profile',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { wallet } = request.params;

      const profile = await prisma.userProfile.findUnique({ where: { wallet } });
      if (!profile) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: 'Profile not found.' },
        });
      }

      return reply.send({
        data: {
          wallet: profile.wallet,
          name: profile.name,
          avatar: profile.avatarUrl,
          email: profile.email
            ? profile.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
            : null,
          smsEnabled: !!profile.smsNumber,
        },
      });
    }
  );

  // POST /v1/users/:wallet/profile
  fastify.post<{ Params: { wallet: string } }>(
    '/:wallet/profile',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { wallet } = request.params;

      if (request.user!.wallet !== wallet) {
        return reply.code(403).send({
          error: { code: 'FORBIDDEN', message: 'Cannot update another user\'s profile.' },
        });
      }

      const schema = z.object({
        name: z.string().max(64).optional(),
        avatar: z.string().url().optional(),
      });

      const body = schema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({
          error: { code: 'VALIDATION_ERROR', message: body.error.message },
        });
      }

      const updated = await prisma.userProfile.upsert({
        where: { wallet },
        update: {
          ...(body.data.name !== undefined && { name: body.data.name }),
          ...(body.data.avatar !== undefined && { avatarUrl: body.data.avatar }),
        },
        create: { wallet, name: body.data.name, avatarUrl: body.data.avatar },
      });

      return reply.send({
        data: { wallet: updated.wallet, name: updated.name, avatar: updated.avatarUrl },
      });
    }
  );

  // GET /v1/users/:wallet/notification-preferences
  fastify.get<{ Params: { wallet: string } }>(
    '/:wallet/notification-preferences',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { wallet } = request.params;

      if (request.user!.wallet !== wallet) {
        return reply.code(403).send({ error: { code: 'FORBIDDEN', message: 'Forbidden.' } });
      }

      const profile = await prisma.userProfile.findUnique({ where: { wallet } });
      const prefs = (profile?.notificationPrefs as Record<string, boolean>) ?? {};

      return reply.send({
        data: {
          emailEnabled: prefs.emailEnabled ?? true,
          smsEnabled: prefs.smsEnabled ?? false,
          pushEnabled: prefs.pushEnabled ?? false,
        },
      });
    }
  );

  // PUT /v1/users/:wallet/notification-preferences
  fastify.put<{ Params: { wallet: string } }>(
    '/:wallet/notification-preferences',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { wallet } = request.params;

      if (request.user!.wallet !== wallet) {
        return reply.code(403).send({ error: { code: 'FORBIDDEN', message: 'Forbidden.' } });
      }

      const schema = z.object({
        emailEnabled: z.boolean().optional(),
        smsEnabled: z.boolean().optional(),
        pushEnabled: z.boolean().optional(),
      });

      const body = schema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: body.error.message } });
      }

      const current = await prisma.userProfile.findUnique({ where: { wallet } });
      const currentPrefs = (current?.notificationPrefs as Record<string, boolean>) ?? {};

      const updatedPrefs = { ...currentPrefs, ...body.data };

      await prisma.userProfile.upsert({
        where: { wallet },
        update: { notificationPrefs: updatedPrefs },
        create: { wallet, notificationPrefs: updatedPrefs },
      });

      return reply.send({ data: updatedPrefs });
    }
  );
}
