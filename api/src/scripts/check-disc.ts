import { sha256 } from '@noble/hashes/sha256';

const input = 'account:Vault';
const hash = sha256(input);
const disc = hash.slice(0, 8);
console.log('Discriminator for account:Vault:');
console.log(Buffer.from(disc).toString('hex'));
