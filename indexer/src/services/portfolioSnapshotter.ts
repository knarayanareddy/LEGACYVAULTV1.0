import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import { config } from '../config/constants';
import { logger } from '../lib/logger';

const prisma = new PrismaClient();

export class PortfolioSnapshotter {
  private queue: Queue;

  constructor(redisUrl: string) {
    this.queue = new Queue('portfolio-snapshots', {
      connection: { url: redisUrl },
    });
  }

  async start() {
    logger.info('Starting portfolio snapshot scheduler...');

    // Schedule a recurring job to scan all active vaults and queue snapshots
    await this.queue.add(
      'schedule-all-snapshots',
      {},
      {
        repeat: {
          pattern: config.portfolioSnapshotCron,
        },
      }
    );
  }

  async queueVaultSnapshot(vaultPubkey: string) {
    await this.queue.add('capture-snapshot', { vaultPubkey });
  }
}
