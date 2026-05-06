LEGACYVAULT — BUILD 6
Complete Frontend Hooks with React Query + Wallet Integration

Stack: React 19 + React Query + Solana Wallet Adapter + Anchor + TypeScript Scope: Replace all mock data with real API calls and on-chain transactions
File structure produced in this build

text

dashboard/                              (extends Legacyvaultdashboardbuild/)
├── package.json                        (updated with new deps)
├── tsconfig.json                       (updated paths)
├── .env.example
├── .env
└── src/
    ├── config/
    │   ├── constants.ts
    │   ├── anchor.ts                   // Program connection
    │   └── queryClient.ts              // React Query config
    ├── lib/
    │   ├── api.ts                      // Typed fetch wrapper
    │   ├── pda.ts                      // PDA derivation (matches API/indexer)
    │   ├── siws.ts                     // SIWS message building
    │   └── crypto.ts                   // WebCrypto (from Phase 3)
    ├── hooks/
    │   ├── useAuth.ts                  // SIWS auth + JWT management
    │   ├── useWallet.ts                // Wallet adapter wrapper
    │   ├── useTxBuilder.ts             // Generic tx builder + signing flow
    │   ├── useVaultSummary.ts          // Dashboard + Sidebar
    │   ├── useAssets.ts                // VaultPanel
    │   ├── useGuardians.ts             // GuardiansPanel
    │   ├── useBeneficiaries.ts         // BeneficiariesPanel
    │   ├── useLiveness.ts              // LivenessPanel
    │   ├── useDistributionState.ts     // DistributionPanel
    │   ├── useDocuments.ts             // DocumentsPanel
    │   ├── useNotifications.ts         // Topbar badge + Dashboard
    │   ├── useActivity.ts              // Dashboard activity feed
    │   ├── usePortfolio.ts             // Dashboard charts
    │   └── useSettings.ts              // SettingsPanel
    ├── providers/
    │   ├── WalletProvider.tsx          // Wallet adapter provider
    │   ├── QueryProvider.tsx           // React Query provider
    │   └── AuthProvider.tsx            // SIWS session provider
    ├── components/
    │   ├── shared/
    │   │   ├── TxStatusModal.tsx       // Transaction lifecycle UI
    │   │   ├── WalletButton.tsx        // Connect/disconnect button
    │   │   ├── LoadingSkeleton.tsx     // Panel loading states
    │   │   └── ErrorBoundary.tsx       // Error handling
    │   └── panels/                     // (existing, minimal changes)
    │       ├── Dashboard.tsx
    │       ├── VaultPanel.tsx
    │       ├── GuardiansPanel.tsx
    │       ├── BeneficiariesPanel.tsx
    │       ├── LivenessPanel.tsx
    │       ├── DistributionPanel.tsx
    │       ├── DocumentsPanel.tsx
    │       └── SettingsPanel.tsx
    ├── types/
    │   ├── api.ts                      // API response types (from Build 4)
    │   └── vault.ts                    // UI domain types (existing)
    ├── App.tsx                         // Updated with real providers + hooks
    └── main.tsx                        // Updated with provider wrappers

1. dashboard/package.json (updated dependencies)

JSON

{
  "name": "legacyvault-dashboard",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "recharts": "^2.13.3",
    "lucide-react": "^0.454.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.7.0",
    
    "@solana/wallet-adapter-base": "^0.9.23",
    "@solana/wallet-adapter-react": "^0.15.35",
    "@solana/wallet-adapter-react-ui": "^0.9.35",
    "@solana/wallet-adapter-wallets": "^0.19.32",
    "@solana/web3.js": "^1.95.0",
    "@coral-xyz/anchor": "^0.30.1",
    "@solana/spl-token": "^0.4.6",
    
    "@tanstack/react-query": "^5.56.2",
    "@tanstack/react-query-devtools": "^5.56.2",
    
    "bs58": "^5.0.0",
    "tweetnacl": "^1.0.3",
    "buffer": "^6.0.3"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.3",
    "typescript": "^5.5.3",
    "vite": "^7.3.2",
    "vite-plugin-singlefile": "^2.0.3",
    "@tailwindcss/vite": "^4.1.17",
    "tailwindcss": "^4.1.17"
  }
}

2. dashboard/.env.example

env

# API
VITE_API_BASE_URL=http://localhost:3001/v1

# Solana
VITE_SOLANA_CLUSTER=devnet
VITE_SOLANA_RPC_ENDPOINT=https://api.devnet.solana.com
VITE_PROGRAM_ID=LgcyVLTxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# SIWS
VITE_SIWS_DOMAIN=localhost:5173
VITE_SIWS_STATEMENT=Sign in to LegacyVault

# Feature flags
VITE_ENABLE_MOCK_DATA=false

3. dashboard/src/config/constants.ts

TypeScript

