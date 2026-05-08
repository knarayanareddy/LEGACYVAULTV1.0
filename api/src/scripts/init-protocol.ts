import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { findGlobalConfigPda } from '../lib/pda';
import { IDL } from '../config/idl';
import { config } from '../config/constants';
import * as fs from 'fs';
import * as path from 'path';
import { BN } from '@coral-xyz/anchor';

import * as os from 'os';

async function init() {
  const connection = new Connection(config.rpcEndpoint, 'confirmed');
  
  // Load local wallet keypair
  const walletPath = path.join(os.homedir(), '.config/solana/id.json');
  const keypairData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
  const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
  const wallet = new Wallet(keypair);

  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  const program = new Program(IDL, provider) as any;
  const [globalConfigPda] = findGlobalConfigPda();
  
  console.log("Using Admin Wallet:", wallet.publicKey.toBase58());
  console.log("Global Config PDA:", globalConfigPda.toBase58());

  await program.methods
    .initializeGlobalConfig(
      wallet.publicKey,          // fee_receiver
      new BN(10_000_000),        // creation_fee (0.01 SOL)
      new BN(50_000_000),        // pro_sub_fee (0.05 SOL)
      new BN(200_000_000)        // ent_sub_fee (0.2 SOL)
    )
    .accounts({
      admin: wallet.publicKey,
      globalConfig: globalConfigPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
    
  console.log("Protocol Initialized successfully!");
}

init().catch(err => {
  console.error("Initialization failed:", err);
});
