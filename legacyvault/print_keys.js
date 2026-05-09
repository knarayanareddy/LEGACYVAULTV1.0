const anchor = require('@coral-xyz/anchor');
process.env.ANCHOR_PROVIDER_URL = 'http://127.0.0.1:8899';
process.env.ANCHOR_WALLET = '/Users/macbookprom1pro/.config/solana/id.json';
const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
console.log('Workspace Keys:', Object.keys(anchor.workspace));
