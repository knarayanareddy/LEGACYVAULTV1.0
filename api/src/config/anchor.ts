import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { config } from './constants';
import { IDL } from './idl';

// Create a dummy wallet for read-only operations
const dummyKeypair = Keypair.generate();
const wallet = new Wallet(dummyKeypair);

// Connection
export const connection = new Connection(config.rpcEndpoint, 'confirmed');

// Provider
export const provider = new AnchorProvider(connection, wallet, {
  commitment: 'confirmed',
});

import crypto from 'crypto';

// Program
export const programId = new PublicKey(config.programId);
(IDL as any).address = config.programId;

function transformType(type: any): any {
  if (type === 'publicKey') {
    return 'pubkey';
  }
  if (type && typeof type === 'object') {
    if ('option' in type) {
      type.option = transformType(type.option);
    }
    if ('vec' in type) {
      type.vec = transformType(type.vec);
    }
    if ('defined' in type && typeof type.defined === 'string') {
      type.defined = { name: type.defined };
    }
  }
  return type;
}

// Dynamically compute instruction discriminators and map types to Anchor v0.30 format
IDL.instructions.forEach((ix: any) => {
  if (!ix.discriminator) {
    const snakeName = ix.name.replace(/([A-Z])/g, "_$1").toLowerCase();
    const sighash = crypto.createHash('sha256').update(`global:${snakeName}`).digest();
    ix.discriminator = Array.from(sighash.slice(0, 8));
  }
  ix.accounts.forEach((acc: any) => {
    if (acc.isMut !== undefined) {
      acc.writable = acc.isMut;
    }
    if (acc.isSigner !== undefined) {
      acc.signer = acc.isSigner;
    }
  });
  ix.args.forEach((arg: any) => {
    arg.type = transformType(arg.type);
  });
});

if (IDL.types) {
  IDL.types.forEach((t: any) => {
    if (t.type && t.type.kind === 'struct') {
      t.type.fields.forEach((f: any) => {
        f.type = transformType(f.type);
      });
    }
  });
}

export const program = new Program(IDL, provider) as any;
