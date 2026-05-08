// api/src/services/arweave.adapter.ts
import Arweave from 'arweave';
import { createData, ArweaveSigner } from '@dha-team/arbundles';

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
});

// Load JWK from env
const jwk = JSON.parse(process.env.ARWEAVE_WALLET_JWK || '{}');

export interface UploadResult {
  uri: string;
  txId: string;
}

export async function uploadToArweave(
  buffer: Buffer,
  contentType: string,
): Promise<UploadResult> {
  try {
    if (!process.env.ARWEAVE_WALLET_JWK) {
        console.warn('ARWEAVE_WALLET_JWK not found, using mock upload');
        return { uri: 'https://arweave.net/mock-tx-id', txId: 'mock-tx-id' };
    }

    const tx = await arweave.createTransaction({ data: buffer }, jwk);
    tx.addTag('Content-Type', contentType);
    tx.addTag('App-Name', 'LegacyVault');
    tx.addTag('App-Version', '1.0');

    await arweave.transactions.sign(tx, jwk);
    const response = await arweave.transactions.post(tx);

    if (response.status !== 200) {
      throw new Error(`Arweave post failed with status ${response.status}`);
    }

    return {
      uri: `https://arweave.net/${tx.id}`,
      txId: tx.id,
    };
  } catch (error: any) {
    throw new Error(`Arweave upload failed: ${error.message}`);
  }
}
