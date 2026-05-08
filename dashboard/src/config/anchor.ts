import { PublicKey } from '@solana/web3.js';
import { config } from './constants';

export const programId = new PublicKey(config.programId);
