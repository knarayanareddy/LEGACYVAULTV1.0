// api/src/routes/health.route.ts
import { FastifyPluginAsync } from 'fastify';
import { register } from 'prom-client';
import { redis } from '../config/redis';

const healthRoute: FastifyPluginAsync = async (server) => {
  server.get('/health', async (_, reply) => {
    const redisOk = await redis.ping().then(() => true).catch(() => false);
    
    return reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        api: 'ok',
        redis: redisOk ? 'ok' : 'degraded',
      },
    });
  });

  server.get('/metrics', async (_, reply) => {
    reply.header('Content-Type', register.contentType);
    return reply.send(await register.metrics());
  });
};

export default healthRoute;
