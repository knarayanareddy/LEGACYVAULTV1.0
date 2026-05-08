// api/tests/reads.test.ts
import { server, prisma } from './setup';

describe('Read Endpoints', () => {
  it('GET /v1/vaults/:vault/summary returns vault data', async () => {
    const vaultAddress = 'Vault111111111111111111111111111111111111111';

    // Seed DB
    await prisma.vault.create({
      data: {
        address: vaultAddress,
        owner: 'Owner11111111111111111111111111111111111111111',
        status: 'active',
        inactivityThreshold: 90 * 86400,
        timelockDuration: 30 * 86400,
        guardianThreshold: 2,
        guardianCount: 0,
        beneficiaryCount: 0,
        totalBps: 0,
        lastCheckIn: new Date(),
      },
    });

    const res = await server.inject({
      method: 'GET',
      url: `/v1/vaults/${vaultAddress}/summary`,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.vaultAddress).toBe(vaultAddress);
  });
});
