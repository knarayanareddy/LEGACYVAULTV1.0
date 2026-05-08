import { LogsFilter } from '@solana/web3.js';
import { connection, programId } from '../config/anchor';
import { logger } from '../lib/logger';
import { decodeEvents } from '../lib/eventDecoder';
import { EventProcessor } from './eventProcessor';
import { SlotTracker } from '../lib/slotTracker';

export class EventListener {
  private subscriptionId: number | null = null;
  private eventProcessor: EventProcessor;
  private slotTracker: SlotTracker;

  constructor(eventProcessor: EventProcessor, slotTracker: SlotTracker) {
    this.eventProcessor = eventProcessor;
    this.slotTracker = slotTracker;
  }

  async start() {
    logger.info({ programId: programId.toBase58() }, 'Starting event listener...');

    this.subscriptionId = connection.onLogs(
      programId,
      async (logs, ctx) => {
        const { signature, err, logs: logEntries } = logs;
        const { slot } = ctx;

        if (err) {
          logger.debug({ signature, err }, 'Transaction failed, skipping');
          return;
        }

        try {
          const events = decodeEvents(logEntries);

          if (events.length === 0) {
            return;
          }

          logger.info(
            { signature, slot, eventCount: events.length },
            'Processing transaction'
          );

          // Note: getBlock can be slow/heavy, in production consider using a dedicated block fetcher
          const block = await connection.getBlock(slot, { 
            maxSupportedTransactionVersion: 0,
            transactionDetails: 'none' 
          });
          if (block) {
            await this.slotTracker.trackSlot(slot, block.blockhash, block.parentSlot);
          }

          for (const event of events) {
            await this.eventProcessor.process({
              eventName: event.name,
              eventData: event.data,
              signature,
              slot,
              timestamp: Math.floor(Date.now() / 1000),
            });
          }
        } catch (error) {
          logger.error({ error, signature, slot }, 'Error processing transaction logs');
        }
      },
      'confirmed'
    );

    logger.info({ subscriptionId: this.subscriptionId }, '✅ Event listener started');
  }

  async stop() {
    if (this.subscriptionId !== null) {
      await connection.removeOnLogsListener(this.subscriptionId);
      logger.info('Event listener stopped');
    }
  }
}
