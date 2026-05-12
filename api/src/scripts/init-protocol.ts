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
  
  // Create program with transformer logic but real provider
  const idlCopy = JSON.parse(JSON.stringify(IDL));
  
  // Transformer logic from anchor.ts
  idlCopy.instructions.forEach((ix: any) => {
    ix.accounts.forEach((acc: any) => {
      if (acc.isMut !== undefined) acc.writable = acc.isMut;
      if (acc.isSigner !== undefined) acc.signer = acc.isSigner;
    });
    ix.args.forEach((arg: any) => {
      if (arg.type && typeof arg.type === 'object' && arg.type.defined) {
        if (typeof arg.type.defined === 'string') {
          arg.type.defined = { name: arg.type.defined };
        }
      }
    });
  });

  const program = new Program(idlCopy, provider) as any;
  const [globalConfigPda] = findGlobalConfigPda();
  
  console.log("Using Real Wallet:", wallet.publicKey.toBase58());
  console.log("Global Config PDA:", globalConfigPda.toBase58());

  try {
    const tx = await program.methods
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
      
    console.log("Protocol Initialized successfully! TX:", tx);
  } catch (err) {
    if (err.logs?.some(l => l.includes("already in use"))) {
      console.log("Protocol already initialized.");
    } else {
      console.error("Logs:", err.logs);
      throw err;
    }
  }
}

init().catch(err => {
  console.error("Initialization failed:", err);
});
