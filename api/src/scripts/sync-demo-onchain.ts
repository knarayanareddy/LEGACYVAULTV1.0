import { program, provider, connection } from '../config/anchor';
import { PublicKey, Keypair, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';
import { findVaultPda, findGuardianEntryPda } from '../lib/pda';
import * as anchor from '@coral-xyz/anchor';

async function syncOnChain() {
  const owner = provider.wallet.publicKey;
  const [vaultPda] = findVaultPda(owner, 0);
  
  console.log(`Syncing on-chain state for vault: ${vaultPda.toBase58()}`);
  console.log(`Owner: ${owner.toBase58()}`);

  // 1. Airdrop to owner if needed
  const balance = await connection.getBalance(owner);
  if (balance < 1 * LAMPORTS_PER_SOL) {
    console.log('Airdropping 2 SOL to owner...');
    const sig = await connection.requestAirdrop(owner, 2 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig);
  }

  // 2. Add owner as a guardian (for demo purposes)
  console.log('Adding owner as a guardian...');
  const [guardianPda] = findGuardianEntryPda(vaultPda, owner);
  
  try {
    await program.methods
      .addGuardian({
        guardianWallet: owner,
        role: { personal: {} },
      })
      .accounts({
        owner,
        vault: vaultPda,
        guardianEntry: guardianPda,
        // globalConfig is inferred
        // proGuardianProfile is null
      })
      .rpc();
    console.log('Guardian added.');
  } catch (e: any) {
    if (e.message.includes('already in use')) {
      console.log('Guardian already exists on-chain.');
    } else {
      console.error('Failed to add guardian:', e);
    }
  }

  // 3. Accept invitation
  console.log('Accepting guardian invitation...');
  try {
    await program.methods
      .acceptGuardianInvitation()
      .accounts({
        guardian: owner,
        guardianEntry: guardianPda,
        vault: vaultPda,
      })
      .rpc();
    console.log('Invitation accepted. Guardian is now ACTIVE.');
  } catch (e: any) {
     if (e.message.includes('GuardianNotActive')) {
        console.log('Guardian already active.');
     } else {
        console.error('Failed to accept invitation:', e);
     }
  }

  // 4. Update threshold to 1 for easier demo
  console.log('Setting threshold to 1...');
  try {
    await program.methods
      .setGuardianThreshold(1)
      .accounts({
        owner,
        vault: vaultPda,
      })
      .rpc();
    console.log('Threshold updated.');
  } catch (e) {
    console.error('Failed to set threshold:', e);
  }

  console.log('On-chain sync complete. You can now initiate unlock from the dashboard!');
}

syncOnChain().catch(console.error);
