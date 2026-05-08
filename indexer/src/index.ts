import { EventListener } from './services/eventListener';
import { EventProcessor } from './services/eventProcessor';
import { SlotTracker } from './lib/slotTracker';
import { PortfolioSnapshotter } from './services/portfolioSnapshotter';
import { logger } from './lib/logger';
import { config } from './config/constants';

// Trigger worker initialization
import './jobs/portfolioSnapshot';
import './jobs/notificationScheduler';

async function main() {
  logger.info(`🚀 Starting LegacyVault Indexer [${config.nodeEnv}]`);

  const slotTracker = new SlotTracker();
  const eventProcessor = new EventProcessor();
  const eventListener = new EventListener(eventProcessor, slotTracker);
  const snapshotter = new PortfolioSnapshotter(config.redisUrl);

  try {
    // 1. Initialize slot tracking
    await slotTracker.initialize();

    // 2. Start snapshot scheduler
    await snapshotter.start();

    // 3. Start listening for events
    await eventListener.start();

    logger.info('Indexer is fully operational and listening for events.');

    // 4. Handle historical processing if requested
    if (config.processHistorical) {
      logger.info({ startSlot: config.startSlot }, 'Starting historical processing...');
      // In production: implement a paginated transaction fetcher using getSignaturesForAddress
    }

  } catch (error) {
    logger.error({ error }, 'Fatal error during indexer startup');
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down...`);
    await eventListener.stop();
    // BullMQ workers and connections are handled by their own lifecycle
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error(err, 'Unhandled rejection in main');
  process.exit(1);
});
