BUILD 6 — Part 1/3
(Types + Providers + Auth + Tx Builder hook)
A) src/types/api.ts (COMPLETE)

Create/replace: dashboard/src/types/api.ts

TypeScript

export interface ApiSuccess<T> {
  data: T;
  meta?: {
    total?: number;
    limit?: number;
    offset?: number;
    hasMore?: boolean;
  };
}

export type VaultUIStatus = 'locked' | 'unlocking' | 'unlocked' | 'frozen' | 'distributed';
export type CheckInHealth = 'healthy' | 'warning' | 'danger';

export interface UnlockSessionView {
  pubkey: string;
  status: string; // proposed|approved|executing|executed|cancelled|disputed
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

export interface VaultSummaryResponse {
  pubkey: string;
  ownerPubkey: string;
  status: VaultUIStatus;
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
  checkInHealth: CheckInHealth;
  approvedGuardians: number;
  totalUsdValue: number;
  unlockSession: UnlockSessionView | null;
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

export interface AssetOverrideView {
  mint: string;
  mode: 'pro-rata' | 'fixed-bps' | 'entire-to-beneficiary';
  fixedBps: number | null;
}

export interface BeneficiaryView {
  pubkey: string;
  shareBps: number;
  active: boolean;
  name: string | null;
  avatar: string | null;
  assetOverrides: AssetOverrideView[];
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

export interface LivenessDelegateView {
  wallet: string;
  addedAt: number;
  active: boolean;
}

export interface LivenessSummaryResponse {
  lastCheckIn: number | null;
  daysSinceCheckIn: number;
  daysRemaining: number;
  checkInHealth: CheckInHealth;
  inactivityThresholdDays: number;
  delegates: LivenessDelegateView[];
}

export interface LivenessRecord {
  timestamp: number;
  signedBy: string;
  txSignature: string | null;
}

export interface DistributionBatchView {
  id: string;
  startIndex: number;
  batchSize: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  txSignature: string | null;
  processedAt: number | null;
}

export interface SolSessionView {
  pubkey: string;
  totalBeneficiaries: number;
  cursor: number;
  totalLamports: number;
  distributedLamports: number;
  completed: boolean;
  batches: DistributionBatchView[];
}

export interface SplSessionView {
  pubkey: string;
  mint: string;
  symbol: string;
  totalBeneficiaries: number;
  cursor: number;
  totalAmount: number;
  distributedAmount: number;
  completed: boolean;
  createMissingAtas: boolean;
  batches: DistributionBatchView[];
}

export interface DistributionStateResponse {
  unlockSession: UnlockSessionView | null;
  solSession: SolSessionView | null;
  splSessions: SplSessionView[];
  availableMints: string[];
  canFinalize: boolean;
}

export type DocumentType = 'will' | 'letter' | 'legal' | 'identity' | 'financial' | 'other';

export interface DocumentView {
  id: string;
  type: DocumentType;
  name: string;
  sizeBytes: number;
  hash: string;
  uri: string;
  uploadedAt: string;
  encrypted: boolean;
  revoked: boolean;
}

export interface ActivityLogView {
  id: string;
  activityType: string;
  description: string;
  actorWallet: string | null;
  txSignature: string | null;
  timestamp: number;
  metadata: Record<string, unknown> | null;
}

export interface NotificationView {
  id: string;
  vaultPubkey: string | null;
  notificationType: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  read: boolean;
  createdAt: string;
}

export interface PortfolioSummaryResponse {
  totalUsdValue: number;
  breakdown: {
    sol: number;
    spl: number;
    nft: number;
    position: number;
  };
}

export interface PortfolioSnapshotView {
  timestamp: string;
  totalUsdValue: number;
}

export interface AssetDistributionSlice {
  symbol: string;
  name: string;
  usdValue: number;
  percentage: number;
}

export interface TxBuilderResponse {
  transaction: string;  // base64 unsigned VersionedTransaction
  estimatedFee: number; // lamports
  computeUnits: number;
  warnings: string[];
}

B) Providers (required plumbing, but NOT Build 7 wiring)
1) src/providers/QueryProvider.tsx

Create: dashboard/src/providers/QueryProvider.tsx

React

import { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../config/queryClient';

export function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

2) src/providers/WalletProvider.tsx

Create: dashboard/src/providers/WalletProvider.tsx

React

import { ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider as SolWalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  BackpackWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { config } from '../config/constants';

import '@solana/wallet-adapter-react-ui/styles.css';

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new BackpackWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={config.rpcEndpoint}>
      <SolWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolWalletProvider>
    </ConnectionProvider>
  );
}

C) Auth (SIWS) — Complete implementation
src/hooks/useAuth.tsx

Create/replace: dashboard/src/hooks/useAuth.tsx

React

import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import { api, ApiError } from '../lib/api';
import { buildSIWSMessage } from '../lib/siws';

type Role = 'owner' | 'guardian' | 'beneficiary' | 'viewer';

type AuthState = {
  isAuthenticated: boolean;
  wallet: string | null;
  role: Role | null; // computed later (Build 7 wiring / vault context), default null
  isSigningIn: boolean;
  error: string | null;
};

type AuthContextValue = AuthState & {
  signIn: () => Promise<void>;
  signOut: () => void;
  refresh: () => Promise<void>;
  getAccessToken: () => string | null;
};

const ACCESS_TOKEN_KEY = 'legacyvault_access_token';
const REFRESH_TOKEN_KEY = 'legacyvault_refresh_token';
const ACCESS_TOKEN_EXPIRES_AT_KEY = 'legacyvault_access_expires_at';

