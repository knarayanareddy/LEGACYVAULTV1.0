import { PublicKey } from '@solana/web3.js';
import { program } from '../config/anchor';
import { findVaultPda } from '../lib/pda';

async function testCheckIn() {
  const owner = new PublicKey('JB28RdYtQuLaHXK3erytKyw8gV8E3Nuhz96PjS1rFi7j');
  const [vaultPda] = findVaultPda(owner, 0);

  console.log('Building check-in tx...');
  try {
    const ix = await program.methods
      .checkIn()
      .accounts({
        signer: owner,
        vault: vaultPda,
        livenessDelegate: undefined,
      })
      .instruction();
    console.log('Success! Instruction built.');
    console.log('Accounts:', ix.keys.map(k => `${k.pubkey.toBase58()} (writable: ${k.isWritable})`));
  } catch (e) {
    console.error('Failed to build instruction:', e);
  }
}

testCheckIn();
