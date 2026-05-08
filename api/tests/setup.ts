// api/tests/setup.ts
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { buildServer } from '../src/server';

let server: FastifyInstance;
let prisma: PrismaClient;

beforeAll(async () => {
  // Use test environment variables
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5433/legacyvault_test';
  process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6380';
  process.env.JWT_SECRET = 'test-secret-key-do-not-use-in-production';

  // Build server
  server = await buildServer();
  await server.ready();

  prisma = new PrismaClient();
});

afterAll(async () => {
  if (prisma) await prisma.$disconnect();
  if (server) await server.close();
});

afterEach(async () => {
  // Clean up DB between tests
  if (prisma) {
    const tables = ['Vault', 'Guardian', 'Beneficiary', 'Asset', 'ActivityLog'];
    for (const table of tables) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
    }
  }
});

export { server, prisma };