export const config = {
  // API
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/v1',

  // Solana
  cluster: (import.meta.env.VITE_SOLANA_CLUSTER || 'devnet') as 'devnet' | 'mainnet-beta',
  rpcEndpoint: import.meta.env.VITE_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com',
  programId: import.meta.env.VITE_PROGRAM_ID || '',

  // SIWS
  siwsDomain: import.meta.env.VITE_SIWS_DOMAIN || 'localhost:5173',
  siwsStatement: import.meta.env.VITE_SIWS_STATEMENT || 'Sign in to LegacyVault',

  // Feature flags
  enableMockData: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true',

  // Query settings
  staleTime: {
    summary: 15_000,     // 15s
    assets: 30_000,      // 30s
    guardians: 60_000,   // 1m
    portfolio: 60_000,   // 1m
  },
} as const;

// Validate required env vars
if (!config.programId && !config.enableMockData) {
  throw new Error('VITE_PROGRAM_ID is required when mock data is disabled');
}

4. dashboard/src/config/anchor.ts

TypeScript

import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import { config } from './constants';
import idl from '../../../target/idl/legacyvault.json';
import type { Legacyvault } from '../../../target/types/legacyvault';

export const connection = new Connection(config.rpcEndpoint, 'confirmed');
export const programId = new PublicKey(config.programId);

export function getProgram(wallet: AnchorWallet): Program<Legacyvault> {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });

  return new Program(idl as any, programId, provider) as Program<Legacyvault>;
}

5. dashboard/src/config/queryClient.ts

TypeScript

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 10_000, // 10s default
      gcTime: 5 * 60 * 1000, // 5 min
    },
    mutations: {
      retry: false,
    },
  },
});

// Cache invalidation helpers
export const invalidateVaultCache = (vaultPubkey: string) => {
  queryClient.invalidateQueries({ queryKey: ['vault', 'summary', vaultPubkey] });
  queryClient.invalidateQueries({ queryKey: ['vault', 'assets', vaultPubkey] });
  queryClient.invalidateQueries({ queryKey: ['vault', 'portfolio', vaultPubkey] });
};

export const invalidateGuardiansCache = (vaultPubkey: string) => {
  queryClient.invalidateQueries({ queryKey: ['vault', 'guardians', vaultPubkey] });
  queryClient.invalidateQueries({ queryKey: ['vault', 'summary', vaultPubkey] });
};

export const invalidateBeneficiariesCache = (vaultPubkey: string) => {
  queryClient.invalidateQueries({ queryKey: ['vault', 'beneficiaries', vaultPubkey] });
  queryClient.invalidateQueries({ queryKey: ['vault', 'summary', vaultPubkey] });
};

export const invalidateDistributionCache = (vaultPubkey: string) => {
  queryClient.invalidateQueries({ queryKey: ['vault', 'distribution', vaultPubkey] });
  queryClient.invalidateQueries({ queryKey: ['vault', 'summary', vaultPubkey] });
};

6. dashboard/src/lib/api.ts

TypeScript

import { config } from '../config/constants';

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = sessionStorage.getItem('legacyvault_access_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${config.apiBaseUrl}${endpoint}`;

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.error?.code || 'UNKNOWN_ERROR',
      errorData.error?.message || `HTTP ${response.status}`,
      errorData.error?.details
    );
  }

  const json = await response.json();
  return json.data ?? json;
}

export const api = {
  get: <T>(endpoint: string) => fetchApi<T>(endpoint, { method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown) =>
    fetchApi<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown) =>
    fetchApi<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown) =>
    fetchApi<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string) =>
    fetchApi<T>(endpoint, { method: 'DELETE' }),
};

7. dashboard/src/lib/pda.ts (matches API/indexer)

TypeScript

import { PublicKey } from '@solana/web3.js';
import { programId } from '../config/anchor';

export const findVaultPda = (owner: PublicKey, nonce: number): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), owner.toBuffer(), Buffer.from([nonce])],
    programId
  );
};

export const findVaultAuthorityPda = (vault: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault_auth'), vault.toBuffer()],
    programId
  );
};

export const findGuardianEntryPda = (vault: PublicKey, guardian: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('guardian'), vault.toBuffer(), guardian.toBuffer()],
    programId
  );
};

export const findBeneficiaryEntryPda = (vault: PublicKey, beneficiary: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('beneficiary'), vault.toBuffer(), beneficiary.toBuffer()],
    programId
  );
};

export const findUnlockSessionPda = (vault: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('unlock_session'), vault.toBuffer()],
    programId
  );
};

8. dashboard/src/lib/siws.ts

TypeScript

import { config } from '../config/constants';

export interface SIWSMessage {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: string;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
}

export function buildSIWSMessage(params: {
  address: string;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
}): string {
  const { address, nonce, issuedAt, expirationTime } = params;

  let message = `${config.siwsDomain} wants you to sign in with your Solana account:\n`;
  message += `${address}\n\n`;
  message += `${config.siwsStatement}\n\n`;
  message += `URI: https://${config.siwsDomain}\n`;
  message += `Version: 1\n`;
  message += `Chain ID: mainnet\n`;
  message += `Nonce: ${nonce}\n`;
  message += `Issued At: ${issuedAt}`;

  if (expirationTime) {
    message += `\nExpiration Time: ${expirationTime}`;
  }

  return message;
}

