// api/workers/notifier.worker.ts
import { Worker, Queue } from 'bullmq';
import { sendNotification } from '../src/services/notifier.service';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const notifierQueue = new Queue('notifications', { connection });

const worker = new Worker(
  'notifications',
  async (job) => {
    const { vaultAddress, type, data } = job.data;
    await sendNotification({ vaultAddress, type, data });
  },
  { connection, concurrency: 5 },
);

worker.on('completed', (job) => {
  console.log(`Notification sent: ${job.id}`);
});

worker.on('failed', (job, err) => {
  console.error(`Notification failed: ${job?.id}`, err);
});
