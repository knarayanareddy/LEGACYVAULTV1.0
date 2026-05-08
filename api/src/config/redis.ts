import Redis from 'ioredis';
import { config } from './constants';

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

redis.on('error', (err) => {
  console.error('Redis error:', err);
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await redis.quit();
});