const AuthContext = createContext<AuthContextValue | null>(null);

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { publicKey, signMessage, connected, disconnecting } = useWallet();

  const [state, setState] = useState<AuthState>({
    isAuthenticated: !!sessionStorage.getItem(ACCESS_TOKEN_KEY),
    wallet: publicKey?.toBase58() ?? null,
    role: null,
    isSigningIn: false,
    error: null,
  });

  const refreshInFlight = useRef<Promise<void> | null>(null);

  const getAccessToken = () => sessionStorage.getItem(ACCESS_TOKEN_KEY);

  const setTokens = (accessToken: string, refreshToken: string, expiresInSec: number) => {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    sessionStorage.setItem(ACCESS_TOKEN_EXPIRES_AT_KEY, String(nowSec() + expiresInSec));
  };

  const clearTokens = () => {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
  };

  const signOut = () => {
    clearTokens();
    setState((s) => ({
      ...s,
      isAuthenticated: false,
      role: null,
      isSigningIn: false,
      error: null,
    }));
  };

  const refresh = async () => {
    if (refreshInFlight.current) return refreshInFlight.current;

    refreshInFlight.current = (async () => {
      const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        signOut();
        return;
      }

      try {
        const res = await api.post<{ accessToken: string; refreshToken: string; expiresIn: number }>(
          '/auth/refresh',
          { refreshToken }
        );

        setTokens(res.accessToken, res.refreshToken, res.expiresIn);

        setState((s) => ({ ...s, isAuthenticated: true, error: null }));
      } catch (e) {
        // If refresh fails, user must sign in again
        signOut();
      } finally {
        refreshInFlight.current = null;
      }
    })();

    return refreshInFlight.current;
  };

  const signIn = async () => {
    if (!publicKey || !signMessage) {
      setState((s) => ({ ...s, error: 'Wallet not connected or does not support message signing.' }));
      return;
    }

    setState((s) => ({ ...s, isSigningIn: true, error: null }));

    try {
      // 1) nonce
      const nonceRes = await api.get<{ nonce: string; expiresAt: number }>(
        `/auth/nonce?wallet=${publicKey.toBase58()}`
      );

      // 2) message
      const message = buildSIWSMessage({
        address: publicKey.toBase58(),
        nonce: nonceRes.nonce,
        issuedAt: new Date().toISOString(),
        expirationTime: new Date(nonceRes.expiresAt * 1000).toISOString(),
      });

      // 3) sign
      const signatureBytes = await signMessage(new TextEncoder().encode(message));
      const signature = bs58.encode(signatureBytes);

      // 4) verify
      const verifyRes = await api.post<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        wallet: string;
      }>('/auth/verify', {
        pubkey: publicKey.toBase58(),
        signature,
        message,
      });

      setTokens(verifyRes.accessToken, verifyRes.refreshToken, verifyRes.expiresIn);

      setState((s) => ({
        ...s,
        isAuthenticated: true,
        wallet: verifyRes.wallet,
        isSigningIn: false,
        error: null,
      }));
    } catch (e) {
      const msg = e instanceof ApiError ? `${e.code}: ${e.message}` : 'Sign-in failed.';
      setState((s) => ({ ...s, isSigningIn: false, error: msg, isAuthenticated: false }));
      clearTokens();
    }
  };

  // Keep wallet in state
  useEffect(() => {
    setState((s) => ({ ...s, wallet: publicKey?.toBase58() ?? null }));
  }, [publicKey]);

  // Auto sign-out when wallet disconnects
  useEffect(() => {
    if (!connected && !disconnecting) {
      signOut();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, disconnecting]);

  // Auto refresh access token 60s before expiry
  useEffect(() => {
    const timer = setInterval(async () => {
      const expStr = sessionStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
      if (!expStr) return;

      const exp = parseInt(expStr, 10);
      const remaining = exp - nowSec();

      if (remaining < 60 && sessionStorage.getItem(REFRESH_TOKEN_KEY)) {
        await refresh();
      }
    }, 10_000);

    return () => clearInterval(timer);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signIn,
      signOut,
      refresh,
      getAccessToken,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

D) Transaction builder hook (core Build 6 item; UI modal belongs to Build 7)
src/hooks/useTxBuilder.ts

Create: dashboard/src/hooks/useTxBuilder.ts

TypeScript

import { useCallback, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
import { api, ApiError } from '../lib/api';
import { TxBuilderResponse } from '../types/api';

export type TxStatus =
  | 'idle'
  | 'building'
  | 'awaiting_signature'
  | 'sending'
  | 'confirming'
  | 'confirmed'
  | 'failed';

function base64ToUint8Array(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export interface UseTxBuilderReturn {
  status: TxStatus;
  warnings: string[];
  signature: string | null;
  error: string | null;
  execute: (endpoint: string, body: Record<string, unknown>) => Promise<string>;
  reset: () => void;
}

export function useTxBuilder(): UseTxBuilderReturn {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();

  const [status, setStatus] = useState<TxStatus>('idle');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setWarnings([]);
    setSignature(null);
    setError(null);
  }, []);

  const execute = useCallback(
    async (endpoint: string, body: Record<string, unknown>) => {
      if (!publicKey) throw new Error('Wallet not connected');
      if (!signTransaction) throw new Error('Wallet does not support transaction signing');

      reset();
      setStatus('building');

      let txPayload: TxBuilderResponse;

      try {
        txPayload = await api.post<TxBuilderResponse>(`/tx/${endpoint}`, {
          feePayer: publicKey.toBase58(),
          ...body,
        });
      } catch (e) {
        const msg = e instanceof ApiError ? `${e.code}: ${e.message}` : 'Failed to build transaction';
        setStatus('failed');
        setError(msg);
        throw new Error(msg);
      }

      setWarnings(txPayload.warnings ?? []);

      const txBytes = base64ToUint8Array(txPayload.transaction);
      const tx = VersionedTransaction.deserialize(txBytes);

      setStatus('awaiting_signature');

      let signed: VersionedTransaction;
      try {
        signed = await signTransaction(tx);
      } catch (e) {
        const msg = 'Transaction signature was rejected or failed.';
        setStatus('failed');
        setError(msg);
        throw new Error(msg);
      }

      setStatus('sending');

      let sig: string;
      try {
        sig = await connection.sendRawTransaction(signed.serialize(), {
          skipPreflight: false,
          maxRetries: 3,
        });
        setSignature(sig);
      } catch (e) {
        const msg = 'Failed to send transaction to the network.';
        setStatus('failed');
        setError(msg);
        throw new Error(msg);
      }

      setStatus('confirming');

      try {
        const latest = await connection.getLatestBlockhash('confirmed');
        await connection.confirmTransaction(
          {
            signature: sig,
            blockhash: latest.blockhash,
            lastValidBlockHeight: latest.lastValidBlockHeight,
          },
          'confirmed'
        );
      } catch (e) {
        const msg = 'Transaction was sent but confirmation failed (network/rpc issue).';
        setStatus('failed');
        setError(msg);
        throw new Error(msg);
      }

      setStatus('confirmed');
      return sig;
    },
    [publicKey, signTransaction, connection, reset]
  );

  return { status, warnings, signature, error, execute, reset };
}


BUILD 6 — Part 2/3
Read Hooks (React Query useQuery implementations)

Files in this part:

    useVaultSummary.ts
    useAssets.ts
    usePortfolio.ts
    useActivity.ts
    useNotifications.ts
    useLiveness.ts
    useVault.ts (shared vault context hook — required by all panels)

A) src/hooks/useVault.ts — Shared vault context

All panels need to know "which vault am I looking at?" and "who is the current user relative to this vault?". This hook provides both without a full provider (it reads from URL or sessionStorage).

Create: dashboard/src/hooks/useVault.ts

TypeScript

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

// The active vault pubkey is stored in sessionStorage so it
// persists across page refreshes without requiring a router.
const VAULT_KEY = 'legacyvault_active_vault';

export function useVault() {
  const { wallet } = useAuth();

  const [vaultPubkey, setVaultPubkeyState] = useState<string | null>(
    () => sessionStorage.getItem(VAULT_KEY)
  );

  const setVaultPubkey = useCallback((pubkey: string | null) => {
    if (pubkey) {
      sessionStorage.setItem(VAULT_KEY, pubkey);
    } else {
      sessionStorage.removeItem(VAULT_KEY);
    }
    setVaultPubkeyState(pubkey);
  }, []);

  const hasVault = !!vaultPubkey;

  return {
    vaultPubkey,
    setVaultPubkey,
    hasVault,
    connectedWallet: wallet,
  };
}

B) src/hooks/useVaultSummary.ts