9. dashboard/src/lib/crypto.ts (from Phase 3 spec)

TypeScript

const ALG = { name: 'AES-GCM', length: 256 };
const IV_LENGTH = 12;

export async function generateDocumentKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(ALG, true, ['encrypt', 'decrypt']);
}

export async function encryptFile(
  file: ArrayBuffer,
  key: CryptoKey
): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, file);
  return { ciphertext, iv };
}

export async function decryptFile(
  ciphertext: ArrayBuffer,
  iv: Uint8Array,
  key: CryptoKey
): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
}

export async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function exportKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

export async function importKey(b64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey('raw', raw, ALG, true, ['encrypt', 'decrypt']);
}

10. dashboard/src/types/api.ts (copy from Build 4 API types)

TypeScript

// Copy the entire types/api.ts from Build 4's API server
// This ensures frontend and backend share the same type contract

export interface VaultSummaryResponse {
  pubkey: string;
  ownerPubkey: string;
  status: 'locked' | 'unlocking' | 'unlocked' | 'frozen' | 'distributed';
  createdAt: number;
  lastCheckIn: number;
  timelockStart: number | null;
  inactivityThreshold: number;
  timelockDuration: number;
  guardianThreshold: number;
  totalGuardians: number;
  totalBeneficiaries: number;
  totalBps: number;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  subscriptionExpiry: number | null;
  daysSinceCheckIn: number;
  daysRemaining: number;
  checkInHealth: 'healthy' | 'warning' | 'danger';
  approvedGuardians: number;
  totalUsdValue: number;
  unlockSession: UnlockSessionView | null;
}

export interface UnlockSessionView {
  pubkey: string;
  status: string;
  initiatedBy: string;
  initiatedAt: number;
  approvedAt: number | null;
  timelockStartedAt: number | null;
  timelockEndsAt: number | null;
  executedAt: number | null;
  approvalCount: number;
  threshold: number;
  timeRemaining: number | null;
}

export interface GuardianView {
  pubkey: string;
  role: 'personal' | 'professional' | 'delegate';
  status: 'pending' | 'active' | 'inactive' | 'removed';
  approved: boolean;
  approvalTime: number | null;
  name: string | null;
  avatar: string | null;
  lastContact: number | null;
  reputation: number | null;
  bondAmount: number | null;
}

export interface BeneficiaryView {
  pubkey: string;
  shareBps: number;
  active: boolean;
  name: string | null;
  avatar: string | null;
  assetOverrides: AssetOverrideView[];
}

export interface AssetOverrideView {
  mint: string;
  mode: 'pro-rata' | 'fixed-bps' | 'entire-to-beneficiary';
  fixedBps: number | null;
}

export interface VaultAssetView {
  type: 'SOL' | 'SPL' | 'NFT' | 'POSITION';
  mint: string | null;
  symbol: string;
  name: string;
  icon: string | null;
  balance: number;
  usdValue: number;
  change24h: number | null;
}

export interface TxBuilderResponse {
  transaction: string; // base64 unsigned VersionedTransaction
  estimatedFee: number;
  computeUnits: number;
  warnings: string[];
}

// Add remaining types from Build 4 api.ts...
// (LivenessSummaryResponse, DistributionStateResponse, DocumentView, etc.)

11. dashboard/src/hooks/useAuth.ts

TypeScript

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { api } from '../lib/api';
import { buildSIWSMessage } from '../lib/siws';
import bs58 from 'bs58';

interface AuthState {
  isAuthenticated: boolean;
  wallet: string | null;
  role: 'owner' | 'guardian' | 'beneficiary' | 'viewer' | null;
  isSigningIn: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  signIn: () => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { publicKey, signMessage, connected } = useWallet();
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    wallet: null,
    role: null,
    isSigningIn: false,
    error: null,
  });

  const signIn = async () => {
    if (!publicKey || !signMessage) {
      setState((s) => ({ ...s, error: 'Wallet not connected' }));
      return;
    }

    setState((s) => ({ ...s, isSigningIn: true, error: null }));

    try {
      // 1. Get nonce
      const { nonce, expiresAt } = await api.get<{ nonce: string; expiresAt: number }>(
        `/auth/nonce?wallet=${publicKey.toBase58()}`
      );

      // 2. Build SIWS message
      const message = buildSIWSMessage({
        address: publicKey.toBase58(),
        nonce,
        issuedAt: new Date().toISOString(),
        expirationTime: new Date(expiresAt * 1000).toISOString(),
      });

      // 3. Sign message
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = await signMessage(messageBytes);
      const signature = bs58.encode(signatureBytes);

      // 4. Verify and get tokens
      const { accessToken, refreshToken, wallet: walletPubkey } = await api.post<{
        accessToken: string;
        refreshToken: string;
        wallet: string;
      }>('/

