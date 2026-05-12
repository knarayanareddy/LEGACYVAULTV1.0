import { PublicKey } from '@solana/web3.js';
import { findVaultPda } from '../lib/pda';

const owner = new PublicKey('JB28RdYtQuLaHXK3erytKyw8gV8E3Nuhz96PjS1rFi7j');
const [vaultPda] = findVaultPda(owner, 0);

console.log(`Owner: ${owner.toBase58()}`);
console.log(`Vault PDA (nonce 0): ${vaultPda.toBase58()}`);
