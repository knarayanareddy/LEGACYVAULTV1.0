export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1',
  rpcEndpoint: import.meta.env.VITE_RPC_URL || 'https://api.devnet.solana.com',
  programId: import.meta.env.VITE_PROGRAM_ID || '7vdXAgisK4CqAo7xgAQ2K5G8Tg6EiVhWrjToJWAWDoyH',
  cluster: (import.meta.env.VITE_CLUSTER as any) || 'devnet',
};

export const VAULT_STATUS = {
  LOCKED: 'locked',
  UNLOCKING: 'unlocking',
  UNLOCKED: 'unlocked',
  FROZEN: 'frozen',
  DISTRIBUTED: 'distributed',
} as const;
