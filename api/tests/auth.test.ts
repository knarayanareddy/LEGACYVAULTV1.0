// api/tests/auth.test.ts
import { server } from './setup';
import { Keypair } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

describe('Auth Flow (SIWS)', () => {
  let wallet: Keypair;

  beforeEach(() => {
    wallet = Keypair.generate();
  });

  it('GET /v1/auth/nonce returns a nonce', async () => {
    const res = await server.inject({
      method: 'GET',
      url: `/v1/auth/nonce?address=${wallet.publicKey.toBase58()}`,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.nonce).toBeDefined();
    expect(body.nonce.length).toBeGreaterThan(10);
  });

  it('POST /v1/auth/verify validates signature and returns JWT', async () => {
    // Get nonce
    const nonceRes = await server.inject({
      method: 'GET',
      url: `/v1/auth/nonce?address=${wallet.publicKey.toBase58()}`,
    });
    const { nonce } = JSON.parse(nonceRes.body);

    // Sign message
    const message = `Sign in to LegacyVault\n\nNonce: ${nonce}`;
    const messageBytes = new TextEncoder().encode(message);
    const signature = nacl.sign.detached(messageBytes, wallet.secretKey);

    // Verify
    const verifyRes = await server.inject({
      method: 'POST',
      url: '/v1/auth/verify',
      payload: {
        address: wallet.publicKey.toBase58(),
        signature: bs58.encode(signature),
        message,
      },
    });

    expect(verifyRes.statusCode).toBe(200);
    const body = JSON.parse(verifyRes.body);
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
  });
});
