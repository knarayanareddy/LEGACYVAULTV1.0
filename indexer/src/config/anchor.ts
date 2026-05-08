import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { config } from './constants';
import idl from '../../../legacyvault/target/idl/legacyvault.json';

// Dummy wallet for read-only operations
const dummyKeypair = Keypair.generate();
const wallet = new Wallet(dummyKeypair);

// Connection
export const connection = new Connection(config.rpcEndpoint, {
  commitment: 'confirmed',
  wsEndpoint: config.wsEndpoint,
});

// Provider
export const provider = new AnchorProvider(connection, wallet, {
  commitment: 'confirmed',
});

// Program
export const programId = new PublicKey(config.programId);
(idl as any).address = config.programId;
export const program = new Program(idl as any, provider) as any;
