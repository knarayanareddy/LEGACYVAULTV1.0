// api/workers/check-in-reminder.worker.ts
import { Worker, Queue } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { sendNotification } from '../src/services/notifier.service';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Queue for scheduling reminders
export const checkInReminderQueue = new Queue('check-in-reminders', { connection });

// Worker
const worker = new Worker(
  'check-in-reminders',
  async (job) => {
    console.log(`Processing check-in reminder job: ${job.id}`);

    // Fetch all active vaults
    const vaults = await prisma.vault.findMany({
      where: { status: 'active' },
    });

    for (const vault of vaults) {
      const lastCheckIn = Number(vault.lastCheckIn); // Convert BigInt to Number
      const daysSinceCheckIn = Math.floor(
        (Date.now() / 1000 - lastCheckIn) / 86400,
      );

      const thresholdDays = Number(vault.inactivityThreshold) / 86400;
      const daysUntilInactive = thresholdDays - daysSinceCheckIn;

      // Send reminder at 75%, 90%, 95% thresholds
      const reminderThresholds = [
        Math.floor(thresholdDays * 0.75),
        Math.floor(thresholdDays * 0.9),
        Math.floor(thresholdDays * 0.95),
      ];

      if (reminderThresholds.includes(daysSinceCheckIn)) {
        await sendNotification({
          vaultAddress: vault.pubkey,
          type: 'check_in_reminder',
          data: {
            vaultAddress: vault.pubkey,
            daysSinceCheckIn,
            daysUntilInactive,
          },
        });
      }
    }
  },
  { connection },
);

// Schedule daily at 9 AM UTC
export async function scheduleCheckInReminders() {
  await checkInReminderQueue.add(
    'daily-check',
    {},
    {
      repeat: {
        pattern: '0 9 * * *', // cron: 9 AM daily
      },
    },
  );
  console.log('Check-in reminder job scheduled');
}

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});
