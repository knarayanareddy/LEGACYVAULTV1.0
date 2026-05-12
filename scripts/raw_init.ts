import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

async function main() {
  const connection = new Connection('http://localhost:8899', 'confirmed');
  const walletPath = path.join(os.homedir(), '.config/solana/id.json');
  const keypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(walletPath, 'utf-8'))));
  
  const programId = new PublicKey('7vdXAgisK4CqAo7xgAQ2K5G8Tg6EiVhWrjToJWAWDoyH');
  const [globalConfigPda] = PublicKey.findProgramAddressSync([Buffer.from("global_config")], programId);
  
  console.log("Admin:", keypair.publicKey.toBase58());
  console.log("Global Config:", globalConfigPda.toBase58());

  // Discriminator: sha256("global:initialize_global_config").slice(0, 8)
  const discriminator = Buffer.from([113, 216, 122, 131, 225, 209, 22, 55]);
  
  const data = Buffer.concat([
    discriminator,
    keypair.publicKey.toBuffer(), // fee_receiver
    Buffer.from(new BigUint64Array([10_000_000n]).buffer), // 0.01 SOL
    Buffer.from(new BigUint64Array([50_000_000n]).buffer), // 0.05 SOL
    Buffer.from(new BigUint64Array([200_000_000n]).buffer), // 0.2 SOL
  ]);

  const ix = new TransactionInstruction({
    keys: [
      { pubkey: keypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: globalConfigPda, isSigner: false, isWritable: true },
      { pubkey: PublicKey.default, isSigner: false, isWritable: false }, // SystemProgram
    ],
    programId,
    data,
  });

  const tx = new Transaction().add(ix);
  const sig = await connection.sendTransaction(tx, [keypair]);
  console.log("Success! Sig:", sig);
}

main().catch(console.error);
