// api/tests/tx-builder.test.ts
import { server } from './setup';
import { Keypair, VersionedTransaction } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

describe('Tx Builder Endpoints', () => {
  let authToken: string;
  let wallet: Keypair;

  beforeEach(async () => {
    wallet = Keypair.generate();
    authToken = await getAuthToken(wallet);
  });

  it('POST /v1/tx/create-vault returns unsigned tx as base64', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/v1/tx/create-vault',
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        inactivityThreshold: 90 * 86400,
        timelockDuration: 30 * 86400,
        guardianThreshold: 2,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.transaction).toBeDefined();

    // Deserialize
    const txBuffer = Buffer.from(body.transaction, 'base64');
    const tx = VersionedTransaction.deserialize(txBuffer);
    expect(tx).toBeDefined();
  });
});

async function getAuthToken(wallet: Keypair): Promise<string> {
  const nonceRes = await server.inject({
    method: 'GET',
    url: `/v1/auth/nonce?address=${wallet.publicKey.toBase58()}`,
  });
  const { nonce } = JSON.parse(nonceRes.body);

  const message = `Sign in to LegacyVault\n\nNonce: ${nonce}`;
  const messageBytes = new TextEncoder().encode(message);
  const signature = nacl.sign.detached(messageBytes, wallet.secretKey);

  const verifyRes = await server.inject({
    method: 'POST',
    url: '/v1/auth/verify',
    payload: {
      address: wallet.publicKey.toBase58(),
      signature: bs58.encode(signature),
      message,
    },
  });

  const { accessToken } = JSON.parse(verifyRes.body);
  return accessToken;
}
