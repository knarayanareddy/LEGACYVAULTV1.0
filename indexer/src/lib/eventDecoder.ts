import { BorshCoder, EventParser } from '@coral-xyz/anchor';
import { program } from '../config/anchor';
import { logger } from './logger';

const eventParser = new EventParser(program.programId, new BorshCoder(program.idl));

export interface DecodedEvent {
  name: string;
  data: Record<string, any>;
}

export function decodeEvents(logs: string[]): DecodedEvent[] {
  const events: DecodedEvent[] = [];

  try {
    const parsedEvents = eventParser.parseLogs(logs);
    
    for (const event of parsedEvents) {
      events.push({
        name: event.name,
        data: event.data as Record<string, any>,
      });
    }
  } catch (error) {
    logger.warn({ error, logs }, 'Failed to decode events from logs');
  }

  return events;
}

export function normalizeEventData(data: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      normalized[key] = null;
    } else if (typeof value === 'object' && 'toNumber' in value) {
      normalized[key] = value.toNumber();
    } else if (typeof value === 'object' && 'toBase58' in value) {
      normalized[key] = value.toBase58();
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      normalized[key] = normalizeEventData(value);
    } else if (Array.isArray(value)) {
      normalized[key] = value.map((v) =>
        typeof v === 'object' && 'toNumber' in v ? v.toNumber() : v
      );
    } else {
      normalized[key] = value;
    }
  }

  return normalized;
}
