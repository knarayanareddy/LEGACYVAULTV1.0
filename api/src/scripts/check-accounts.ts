import { connection } from '../config/anchor';
import { PublicKey } from '@solana/web3.js';
import { findVaultPda, findGuardianEntryPda } from '../lib/pda';

async function checkStatus() {
  const owner = new PublicKey('JB28RdYtQuLaHXK3erytKyw8gV8E3Nuhz96PjS1rFi7j');
  const [vaultPda] = findVaultPda(owner, 0);
  const [guardianPda] = findGuardianEntryPda(vaultPda, owner);

  console.log(`Checking Vault: ${vaultPda.toBase58()}`);
  const vaultAcc = await connection.getAccountInfo(vaultPda);
  console.log(`Exists: ${!!vaultAcc}`);
  if (vaultAcc) {
    console.log(`Owner: ${vaultAcc.owner.toBase58()}`);
    console.log(`Data Length: ${vaultAcc.data.length}`);
    console.log(`Discriminator: ${vaultAcc.data.slice(0, 8).toString('hex')}`);
  }

  console.log(`\nChecking Guardian Entry: ${guardianPda.toBase58()}`);
  const guardianAcc = await connection.getAccountInfo(guardianPda);
  console.log(`Exists: ${!!guardianAcc}`);
  if (guardianAcc) {
    console.log(`Owner: ${guardianAcc.owner.toBase58()}`);
    console.log(`Data Length: ${guardianAcc.data.length}`);
    console.log(`Discriminator: ${guardianAcc.data.slice(0, 8).toString('hex')}`);
  }
}

checkStatus();
