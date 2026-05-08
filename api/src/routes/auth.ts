import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { redis } from '../config/redis';
import { prisma } from '../services/vaultService';
import { verifySIWSSignature } from '../lib/siws';
import { signJWT, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { config } from '../config/constants';
import { authMiddleware } from '../middleware/auth';

const NONCE_TTL = 300; // 5 minutes in seconds

export async function authRoutes(fastify: FastifyInstance) {
  // ─── GET /v1/auth/nonce ───────────────────────────────────────────────────
  fastify.get<{ Querystring: { wallet: string } }>(
    '/nonce',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['wallet'],
          properties: {
            wallet: { type: 'string', minLength: 32, maxLength: 44 },
          },
        },
      },
    },
    async (request, reply) => {
      const { wallet } = request.query;

      const nonce = nanoid(21);
      const expiresAt = Math.floor(Date.now() / 1000) + NONCE_TTL;

      // Store nonce in Redis with TTL
      await redis.setex(`auth:nonce:${wallet}`, NONCE_TTL, nonce);

      // Upsert in Postgres as backup
      await prisma.authNonce.upsert({
        where: { wallet },
        update: {
          nonce,
          expiresAt: new Date(expiresAt * 1000),
          used: false,
        },
        create: {
          wallet,
          nonce,
          expiresAt: new Date(expiresAt * 1000),
          used: false,
        },
      });

      return reply.send({ data: { nonce, expiresAt } });
    }
  );

  // ─── POST /v1/auth/verify ─────────────────────────────────────────────────
  const verifySchema = z.object({
    pubkey: z.string().min(32).max(44),
    signature: z.string().min(1),
    message: z.string().min(1),
  });

  fastify.post(
    '/verify',
    async (request, reply) => {
      const body = verifySchema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({
          error: { code: 'VALIDATION_ERROR', message: body.error.message },
        });
      }

      const { pubkey, signature, message } = body.data;

      // Retrieve nonce
      const storedNonce = await redis.get(`auth:nonce:${pubkey}`);
      if (!storedNonce) {
        return reply.code(401).send({
          error: { code: 'NONCE_EXPIRED', message: 'Nonce has expired. Request a new one.' },
        });
      }

      // Verify nonce is present in message
      if (!message.includes(storedNonce)) {
        return reply.code(401).send({
          error: { code: 'NONCE_MISMATCH', message: 'Message nonce does not match.' },
        });
      }

      // Verify domain
      if (!message.includes(config.siwsDomain)) {
        return reply.code(401).send({
          error: { code: 'DOMAIN_MISMATCH', message: 'Message domain does not match.' },
        });
      }

      // Verify signature
      const isValid = verifySIWSSignature(message, signature, pubkey);
      if (!isValid) {
        return reply.code(401).send({
          error: { code: 'INVALID_SIGNATURE', message: 'Signature verification failed.' },
        });
      }

      // Consume nonce (prevent replay)
      await redis.del(`auth:nonce:${pubkey}`);
      await prisma.authNonce.update({
        where: { wallet: pubkey },
        data: { used: true },
      });

      // Ensure user profile exists
      await prisma.userProfile.upsert({
        where: { wallet: pubkey },
        update: {},
        create: { wallet: pubkey },
      });

      // Issue tokens
      const accessToken = signJWT({ wallet: pubkey });
      const refreshToken = signRefreshToken(pubkey);

      // Store refresh token in Redis (7 days)
      await redis.setex(
        `auth:refresh:${pubkey}`,
        7 * 24 * 60 * 60,
        refreshToken
      );

      return reply.send({
        data: {
          accessToken,
          refreshToken,
          expiresIn: 900, // 15 minutes in seconds
          wallet: pubkey,
        },
      });
    }
  );

  // ─── POST /v1/auth/refresh ────────────────────────────────────────────────
  const refreshSchema = z.object({
    refreshToken: z.string().min(1),
  });

  fastify.post(
    '/refresh',
    async (request, reply) => {
      const body = refreshSchema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({
          error: { code: 'VALIDATION_ERROR', message: body.error.message },
        });
      }

      try {
        const { wallet } = verifyRefreshToken(body.data.refreshToken);

        // Verify stored refresh token matches
        const storedToken = await redis.get(`auth:refresh:${wallet}`);
        if (!storedToken || storedToken !== body.data.refreshToken) {
          return reply.code(401).send({
            error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token is invalid or expired.' },
          });
        }

        // Issue new access token
        const accessToken = signJWT({ wallet });

        // Rotate refresh token
        const newRefreshToken = signRefreshToken(wallet);
        await redis.setex(`auth:refresh:${wallet}`, 7 * 24 * 60 * 60, newRefreshToken);

        return reply.send({
          data: {
            accessToken,
            refreshToken: newRefreshToken,
            expiresIn: 900,
          },
        });
      } catch {
        return reply.code(401).send({
          error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token verification failed.' },
        });
      }
    }
  );

  // ─── DELETE /v1/auth/logout ───────────────────────────────────────────────
  fastify.delete(
    '/logout',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const wallet = request.user!.wallet;
      await redis.del(`auth:refresh:${wallet}`);
      return reply.code(204).send();
    }
  );
}
