import { PrismaClient } from '@prisma/client';
import { connection } from '../config/anchor';
import { logger } from './logger';

const prisma = new PrismaClient();

interface SlotRecord {
  slot: number;
  blockhash: string;
  parentSlot: number;
  timestamp: number;
}

export class SlotTracker {
  private processedSlots: Map<number, SlotRecord> = new Map();
  private lastFinalizedSlot: number = 0;

  async initialize() {
    const slot = await connection.getSlot('confirmed');
    this.lastFinalizedSlot = slot - 32;
    logger.info({ slot, lastFinalizedSlot: this.lastFinalizedSlot }, 'SlotTracker initialized');
  }

  async trackSlot(slot: number, blockhash: string, parentSlot: number) {
    this.processedSlots.set(slot, {
      slot,
      blockhash,
      parentSlot,
      timestamp: Date.now(),
    });

    const currentSlot = await connection.getSlot('confirmed');
    this.lastFinalizedSlot = currentSlot - 32;

    for (const [s] of this.processedSlots) {
      if (s < this.lastFinalizedSlot - 100) {
        this.processedSlots.delete(s);
      }
    }
  }

  async detectReorg(slot: number, blockhash: string): Promise<boolean> {
    const record = this.processedSlots.get(slot);
    if (!record) return false;

    if (record.blockhash !== blockhash) {
      logger.warn(
        { slot, expectedBlockhash: record.blockhash, receivedBlockhash: blockhash },
        'Re-org detected'
      );
      return true;
    }

    return false;
  }

  async rollbackSlot(slot: number) {
    logger.info({ slot }, 'Rolling back events from slot due to re-org');

    await prisma.activityLog.deleteMany({
      where: {
        metadata: {
          path: ['slot'],
          equals: slot,
        },
      },
    });

    this.processedSlots.delete(slot);
  }

  isFinalized(slot: number): boolean {
    return slot <= this.lastFinalizedSlot;
  }
}