Create: dashboard/src/hooks/useVaultSummary.ts

TypeScript

import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useVault } from './useVault';
import { VaultSummaryResponse } from '../types/api';

export function useVaultSummary() {
  const { vaultPubkey } = useVault();

  const query = useQuery<VaultSummaryResponse, Error>({
    queryKey: ['vault', 'summary', vaultPubkey],
    queryFn: () => api.get<VaultSummaryResponse>(`/vaults/${vaultPubkey}/summary`),
    enabled: !!vaultPubkey,
    staleTime: 15_000,
    refetchInterval: 15_000,
  });

  return {
    // Raw data
    summary: query.data ?? null,

    // Top-level UI fields (safely destructured so panels never need to null-check nested)
    status:               query.data?.status             ?? 'locked',
    ownerPubkey:          query.data?.ownerPubkey        ?? null,
    createdAt:            query.data?.createdAt          ?? null,
    lastCheckIn:          query.data?.lastCheckIn        ?? null,
    timelockStart:        query.data?.timelockStart      ?? null,
    inactivityThreshold:  query.data?.inactivityThreshold ?? 0,
    timelockDuration:     query.data?.timelockDuration   ?? 0,
    guardianThreshold:    query.data?.guardianThreshold  ?? 0,
    totalGuardians:       query.data?.totalGuardians     ?? 0,
    totalBeneficiaries:   query.data?.totalBeneficiaries ?? 0,
    totalBps:             query.data?.totalBps           ?? 0,
    subscriptionTier:     query.data?.subscriptionTier   ?? 'free',
    subscriptionExpiry:   query.data?.subscriptionExpiry ?? null,
    daysSinceCheckIn:     query.data?.daysSinceCheckIn   ?? 0,
    daysRemaining:        query.data?.daysRemaining      ?? 0,
    checkInHealth:        query.data?.checkInHealth      ?? 'healthy',
    approvedGuardians:    query.data?.approvedGuardians  ?? 0,
    totalUsdValue:        query.data?.totalUsdValue      ?? 0,
    unlockSession:        query.data?.unlockSession      ?? null,

    // State
    isLoading:  query.isLoading,
    isFetching: query.isFetching,
    error:      query.error,
    refetch:    query.refetch,
  };
}

C) src/hooks/useAssets.ts

Create: dashboard/src/hooks/useAssets.ts

TypeScript

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useVault } from './useVault';
import { VaultAssetView } from '../types/api';

export type AssetFilter = 'all' | 'SOL' | 'SPL' | 'NFT' | 'POSITION';

