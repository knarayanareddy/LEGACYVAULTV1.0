import { Queue, Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger';

const prisma = new PrismaClient();
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const notificationQueue = new Queue('notifications', {
  connection: { url: redisUrl },
});

export const notificationWorker = new Worker(
  'notifications',
  async (job: Job) => {
    if (job.name === 'check-pending-notifications') {
      const pending = await prisma.notification.findMany({
        where: { deliveryStatus: 'pending' },
        take: 50,
      });

      for (const n of pending) {
        await notificationQueue.add('send-notification', { notificationId: n.id });
      }
      return;
    }

    if (job.name === 'send-notification') {
      const { notificationId } = job.data;
      const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
      if (!notification) return;

      try {
        logger.info({ notificationId }, 'Sending notification');

        // In production: dispatch to Twilio (SMS), SendGrid (Email), or FCM (Push)
        // For now, mark as sent
        await prisma.notification.update({
          where: { id: notificationId },
          data: {
            deliveryStatus: 'sent',
            deliveredVia: ['in-app'],
          },
        });

      } catch (error) {
        logger.error({ error, notificationId }, 'Failed to send notification');
        await prisma.notification.update({
          where: { id: notificationId },
          data: { deliveryStatus: 'failed' },
        });
        throw error;
      }
    }
  },
  {
    connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
  }
);
