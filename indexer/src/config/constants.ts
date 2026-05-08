import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Indexer
  nodeEnv: process.env.NODE_ENV || 'development',
  indexerName: process.env.INDEXER_NAME || 'legacyvault-indexer-1',

  // Solana
  cluster: process.env.SOLANA_CLUSTER || 'devnet',
  rpcEndpoint: process.env.SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com',
  wsEndpoint: process.env.SOLANA_WS_ENDPOINT || 'wss://api.devnet.solana.com',
  programId: process.env.PROGRAM_ID || '',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // Processing
  processHistorical: process.env.PROCESS_HISTORICAL === 'true',
  startSlot: parseInt(process.env.START_SLOT || '0', 10),
  batchSize: parseInt(process.env.BATCH_SIZE || '100', 10),

  // Jobs
  portfolioSnapshotCron: process.env.PORTFOLIO_SNAPSHOT_CRON || '0 */4 * * *',
  notificationCheckCron: process.env.NOTIFICATION_CHECK_CRON || '*/5 * * * *',

  // Re-org protection
  maxReorgDepth: parseInt(process.env.MAX_REORG_DEPTH || '32', 10),
  finalizedConfirmationDepth: parseInt(process.env.FINALIZED_CONFIRMATION_DEPTH || '32', 10),

  // Misc
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
} as const;

// Validate required env vars
const requiredEnvVars = ['DATABASE_URL', 'PROGRAM_ID'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`⚠️ Missing recommended environment variable: ${envVar}`);
  }
}