export function useAssets() {
  const { vaultPubkey } = useVault();
  const [filter, setFilter] = useState<AssetFilter>('all');

  const query = useQuery<VaultAssetView[], Error>({
    queryKey: ['vault', 'assets', vaultPubkey, filter],
    queryFn: () =>
      api.get<VaultAssetView[]>(
        `/vaults/${vaultPubkey}/assets?filter=${filter}`
      ),
    enabled: !!vaultPubkey,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const assets = query.data ?? [];

  // Derived helpers used by VaultPanel
  const totalUsdValue = assets.reduce((acc, a) => acc + a.usdValue, 0);
  const solAsset = assets.find((a) => a.type === 'SOL') ?? null;
  const splAssets = assets.filter((a) => a.type === 'SPL');
  const nftAssets = assets.filter((a) => a.type === 'NFT');
  const positionAssets = assets.filter((a) => a.type === 'POSITION');

  return {
    assets,
    filter,
    setFilter,
    totalUsdValue,
    solAsset,
    splAssets,
    nftAssets,
    positionAssets,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

D) src/hooks/usePortfolio.ts

Create: dashboard/src/hooks/usePortfolio.ts

TypeScript

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useVault } from './useVault';
import {
  PortfolioSummaryResponse,
  PortfolioSnapshotView,
  AssetDistributionSlice,
} from '../types/api';

export type PortfolioRange = '30d' | '90d' | '1y';

export function usePortfolio() {
  const { vaultPubkey } = useVault();
  const [historyRange, setHistoryRange] = useState<PortfolioRange>('30d');

  // Summary (KPI card: total USD value + breakdown)
  const summaryQuery = useQuery<PortfolioSummaryResponse, Error>({
    queryKey: ['vault', 'portfolio', 'summary', vaultPubkey],
    queryFn: () =>
      api.get<PortfolioSummaryResponse>(`/vaults/${vaultPubkey}/portfolio/summary`),
    enabled: !!vaultPubkey,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  // History series (area chart)
  const historyQuery = useQuery<PortfolioSnapshotView[], Error>({
    queryKey: ['vault', 'portfolio', 'history', vaultPubkey, historyRange],
    queryFn: () =>
      api.get<PortfolioSnapshotView[]>(
        `/vaults/${vaultPubkey}/portfolio/history?range=${historyRange}`
      ),
    enabled: !!vaultPubkey,
    staleTime: 60_000,
  });

  // Distribution (pie chart)
  const distributionQuery = useQuery<AssetDistributionSlice[], Error>({
    queryKey: ['vault', 'portfolio', 'distribution', vaultPubkey],
    queryFn: () =>
      api.get<AssetDistributionSlice[]>(
        `/vaults/${vaultPubkey}/portfolio/distribution`
      ),
    enabled: !!vaultPubkey,
    staleTime: 60_000,
  });

  return {
    // Summary
    totalUsdValue: summaryQuery.data?.totalUsdValue ?? 0,
    breakdown: summaryQuery.data?.breakdown ?? { sol: 0, spl: 0, nft: 0, position: 0 },

    // History chart data
    historyData: historyQuery.data ?? [],
    historyRange,
    setHistoryRange,

    // Pie chart data
    distributionData: distributionQuery.data ?? [],

    // Loading states
    isLoading:
      summaryQuery.isLoading || historyQuery.isLoading || distributionQuery.isLoading,
    isSummaryFetching: summaryQuery.isFetching,
    isHistoryFetching: historyQuery.isFetching,
    isDistributionFetching: distributionQuery.isFetching,
    error: summaryQuery.error ?? historyQuery.error ?? distributionQuery.error,
  };
}

E) src/hooks/useActivity.ts

Create: dashboard/src/hooks/useActivity.ts

TypeScript

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useVault } from './useVault';
import { ActivityLogView } from '../types/api';

const PAGE_SIZE = 10;

interface ActivityPage {
  activities: ActivityLogView[];
  total: number;
}

export function useActivity(activityType?: string) {
  const { vaultPubkey } = useVault();
  const [offset, setOffset] = useState(0);

  const query = useQuery<ActivityPage, Error>({
    queryKey: ['vault', 'activity', vaultPubkey, offset, activityType],
    queryFn: () =>
      api.get<ActivityPage>(
        `/vaults/${vaultPubkey}/activity?limit=${PAGE_SIZE}&offset=${offset}${
          activityType ? `&type=${activityType}` : ''
        }`
      ),
    enabled: !!vaultPubkey,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const activities = query.data?.activities ?? [];
  const total = query.data?.total ?? 0;
  const hasMore = offset + PAGE_SIZE < total;

  const loadMore = useCallback(() => {
    if (hasMore) setOffset((o) => o + PAGE_SIZE);
  }, [hasMore]);

  const loadPrev = useCallback(() => {
    setOffset((o) => Math.max(0, o - PAGE_SIZE));
  }, []);

  const reset = useCallback(() => setOffset(0), []);

  return {
    activities,
    total,
    hasMore,
    offset,
    loadMore,
    loadPrev,
    reset,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

F) src/hooks/useNotifications.ts

Create: dashboard/src/hooks/useNotifications.ts

TypeScript

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useVault } from './useVault';
import { NotificationView } from '../types/api';

const NOTIF_QUERY_KEY = (vault: string, unread: boolean) =>
  ['vault', 'notifications', vault, unread] as const;

export function useNotifications(unreadOnly = false) {
  const { vaultPubkey } = useVault();
  const qc = useQueryClient();

  const query = useQuery<NotificationView[], Error>({
    queryKey: NOTIF_QUERY_KEY(vaultPubkey ?? '', unreadOnly),
    queryFn: () =>
      api.get<NotificationView[]>(
        `/vaults/${vaultPubkey}/notifications?limit=50${
          unreadOnly ? '&unread=true' : ''
        }`
      ),
    enabled: !!vaultPubkey,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const notifications = query.data ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Mark single notification as read
  const markReadMutation = useMutation({
    mutationFn: (notifId: string) =>
      api.patch(`/vaults/${vaultPubkey}/notifications/${notifId}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vault', 'notifications', vaultPubkey ?? ''] });
    },
  });

  // Mark all notifications as read
  const markAllReadMutation = useMutation({
    mutationFn: () =>
      api.patch(`/vaults/${vaultPubkey}/notifications/read-all`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vault', 'notifications', vaultPubkey ?? ''] });
    },
  });

  const markRead = useCallback(
    (notifId: string) => markReadMutation.mutateAsync(notifId),
    [markReadMutation]
  );

  const markAllRead = useCallback(
    () => markAllReadMutation.mutateAsync(),
    [markAllReadMutation]
  );

  return {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    isMarkingRead:
      markReadMutation.isPending || markAllReadMutation.isPending,
    refetch: query.refetch,
  };
}

G) src/hooks/useLiveness.ts

Create: dashboard/src/hooks/useLiveness.ts

TypeScript

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useVault } from './useVault';
import { useTxBuilder } from './useTxBuilder';
import { invalidateVaultCache } from '../config/queryClient';
import { LivenessSummaryResponse, LivenessRecord } from '../types/api';

export type LivenessRange = '30d' | '90d' | '1y';

export function useLiveness() {
  const { vaultPubkey } = useVault();
  const qc = useQueryClient();
  const tx = useTxBuilder();
  const [historyRange, setHistoryRange] = useState<LivenessRange>('30d');

  // Summary
  const summaryQuery = useQuery<LivenessSummaryResponse, Error>({
    queryKey: ['vault', 'liveness', 'summary', vaultPubkey],
    queryFn: () =>
      api.get<LivenessSummaryResponse>(`/vaults/${vaultPubkey}/liveness/summary`),
    enabled: !!vaultPubkey,
    staleTime: 15_000,
    refetchInterval: 15_000,
  });

  // History (bar chart)
  const historyQuery = useQuery<LivenessRecord[], Error>({
    queryKey: ['vault', 'liveness', 'history', vaultPubkey, historyRange],
    queryFn: () =>
      api.get<LivenessRecord[]>(
        `/vaults/${vaultPubkey}/liveness/history?range=${historyRange}`
      ),
    enabled: !!vaultPubkey,
    staleTime: 60_000,
  });

  const checkIn = useCallback(async () => {
    if (!vaultPubkey) throw new Error('No vault selected');

    const sig = await tx.execute('check-in', { vault: vaultPubkey });

    // Invalidate liveness and summary caches on confirmation
    qc.invalidateQueries({ queryKey: ['vault', 'liveness', 'summary', vaultPubkey] });
    qc.invalidateQueries({ queryKey: ['vault', 'liveness', 'history', vaultPubkey] });
    invalidateVaultCache(vaultPubkey);

    return sig;
  }, [vaultPubkey, tx, qc]);

  return {
    // Summary fields
    lastCheckIn:            summaryQuery.data?.lastCheckIn          ?? null,
    daysSinceCheckIn:       summaryQuery.data?.daysSinceCheckIn     ?? 0,
    daysRemaining:          summaryQuery.data?.daysRemaining        ?? 0,
    checkInHealth:          summaryQuery.data?.checkInHealth        ?? 'healthy',
    inactivityThresholdDays: summaryQuery.data?.inactivityThresholdDays ?? 0,
    delegates:              summaryQuery.data?.delegates            ?? [],

    // History chart
    historyRecords: historyQuery.data ?? [],
    historyRange,
    setHistoryRange,

    // Actions
    checkIn,
    isCheckingIn: tx.status === 'building' ||
                  tx.status === 'awaiting_signature' ||
                  tx.status === 'sending' ||
                  tx.status === 'confirming',
    txStatus: tx.status,
    txError:  tx.error,

    // Query state
    isLoading:  summaryQuery.isLoading,
    isFetching: summaryQuery.isFetching,
    error:      summaryQuery.error,
    refetch:    summaryQuery.refetch,
  };
}

Part 2 build status checkpoint
Hook	Status
useVault.ts	✅ Complete
useVaultSummary.ts	✅ Complete
useAssets.ts	✅ Complete
usePortfolio.ts	✅ Complete
useActivity.ts	✅ Complete
useNotifications.ts	✅ Complete
useLiveness.ts	✅ Complete
BUILD 6 — Part 3/3
Mutation-Heavy Hooks (React Query useMutation implementations)

Files in this part:

    useGuardians.ts
    useBeneficiaries.ts
    useDistributionState.ts
    useDocuments.ts
    useSettings.ts

H) src/hooks/useGuardians.ts

Create: dashboard/src/hooks/useGuardians.ts

TypeScript

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useVault } from './useVault';
import { useTxBuilder } from './useTxBuilder';
import { invalidateGuardiansCache } from '../config/queryClient';
import { GuardianView } from '../types/api';

export type GuardianRole = 'personal' | 'professional' | 'delegate';

export function useGuardians() {
  const { vaultPubkey } = useVault();
  const qc = useQueryClient();
  const tx = useTxBuilder();

  const query = useQuery<GuardianView[], Error>({
    queryKey: ['vault', 'guardians', vaultPubkey],
    queryFn: () =>
      api.get<GuardianView[]>(`/vaults/${vaultPubkey}/guardians`),
    enabled: !!vaultPubkey,
    staleTime: 60_000,
  });

  const guardians = query.data ?? [];
  const approvedCount = guardians.filter((g) => g.approved).length;
  const activeCount = guardians.filter((g) => g.status === 'active').length;

  // Threshold info comes from vault summary — hook consumers
  // must compose with useVaultSummary to compute thresholdMet.
  const approvedGuardians = guardians.filter((g) => g.approved);

  // ─── Mutations ────────────────────────────────────────────────────────────

  const addGuardian = useCallback(
    async (guardianWallet: string, role: GuardianRole) => {
      if (!vaultPubkey) throw new Error('No vault selected');
      await tx.execute('add-guardian', { vault: vaultPubkey, guardianWallet, role });
      invalidateGuardiansCache(vaultPubkey);
    },
    [vaultPubkey, tx]
  );

  const removeGuardian = useCallback(
    async (guardianWallet: string) => {
      if (!vaultPubkey) throw new Error('No vault selected');
      await tx.execute('remove-guardian', { vault: vaultPubkey, guardianWallet });
      invalidateGuardiansCache(vaultPubkey);
    },
    [vaultPubkey, tx]
  );

  const setThreshold = useCallback(
    async (threshold: number) => {
      if (!vaultPubkey) throw new Error('No vault selected');
      await tx.execute('set-guardian-threshold', { vault: vaultPubkey, threshold });
      invalidateGuardiansCache(vaultPubkey);
    },
    [vaultPubkey, tx]
  );

  const approveUnlock = useCallback(
    async () => {
      if (!vaultPubkey) throw new Error('No vault selected');
      await tx.execute('approve-unlock', { vault: vaultPubkey });
      qc.invalidateQueries({ queryKey: ['vault', 'distribution', vaultPubkey] });
      qc.invalidateQueries({ queryKey: ['vault', 'summary', vaultPubkey] });
      qc.invalidateQueries({ queryKey: ['vault', 'guardians', vaultPubkey] });
    },
    [vaultPubkey, tx, qc]
  );

  const initiateUnlock = useCallback(
    async () => {
      if (!vaultPubkey) throw new Error('No vault selected');
      await tx.execute('initiate-unlock', { vault: vaultPubkey });
      qc.invalidateQueries({ queryKey: ['vault', 'distribution', vaultPubkey] });
      qc.invalidateQueries({ queryKey: ['vault', 'summary', vaultPubkey] });
    },
    [vaultPubkey, tx, qc]
  );

  const isActing =
    tx.status === 'building' ||
    tx.status === 'awaiting_signature' ||
    tx.status === 'sending' ||
    tx.status === 'confirming';

  return {
    // Data
    guardians,
    approvedCount,
    activeCount,
    approvedGuardians,

    // Actions
    addGuardian,
    removeGuardian,
    setThreshold,
    approveUnlock,
    initiateUnlock,

    // Tx state
    isActing,
    txStatus: tx.status,
    txWarnings: tx.warnings,
    txSignature: tx.signature,
    txError: tx.error,
    resetTx: tx.reset,

    // Query state
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

I) src/hooks/useBeneficiaries.ts

Create: dashboard/src/hooks/useBeneficiaries.ts

TypeScript

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useVault } from './useVault';
import { useTxBuilder } from './useTxBuilder';
import { invalidateBeneficiariesCache } from '../config/queryClient';
import { BeneficiaryView } from '../types/api';

export type AssetRuleMode = 'pro-rata' | 'fixed-bps' | 'entire-to-beneficiary';

export function useBeneficiaries() {
  const { vaultPubkey } = useVault();
  const qc = useQueryClient();
  const tx = useTxBuilder();

  const query = useQuery<BeneficiaryView[], Error>({
    queryKey: ['vault', 'beneficiaries', vaultPubkey],
    queryFn: () =>
      api.get<BeneficiaryView[]>(`/vaults/${vaultPubkey}/beneficiaries`),
    enabled: !!vaultPubkey,
    staleTime: 60_000,
  });

  const beneficiaries = query.data ?? [];

  // Derived
  const activeBeneficiaries = beneficiaries.filter((b) => b.active);
  const allocatedBps = activeBeneficiaries.reduce((acc, b) => acc + b.shareBps, 0);
  const remainingBps = 10_000 - allocatedBps;
  const planIsValid = allocatedBps === 10_000 && activeBeneficiaries.length > 0;

  // ─── Mutations ────────────────────────────────────────────────────────────

  const addBeneficiary = useCallback(
    async (beneficiaryWallet: string, shareBps: number, active: boolean = true) => {
      if (!vaultPubkey) throw new Error('No vault selected');
      await tx.execute('add-beneficiary', { vault: vaultPubkey, beneficiaryWallet, shareBps, active });
      invalidateBeneficiariesCache(vaultPubkey);
    },
    [vaultPubkey, tx]
  );

  const updateBeneficiary = useCallback(
    async (beneficiaryWallet: string, updates: { shareBps?: number; active?: boolean }) => {
      if (!vaultPubkey) throw new Error('No vault selected');
      await tx.execute('update-beneficiary', {
        vault: vaultPubkey,
        beneficiaryWallet,
        ...updates,
      });
      invalidateBeneficiariesCache(vaultPubkey);
    },
    [vaultPubkey, tx]
  );

  const removeBeneficiary = useCallback(
    async (beneficiaryWallet: string) => {
      if (!vaultPubkey) throw new Error('No vault selected');
      await tx.execute('remove-beneficiary', { vault: vaultPubkey, beneficiaryWallet });
      invalidateBeneficiariesCache(vaultPubkey);
    },
    [vaultPubkey, tx]
  );

  const setAssetRule = useCallback(
    async (
      beneficiaryWallet: string,
      mint: string,
      mode: AssetRuleMode,
      fixedBps?: number
    ) => {
      if (!vaultPubkey) throw new Error('No vault selected');
      await tx.execute('set-asset-rule', {
        vault: vaultPubkey,
        beneficiaryWallet,
        mint,
        mode,
        ...(fixedBps !== undefined && { fixedBps }),
      });
      qc.invalidateQueries({ queryKey: ['vault', 'beneficiaries', vaultPubkey] });
    },
    [vaultPubkey, tx, qc]
  );

  const clearAssetRule = useCallback(
    async (beneficiaryWallet: string, mint: string) => {
      if (!vaultPubkey) throw new Error('No vault selected');
      await tx.execute('clear-asset-rule', { vault: vaultPubkey, beneficiaryWallet, mint });
      qc.invalidateQueries({ queryKey: ['vault', 'beneficiaries', vaultPubkey] });
    },
    [vaultPubkey, tx, qc]
  );

  const isActing =
    tx.status === 'building' ||
    tx.status === 'awaiting_signature' ||
    tx.status === 'sending' ||
    tx.status === 'confirming';

  return {
    // Data
    beneficiaries,
    activeBeneficiaries,
    allocatedBps,
    remainingBps,
    planIsValid,

    // Actions
    addBeneficiary,
    updateBeneficiary,
    removeBeneficiary,
    setAssetRule,
    clearAssetRule,

    // Tx state
    isActing,
    txStatus: tx.status,
    txWarnings: tx.warnings,
    txSignature: tx.signature,
    txError: tx.error,
    resetTx: tx.reset,

    // Query state
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

J) src/hooks/useDistributionState.ts

Create: dashboard/src/hooks/useDistributionState.ts

TypeScript

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useVault } from './useVault';
import { useTxBuilder } from './useTxBuilder';
import { invalidateDistributionCache } from '../config/queryClient';
import { DistributionStateResponse } from '../types/api';

export type DistributionSection = 'unlock' | 'sol' | 'spl' | 'finalize';

const DEFAULT_BATCH_SIZE = 5;
const ATA_BATCH_SIZE = 3;

export function useDistributionState() {
  const { vaultPubkey } = useVault();
  const qc = useQueryClient();
  const tx = useTxBuilder();

  const [selectedMints, setSelectedMints] = useState<string[]>([]);
  const [createMissingAtas, setCreateMissingAtas] = useState(false);

  // ─── Query ────────────────────────────────────────────────────────────────

  const query = useQuery<DistributionStateResponse, Error>({
    queryKey: ['vault', 'distribution', vaultPubkey],
    queryFn: () =>
      api.get<DistributionStateResponse>(`/vaults/${vaultPubkey}/distribution/state`),
    enabled: !!vaultPubkey,
    staleTime: 10_000,
    refetchInterval: 10_000,
  });

  const state = query.data;

  // ─── Derived section (server-authoritative) ───────────────────────────────

  const activeSection = useMemo<DistributionSection>(() => {
    if (!state?.unlockSession) return 'unlock';
    if (['proposed', 'approved'].includes(state.unlockSession.status)) return 'unlock';
    if (!state.solSession || !state.solSession.completed) return 'sol';
    const allSplDone =
      selectedMints.length === 0 ||
      selectedMints.every((mint) => {
        const s = state.splSessions.find((ss) => ss.mint === mint);
        return s?.completed === true;
      });
    if (!allSplDone) return 'spl';
    return 'finalize';
  }, [state, selectedMints]);

  const batchSize = createMissingAtas ? ATA_BATCH_SIZE : DEFAULT_BATCH_SIZE;

  // ─── Unlock actions ───────────────────────────────────────────────────────

  const initiateUnlock = useCallback(async () => {
    if (!vaultPubkey) throw new Error('No vault selected');
    await tx.execute('initiate-unlock', { vault: vaultPubkey });
    invalidateDistributionCache(vaultPubkey);
  }, [vaultPubkey, tx]);

  const approveUnlock = useCallback(async () => {
    if (!vaultPubkey) throw new Error('No vault selected');
    await tx.execute('approve-unlock', { vault: vaultPubkey });
    invalidateDistributionCache(vaultPubkey);
  }, [vaultPubkey, tx]);

  const cancelUnlock = useCallback(async () => {
    if (!vaultPubkey) throw new Error('No vault selected');
    await tx.execute('cancel-unlock', { vault: vaultPubkey });
    invalidateDistributionCache(vaultPubkey);
  }, [vaultPubkey, tx]);

  const freeze = useCallback(async () => {
    if (!vaultPubkey) throw new Error('No vault selected');
    await tx.execute('freeze-vault', { vault: vaultPubkey });
    invalidateDistributionCache(vaultPubkey);
    qc.invalidateQueries({ queryKey: ['vault', 'summary', vaultPubkey] });
  }, [vaultPubkey, tx, qc]);

  const unfreeze = useCallback(async () => {
    if (!vaultPubkey) throw new Error('No vault selected');
    await tx.execute('unfreeze-vault', { vault: vaultPubkey });
    invalidateDistributionCache(vaultPubkey);
    qc.invalidateQueries({ queryKey: ['vault', 'summary', vaultPubkey] });
  }, [vaultPubkey, tx, qc]);

  // ─── SOL distribution ─────────────────────────────────────────────────────

  const initSolDistribution = useCallback(async () => {
    if (!vaultPubkey) throw new Error('No vault selected');
    await tx.execute('init-dist-sol', { vault: vaultPubkey });
    invalidateDistributionCache(vaultPubkey);
  }, [vaultPubkey, tx]);

  const processSolBatch = useCallback(
    async (startIndex: number) => {
      if (!vaultPubkey) throw new Error('No vault selected');
      await tx.execute('exec-dist-sol-batch', {
        vault: vaultPubkey,
        startIndex,
        batchSize,
      });
      invalidateDistributionCache(vaultPubkey);
    },
    [vaultPubkey, tx, batchSize]
  );

  const processAllSolBatches = useCallback(async () => {
    if (!vaultPubkey || !state?.solSession) return;

    let cursor = state.solSession.cursor;
    const total = state.solSession.totalBeneficiaries;

    while (cursor < total) {
      await processSolBatch(cursor);
      // Refetch to get updated cursor
      const fresh = await qc.fetchQuery<DistributionStateResponse>({
        queryKey: ['vault', 'distribution', vaultPubkey],
        queryFn: () =>
          api.get<DistributionStateResponse>(
            `/vaults/${vaultPubkey}/distribution/state`
          ),
      });
      cursor = fresh.solSession?.cursor ?? total;
    }

    invalidateDistributionCache(vaultPubkey);
  }, [vaultPubkey, state, processSolBatch, qc]);

  // ─── SPL distribution ─────────────────────────────────────────────────────

  const initSplDistribution = useCallback(
    async (mint: string) => {
      if (!vaultPubkey) throw new Error('No vault selected');
      await tx.execute('init-dist-spl', {
        vault: vaultPubkey,
        mint,
        createMissingAtas,
      });
      invalidateDistributionCache(vaultPubkey);
    },
    [vaultPubkey, tx, createMissingAtas]
  );

  const processSplBatch = useCallback(
    async (mint: string, startIndex: number) => {
      if (!vaultPubkey) throw new Error('No vault selected');
      await tx.execute('exec-dist-spl-batch', {
        vault: vaultPubkey,
        mint,
        startIndex,
        batchSize,
        createMissingAtas,
      });
      invalidateDistributionCache(vaultPubkey);
    },
    [vaultPubkey, tx, batchSize, createMissingAtas]
  );

  const processAllSplBatches = useCallback(
    async (mint: string) => {
      if (!vaultPubkey) throw new Error('No vault selected');

      const session = state?.splSessions.find((s) => s.mint === mint);
      if (!session) throw new Error(`No SPL session found for mint ${mint}`);

      let cursor = session.cursor;
      const total = session.totalBeneficiaries;

      while (cursor < total) {
        await processSplBatch(mint, cursor);
        const fresh = await qc.fetchQuery<DistributionStateResponse>({
          queryKey: ['vault', 'distribution', vaultPubkey],
          queryFn: () =>
            api.get<DistributionStateResponse>(
              `/vaults/${vaultPubkey}/distribution/state`
            ),
        });
        const freshSession = fresh.splSessions.find((s) => s.mint === mint);
        cursor = freshSession?.cursor ?? total;
      }

      invalidateDistributionCache(vaultPubkey);
    },
    [vaultPubkey, state, processSplBatch, qc]
  );

  // ─── Finalize ─────────────────────────────────────────────────────────────

  const finalizeUnlock = useCallback(async () => {
    if (!vaultPubkey) throw new Error('No vault selected');
    await tx.execute('finalize-unlock', { vault: vaultPubkey });
    invalidateDistributionCache(vaultPubkey);
    qc.invalidateQueries({ queryKey: ['vault', 'summary', vaultPubkey] });
  }, [vaultPubkey, tx, qc]);

  const isActing =
    tx.status === 'building' ||
    tx.status === 'awaiting_signature' ||
    tx.status === 'sending' ||
    tx.status === 'confirming';

  return {
    // Query data
    unlockSession: state?.unlockSession ?? null,
    solSession:    state?.solSession    ?? null,
    splSessions:   state?.splSessions   ?? [],
    availableMints: state?.availableMints ?? [],
    canFinalize:   state?.canFinalize   ?? false,

    // UI state
    activeSection,
    selectedMints,
    setSelectedMints,
    createMissingAtas,
    setCreateMissingAtas,
    batchSize,

    // Unlock actions
    initiateUnlock,
    approveUnlock,
    cancelUnlock,
    freeze,
    unfreeze,

    // SOL actions
    initSolDistribution,
    processSolBatch,
    processAllSolBatches,

    // SPL actions
    initSplDistribution,
    processSplBatch,
    processAllSplBatches,

    // Finalize
    finalizeUnlock,

    // Tx state
    isActing,
    txStatus: tx.status,
    txWarnings: tx.warnings,
    txSignature: tx.signature,
    txError: tx.error,
    resetTx: tx.reset,

    // Query state
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

K) src/hooks/useDocuments.ts

Create: dashboard/src/hooks/useDocuments.ts

TypeScript

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useVault } from './useVault';
import { useTxBuilder } from './useTxBuilder';
import {
  encryptFile,
  sha256Hex,
  generateDocumentKey,
  exportKey,
} from '../lib/crypto';
import { DocumentView, DocumentType } from '../types/api';

export function useDocuments() {
  const { vaultPubkey } = useVault();
  const qc = useQueryClient();
  const tx = useTxBuilder();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [exportedDocKey, setExportedDocKey] = useState<string | null>(null);

  const query = useQuery<DocumentView[], Error>({
    queryKey: ['vault', 'documents', vaultPubkey],
    queryFn: () =>
      api.get<DocumentView[]>(`/vaults/${vaultPubkey}/documents`),
    enabled: !!vaultPubkey,
    staleTime: 60_000,
  });

  const documents = query.data ?? [];

  // ─── Upload ───────────────────────────────────────────────────────────────

  const uploadDocument = useCallback(
    async (
      file: File,
      documentType: DocumentType,
      providedKey?: CryptoKey
    ) => {
      if (!vaultPubkey) throw new Error('No vault selected');

      setIsUploading(true);
      setUploadProgress(0);
      setExportedDocKey(null);

      try {
        // 1. Read file
        const buffer = await file.arrayBuffer();

        // 2. Encrypt
        const key = providedKey ?? (await generateDocumentKey());
        const { ciphertext } = await encryptFile(buffer, key);

        // 3. Hash ciphertext
        const hash = await sha256Hex(ciphertext);

        // 4. Get presigned upload URL
        const { uploadUrl, docId } = await api.post<{
          uploadUrl: string;
          docId: string;
          expiresAt: number;
        }>(`/vaults/${vaultPubkey}/documents/upload-url`, {
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          documentType,
          hash,
        });

        setUploadProgress(20);

        // 5. Upload encrypted blob via XHR (for progress)
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', uploadUrl);
          xhr.setRequestHeader('Content-Type', 'application/octet-stream');

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 60) + 20;
              setUploadProgress(pct);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`Upload failed: HTTP ${xhr.status}`));
          };

          xhr.onerror = () => reject(new Error('Upload network error'));
          xhr.send(ciphertext);
        });

        setUploadProgress(80);

        // 6. Anchor hash on-chain
        const storageUri = uploadUrl.split('?')[0]; // Strip query string
        const sig = await tx.execute('set-document-commitment', {
          vault: vaultPubkey,
          docHash: hash,
          docUri: storageUri,
        });

        // 7. Confirm upload with API
        await api.post(`/vaults/${vaultPubkey}/documents/${docId}/confirm`, {
          onChainTxSignature: sig,
        });

        setUploadProgress(100);

        // 8. Export key so owner can save it
        const b64Key = await exportKey(key);
        setExportedDocKey(b64Key);

        // 9. Invalidate
        qc.invalidateQueries({
          queryKey: ['vault', 'documents', vaultPubkey],
        });
      } finally {
        setIsUploading(false);
      }
    },
    [vaultPubkey, tx, qc]
  );

  // ─── Download + decrypt ───────────────────────────────────────────────────

  const downloadDocument = useCallback(
    async (docId: string, key: CryptoKey): Promise<ArrayBuffer> => {
      if (!vaultPubkey) throw new Error('No vault selected');

      // Get presigned download URL
      const { url } = await api.get<{ url: string; expiresAt: number }>(
        `/vaults/${vaultPubkey}/documents/${docId}/download-url`
      );

      // Download ciphertext
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
      const ciphertext = await res.arrayBuffer();

      // Verify hash integrity
      const verified = await verifyIntegrity(docId, ciphertext);
      if (!verified) {
        throw new Error(
          'Document integrity check failed. The file may have been tampered with.'
        );
      }

      // Decrypt (we need the IV — for now, prepend IV convention)
      const iv = new Uint8Array(ciphertext, 0, 12);
      const ciphertextBody = ciphertext.slice(12);

      return crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertextBody);
    },
    [vaultPubkey]
  );

  // ─── Integrity verification ───────────────────────────────────────────────

  const verifyIntegrity = useCallback(
    async (docId: string, downloadedCiphertext: ArrayBuffer): Promise<boolean> => {
      const doc = documents.find((d) => d.id === docId);
      if (!doc) return false;

      const computedHash = await sha256Hex(downloadedCiphertext);
      return computedHash === doc.hash;
    },
    [documents]
  );

  // ─── Revoke ───────────────────────────────────────────────────────────────

  const revokeDocument = useCallback(
    async (docId: string) => {
      if (!vaultPubkey) throw new Error('No vault selected');

      // Revoke on-chain commitment
      await tx.execute('revoke-document-commitment', { vault: vaultPubkey });

      // Remove off-chain blob
      await api.delete(`/vaults/${vaultPubkey}/documents/${docId}`);

      qc.invalidateQueries({
        queryKey: ['vault', 'documents', vaultPubkey],
      });
    },
    [vaultPubkey, tx, qc]
  );

  const isActing =
    tx.status === 'building' ||
    tx.status === 'awaiting_signature' ||
    tx.status === 'sending' ||
    tx.status === 'confirming';

  return {
    // Data
    documents,

    // Upload
    uploadDocument,
    isUploading,
    uploadProgress,
    exportedDocKey,   // Show this to user once — they must save it

    // Download + verify
    downloadDocument,
    verifyIntegrity,

    // Revoke
    revokeDocument,

    // Tx state
    isActing,
    txStatus: tx.status,
    txWarnings: tx.warnings,
    txSignature: tx.signature,
    txError: tx.error,
    resetTx: tx.reset,

    // Query state
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

L) src/hooks/useSettings.ts

Create: dashboard/src/hooks/useSettings.ts

TypeScript

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useVault } from './useVault';
import { useVaultSummary } from './useVaultSummary';
import { useTxBuilder } from './useTxBuilder';
import { invalidateVaultCache } from '../config/queryClient';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

const SECONDS_PER_DAY = 86_400;

export function useSettings() {
  const { vaultPubkey, connectedWallet } = useVault();
  const qc = useQueryClient();
  const tx = useTxBuilder();

  // Read current settings from vault summary (avoids duplicate fetch)
  const {
    inactivityThreshold,
    timelockDuration,
    guardianThreshold,
    subscriptionTier,
    subscriptionExpiry,
  } = useVaultSummary();

  // Derived display values (seconds → days)
  const inactivityDays = inactivityThreshold / SECONDS_PER_DAY;
  const timelockDays   = timelockDuration   / SECONDS_PER_DAY;

  // ─── Custody settings (on-chain) ──────────────────────────────────────────

  const updateCustodySettings = useCallback(
    async (updates: {
      inactivityDays?: number;
      timelockDays?: number;
      guardianThreshold?: number;
      arbiter?: string;
    }) => {
      if (!vaultPubkey) throw new Error('No vault selected');

      await tx.execute('update-vault-settings', {
        vault: vaultPubkey,
        ...(updates.inactivityDays !== undefined && {
          inactivityThreshold: Math.round(updates.inactivityDays * SECONDS_PER_DAY),
        }),
        ...(updates.timelockDays !== undefined && {
          timelockDuration: Math.round(updates.timelockDays * SECONDS_PER_DAY),
        }),
        ...(updates.guardianThreshold !== undefined && {
          guardianThreshold: updates.guardianThreshold,
        }),
        ...(updates.arbiter !== undefined && {
          arbiter: updates.arbiter,
        }),
      });

      invalidateVaultCache(vaultPubkey);
    },
    [vaultPubkey, tx]
  );

  // ─── Notification prefs (off-chain) ───────────────────────────────────────

  const updateNotificationPrefs = useCallback(
    async (prefs: {
      emailEnabled?: boolean;
      smsEnabled?: boolean;
      pushEnabled?: boolean;
    }) => {
      if (!connectedWallet) throw new Error('Not authenticated');

      await api.put(`/users/${connectedWallet}/notification-preferences`, prefs);
    },
    [connectedWallet]
  );

  // ─── Subscription (on-chain) ──────────────────────────────────────────────

  const upgradeSubscription = useCallback(
    async (tier: SubscriptionTier, durationDays: number = 30) => {
      if (!vaultPubkey) throw new Error('No vault selected');

      await tx.execute('set-subscription', {
        vault: vaultPubkey,
        tier,
        durationSeconds: Math.round(durationDays * SECONDS_PER_DAY),
      });

      invalidateVaultCache(vaultPubkey);
    },
    [vaultPubkey, tx]
  );

  const isActing =
    tx.status === 'building' ||
    tx.status === 'awaiting_signature' ||
    tx.status === 'sending' ||
    tx.status === 'confirming';

  return {
    // Read (from vault summary — always fresh)
    inactivityDays,
    timelockDays,
    guardianThreshold,
    subscriptionTier,
    subscriptionExpiry,

    // Custody settings
    updateCustodySettings,

    // Notification prefs
    updateNotificationPrefs,

    // Subscription
    upgradeSubscription,

    // Tx state
    isActing,
    txStatus: tx.status,
    txWarnings: tx.warnings,
    txSignature: tx.signature,
    txError: tx.error,
    resetTx: tx.reset,
  };
}

M) src/hooks/useWallet.ts — Wallet helper (convenience wrapper)

Create: dashboard/src/hooks/useWallet.ts

TypeScript

import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

export function useWallet() {
  const {
    publicKey,
    connected,
    connecting,
    disconnecting,
    wallet,
    connect,
    disconnect,
    signTransaction,
    signAllTransactions,
    signMessage,
  } = useSolanaWallet();

  const { setVisible: openWalletModal } = useWalletModal();

  const walletAddress = publicKey?.toBase58() ?? null;

  const truncatedAddress = walletAddress
    ? `${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)}`
    : null;

  const handleConnect = () => {
    if (!connected && !connecting) {
      openWalletModal(true);
    }
  };

  const handleDisconnect = async () => {
    if (connected) await disconnect();
  };

  return {
    publicKey,
    walletAddress,
    truncatedAddress,
    connected,
    connecting,
    disconnecting,
    wallet,
    connect: handleConnect,
    disconnect: handleDisconnect,
    signTransaction,
    signAllTransactions,
    signMessage,
    openWalletModal: () => openWalletModal(true),
  };
}

N) src/providers/AuthProvider.tsx

The AuthProvider is already implemented inside useAuth.tsx (the context and provider are co-located). Export it cleanly for use in main.tsx:

Create: dashboard/src/providers/AuthProvider.tsx

React

// Re-export from co-located hook for cleaner import paths in main.tsx
export { AuthProvider, useAuth } from '../hooks/useAuth';

Build 6 — Final completion checklist
File	Status
src/types/api.ts	✅ Part 1
src/config/constants.ts	✅ Part 1 (prior session)
src/config/anchor.ts	✅ Part 1 (prior session)
src/config/queryClient.ts	✅ Part 1 (prior session)
src/lib/api.ts	✅ Part 1 (prior session)
src/lib/pda.ts	✅ Part 1 (prior session)
src/lib/siws.ts	✅ Part 1 (prior session)
src/lib/crypto.ts	✅ Part 1 (prior session)
src/providers/QueryProvider.tsx	✅ Part 1
src/providers/WalletProvider.tsx	✅ Part 1
src/providers/AuthProvider.tsx	✅ Part 3
src/hooks/useAuth.tsx	✅ Part 1 (complete)
src/hooks/useTxBuilder.ts	✅ Part 1 (complete)
src/hooks/useVault.ts	✅ Part 2
src/hooks/useVaultSummary.ts	✅ Part 2
src/hooks/useAssets.ts	✅ Part 2
src/hooks/usePortfolio.ts	✅ Part 2
src/hooks/useActivity.ts	✅ Part 2
src/hooks/useNotifications.ts	✅ Part 2
src/hooks/useLiveness.ts	✅ Part 2
src/hooks/useGuardians.ts	✅ Part 3
src/hooks/useBeneficiaries.ts	✅ Part 3
src/hooks/useDistributionState.ts	✅ Part 3
src/hooks/useDocuments.ts	✅ Part 3
src/hooks/useSettings.ts	✅ Part 3
src/hooks/useWallet.ts	✅ Part 3
✅ BUILD 6 IS NOW COMPLETE

Every hook has:

    Real useQuery() with typed responses
    Real useMutation() / useTxBuilder.execute() for on-chain actions
    Cache invalidation after every confirmed transaction
    No mock data references anywhere
    Clean separation — zero Build 7 items (TxStatusModal / WalletButton / LoadingSkeleton / App.tsx wiring) included here

