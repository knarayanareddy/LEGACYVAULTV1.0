import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { config } from './config/constants';
import { redis } from './config/redis';
import { errorHandler } from './middleware/errorHandler';
import { rateLimitConfig } from './middleware/rateLimit';
import { authRoutes } from './routes/auth';
import { vaultRoutes } from './routes/vaults';
import { transactionRoutes } from './routes/transactions';
import { userRoutes } from './routes/users';
import { documentRoutes } from './routes/documents';
import healthRoute from './routes/health.route';
import { metricsMiddleware } from './middleware/metrics.middleware';
import { collectDefaultMetrics } from 'prom-client';

collectDefaultMetrics();

export async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: config.isDev ? 'debug' : 'info',
      transport: config.isDev
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
    disableRequestLogging: false,
  });

  // ─── Plugins ─────────────────────────────────────────────────────────────

  await fastify.register(helmet, {
    contentSecurityPolicy: false,
  });

  await fastify.register(cors, {
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  await fastify.register(rateLimit, {
    ...rateLimitConfig,
    keyGenerator: (request) => {
      return (
        request.headers['x-forwarded-for']?.toString() ||
        request.ip ||
        'unknown'
      );
    },
  });

  // ─── Middleware ─────────────────────────────────────────────────────────

  fastify.addHook('onResponse', metricsMiddleware);

  // ─── Error handler ────────────────────────────────────────────────────────

  fastify.setErrorHandler(errorHandler);

  // ─── Health check ─────────────────────────────────────────────────────────

  fastify.get('/health', async (_, reply) => {
    const redisOk = await redis.ping().then(() => true).catch(() => false);

    return reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        api: 'ok',
        redis: redisOk ? 'ok' : 'degraded',
      },
      version: '1.0.0',
    });
  });

  // ─── Routes ───────────────────────────────────────────────────────────────

  await fastify.register(authRoutes,        { prefix: '/v1/auth' });
  await fastify.register(vaultRoutes,       { prefix: '/v1/vaults' });
  await fastify.register(transactionRoutes, { prefix: '/v1/tx' });
  await fastify.register(userRoutes,        { prefix: '/v1/users' });
  await fastify.register(documentRoutes,    { prefix: '/v1/vaults' });


  // ─── 404 handler ──────────────────────────────────────────────────────────

  fastify.setNotFoundHandler((request, reply) => {
    return reply.code(404).send({
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.method} ${request.url} not found`,
      },
    });
  });

  return fastify;
}

const isEntryPoint = import.meta.url.includes('server.ts') || process.argv[1]?.includes('server.ts');

if (isEntryPoint) {
  buildServer().then(async (fastify) => {
    try {
      await fastify.listen({ port: config.port, host: '0.0.0.0' });
      console.log(`\n🚀 LegacyVault API running on port ${config.port}`);
      console.log(`   Environment: ${config.nodeEnv}`);
      console.log(`   Cluster:     ${config.cluster}`);
      console.log(`   Program ID:  ${config.programId}`);
    } catch (error) {
      fastify.log.error(error);
      process.exit(1);
    }

    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      await fastify.close();
      await redis.quit();
      console.log('✅ Server shut down cleanly');
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
  });
}
