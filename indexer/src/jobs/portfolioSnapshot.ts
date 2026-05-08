import { Queue, Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger';
import { connection } from '../config/anchor';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

const prisma = new PrismaClient();
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const snapshotQueue = new Queue('portfolio-snapshots', {
  connection: { url: redisUrl },
});

// Redefining PDA helper to avoid rootDir issues
function findVaultAuthorityPdaLocal(vaultPubkey: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault_authority'), vaultPubkey.toBuffer()],
    new PublicKey(process.env.PROGRAM_ID || PublicKey.default)
  );
}

export const portfolioSnapshotWorker = new Worker(
  'portfolio-snapshots',
  async (job: Job) => {
    if (job.name === 'schedule-all-snapshots') {
      const activeVaults = await prisma.vault.findMany({
        where: { status: { in: ['active', 'unlocking', 'executing'] } },
        select: { pubkey: true },
      });

      for (const vault of activeVaults) {
        await snapshotQueue.add('capture-snapshot', { vaultPubkey: vault.pubkey });
      }
      return;
    }

    if (job.name === 'capture-snapshot') {
      const { vaultPubkey } = job.data;
      logger.info({ vaultPubkey }, 'Capturing portfolio snapshot');

      try {
        const [vaultAuthPda] = findVaultAuthorityPdaLocal(new PublicKey(vaultPubkey));
        
        // 1. Get SOL balance
        const lamports = await connection.getBalance(vaultAuthPda);
        const solBalance = lamports / LAMPORTS_PER_SOL;

        // 2. Get SPL balances
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          vaultAuthPda,
          { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
        );

        // In production: fetch prices from Birdeye/Jupiter and calculate USD value
        // For now, record balances
        const breakdown = {
          sol: solBalance,
          splCount: tokenAccounts.value.length,
          timestamp: new Date().toISOString(),
        };

        await prisma.portfolioSnapshot.create({
          data: {
            vaultPubkey,
            totalUsdValue: 0, // Placeholder; real implementation would use marketDataService
            breakdown,
          },
        });

        logger.debug({ vaultPubkey }, 'Snapshot captured successfully');
      } catch (error) {
        logger.error({ error, vaultPubkey }, 'Failed to capture snapshot');
        throw error;
      }
    }
  },
  {
    connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
  }
);
