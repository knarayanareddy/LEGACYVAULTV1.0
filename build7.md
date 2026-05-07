BUILD 7 — TxStatusModal + WalletButton + LoadingSkeleton + App.tsx Final Wiring

Scope: This build completes the frontend. After Build 7 the dashboard is fully wired: no mock data, no fake signatures, real wallet connection, real transaction lifecycle UI, and real loading states across all panels.

Files produced in this build:

text

src/
  components/
    TxStatusModal.tsx        ← NEW
    WalletButton.tsx          ← NEW
    LoadingSkeleton.tsx       ← NEW
    Sidebar.tsx               ← UPDATED (WalletButton injection)
  App.tsx                     ← REPLACED (full real wiring)
  providers/
    AppProviders.tsx          ← NEW (wallet + query + auth tree)
  main.tsx                    ← UPDATED (wrap with AppProviders)

1. src/providers/AppProviders.tsx

This is the outermost provider tree. It composes the Solana wallet adapter, React Query client, and the SIWS auth context (introduced in Build 6) into a single clean wrapper so main.tsx stays minimal.

React

// src/providers/AppProviders.tsx
import { FC, ReactNode, useMemo } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  BackpackWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../hooks/useAuth';

import '@solana/wallet-adapter-react-ui/styles.css';

// ─── React Query client ───────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,          // 30 s — balances liveness vs RPC load
      gcTime: 5 * 60_000,         // 5 min cache
      retry: 2,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,                   // never auto-retry a tx mutation
    },
  },
});

// ─── RPC endpoint ─────────────────────────────────────────────────────────────
const ENDPOINT =
  import.meta.env.VITE_RPC_URL ?? clusterApiUrl('mainnet-beta');

interface Props { children: ReactNode }

const AppProviders: FC<Props> = ({ children }) => {
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new BackpackWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    [],
  );

  return (
    <ConnectionProvider endpoint={ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <QueryClientProvider client={queryClient}>
            {/* AuthProvider from Build 6 — SIWS session lives here */}
            <AuthProvider>
              {children}
            </AuthProvider>
          </QueryClientProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default AppProviders;

2. src/main.tsx (updated)

React

// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppProviders from './providers/AppProviders';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);

3. src/components/LoadingSkeleton.tsx

All panels need skeleton states while React Query fetches. This component provides a composable, reusable skeleton system that matches the .glass-card / .glass-panel visual language from index.css.

React

// src/components/LoadingSkeleton.tsx
import { FC } from 'react';
import { clsx } from 'clsx';

// ─── Base shimmer atom ────────────────────────────────────────────────────────
interface ShimmerProps {
  className?: string;
}

export const Shimmer: FC<ShimmerProps> = ({ className }) => (
  <div
    className={clsx(
      'animate-pulse rounded-md bg-white/5',
      className,
    )}
  />
);

// ─── Pre-composed skeletons per panel ─────────────────────────────────────────

/** Dashboard KPI row (4 cards) */
export const DashboardSkeleton: FC = () => (
  <div className="flex flex-col gap-6">
    {/* KPI cards */}
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-card p-5 flex flex-col gap-3">
          <Shimmer className="h-3 w-24" />
          <Shimmer className="h-8 w-32" />
          <Shimmer className="h-3 w-16" />
        </div>
      ))}
    </div>
    {/* Chart area */}
    <div className="glass-card p-6">
      <Shimmer className="h-4 w-36 mb-6" />
      <Shimmer className="h-48 w-full" />
    </div>
    {/* Activity feed */}
    <div className="glass-card p-5 flex flex-col gap-3">
      <Shimmer className="h-4 w-28 mb-2" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Shimmer className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <Shimmer className="h-3 w-3/4" />
            <Shimmer className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/** Generic list skeleton — used in Guardians, Beneficiaries, Documents */
interface ListSkeletonProps { rows?: number }

export const ListSkeleton: FC<ListSkeletonProps> = ({ rows = 4 }) => (
  <div className="glass-card p-5 flex flex-col gap-4">
    <div className="flex items-center justify-between mb-2">
      <Shimmer className="h-4 w-32" />
      <Shimmer className="h-8 w-24 rounded-lg" />
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/5"
      >
        <Shimmer className="h-10 w-10 rounded-full shrink-0" />
        <div className="flex flex-col gap-2 flex-1">
          <Shimmer className="h-3 w-40" />
          <Shimmer className="h-3 w-24" />
        </div>
        <Shimmer className="h-6 w-16 rounded-full" />
      </div>
    ))}
  </div>
);

/** Settings panel */
export const SettingsSkeleton: FC = () => (
  <div className="flex flex-col gap-6">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="glass-card p-6 flex flex-col gap-4">
        <Shimmer className="h-4 w-36 mb-1" />
        {Array.from({ length: 3 }).map((_, j) => (
          <div key={j} className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <Shimmer className="h-3 w-28" />
              <Shimmer className="h-3 w-44" />
            </div>
            <Shimmer className="h-8 w-32 rounded-lg" />
          </div>
        ))}
      </div>
    ))}
  </div>
);

/** Liveness panel */
export const LivenessSkeleton: FC = () => (
  <div className="flex flex-col gap-6">
    <div className="glass-card p-6 flex flex-col gap-4">
      <Shimmer className="h-4 w-36" />
      <div className="flex items-center gap-6">
        <Shimmer className="h-24 w-24 rounded-full shrink-0" />
        <div className="flex flex-col gap-3 flex-1">
          <Shimmer className="h-6 w-32" />
          <Shimmer className="h-3 w-full" />
          <Shimmer className="h-3 w-3/4" />
        </div>
      </div>
    </div>
    <ListSkeleton rows={3} />
  </div>
);

/** Distribution panel */
export const DistributionSkeleton: FC = () => (
  <div className="flex flex-col gap-6">
    {/* Step indicator */}
    <div className="glass-card p-5 flex items-center justify-between">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <Shimmer className="h-10 w-10 rounded-full" />
          <Shimmer className="h-3 w-16" />
        </div>
      ))}
    </div>
    {/* Batch list */}
    <div className="glass-card p-5 flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <Shimmer className="h-6 w-6 rounded-full shrink-0" />
          <Shimmer className="h-3 flex-1" />
          <Shimmer className="h-6 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  </div>
);

/** Vault panel */
export const VaultSkeleton: FC = () => (
  <div className="flex flex-col gap-6">
    <div className="glass-card p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Shimmer className="h-5 w-40" />
        <Shimmer className="h-6 w-20 rounded-full" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b border-white/5">
          <Shimmer className="h-3 w-28" />
          <Shimmer className="h-3 w-36" />
        </div>
      ))}
    </div>
    <ListSkeleton rows={3} />
  </div>
);

4. src/components/TxStatusModal.tsx

This is the most important UI component in Build 7. Every transaction in the system goes through useTxBuilder (Build 6), which exposes a TxState. This modal renders that state in four phases: signing → sending → confirming → success/error, matching the real Solana transaction lifecycle. It uses the glass panel system and the --color-vault-* tokens.

React

// src/components/TxStatusModal.tsx
import { FC, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import {
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  Copy,
  X,
  ShieldCheck,
  Send,
  Wifi,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TxPhase =
  | 'idle'
  | 'building'    // API is building the unsigned tx
  | 'signing'     // wallet is prompting
  | 'sending'     // tx submitted, waiting for RPC
  | 'confirming'  // waiting for finalization
  | 'success'
  | 'error';

export interface TxStatusState {
  phase: TxPhase;
  signature?: string;
  error?: string;
  label?: string;   // human-readable action label e.g. "Adding guardian"
}

interface TxStatusModalProps {
  state: TxStatusState;
  onClose: () => void;
  /** Solana cluster for explorer links — defaults to mainnet-beta */
  cluster?: 'mainnet-beta' | 'devnet' | 'testnet';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EXPLORER_BASE = 'https://solscan.io/tx';

function explorerUrl(sig: string, cluster: string) {
  const suffix = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`;
  return `${EXPLORER_BASE}/${sig}${suffix}`;
}

function shortSig(sig: string) {
  return `${sig.slice(0, 8)}…${sig.slice(-8)}`;
}

// ─── Phase config ─────────────────────────────────────────────────────────────

interface PhaseConfig {
  icon: FC<{ className?: string }>;
  iconClass: string;
  title: string;
  subtitle: string;
  showSpinner: boolean;
  showProgress: boolean;
}

function getPhaseConfig(phase: TxPhase, label?: string): PhaseConfig {
  const action = label ?? 'Transaction';
  switch (phase) {
    case 'building':
      return {
        icon: ShieldCheck,
        iconClass: 'text-vault-400',
        title: 'Building Transaction',
        subtitle: 'Constructing and serialising your transaction…',
        showSpinner: true,
        showProgress: true,
      };
    case 'signing':
      return {
        icon: ShieldCheck,
        iconClass: 'text-vault-400',
        title: 'Awaiting Signature',
        subtitle: 'Please approve the transaction in your wallet.',
        showSpinner: true,
        showProgress: true,
      };
    case 'sending':
      return {
        icon: Send,
        iconClass: 'text-blue-400',
        title: 'Broadcasting',
        subtitle: 'Sending your transaction to the Solana network…',
        showSpinner: true,
        showProgress: true,
      };
    case 'confirming':
      return {
        icon: Wifi,
        iconClass: 'text-yellow-400',
        title: 'Confirming',
        subtitle: 'Waiting for network confirmation. This may take a moment.',
        showSpinner: true,
        showProgress: true,
      };
    case 'success':
      return {
        icon: CheckCircle,
        iconClass: 'text-green-400',
        title: `${action} Successful`,
        subtitle: 'Your transaction has been confirmed on-chain.',
        showSpinner: false,
        showProgress: false,
      };
    case 'error':
      return {
        icon: XCircle,
        iconClass: 'text-red-400',
        title: 'Transaction Failed',
        subtitle: 'An error occurred. Please review and try again.',
        showSpinner: false,
        showProgress: false,
      };
    default:
      return {
        icon: ShieldCheck,
        iconClass: 'text-vault-400',
        title: 'Processing',
        subtitle: '',
        showSpinner: true,
        showProgress: true,
      };
  }
}

// ─── Progress steps bar ───────────────────────────────────────────────────────

const PHASES_ORDER: TxPhase[] = ['building', 'signing', 'sending', 'confirming', 'success'];

const StepDot: FC<{ done: boolean; active: boolean; label: string }> = ({ done, active, label }) => (
  <div className="flex flex-col items-center gap-1.5">
    <div
      className={clsx(
        'h-2.5 w-2.5 rounded-full transition-all duration-300',
        done && 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]',
        active && !done && 'bg-vault-400 shadow-[0_0_6px_rgba(139,92,246,0.6)] scale-125',
        !done && !active && 'bg-white/10',
      )}
    />
    <span className={clsx(
      'text-[10px] font-medium transition-colors',
      active && 'text-vault-300',
      done && 'text-green-400',
      !active && !done && 'text-white/30',
    )}>
      {label}
    </span>
  </div>
);

const ProgressSteps: FC<{ phase: TxPhase }> = ({ phase }) => {
  const steps = [
    { phase: 'building' as TxPhase, label: 'Build' },
    { phase: 'signing' as TxPhase, label: 'Sign' },
    { phase: 'sending' as TxPhase, label: 'Send' },
    { phase: 'confirming' as TxPhase, label: 'Confirm' },
    { phase: 'success' as TxPhase, label: 'Done' },
  ];

  const currentIdx = PHASES_ORDER.indexOf(phase);

  return (
    <div className="flex items-start justify-between w-full px-2 relative">
      {/* Connector line */}
      <div className="absolute top-[5px] left-[calc(10%)] right-[calc(10%)] h-[1px] bg-white/10" />
      {steps.map((s, i) => (
        <StepDot
          key={s.phase}
          label={s.label}
          done={currentIdx > i || phase === 'success'}
          active={currentIdx === i}
        />
      ))}
    </div>
  );
};

// ─── Copy button ──────────────────────────────────────────────────────────────
const CopyButton: FC<{ text: string }> = ({ text }) => {
  const handleCopy = () => navigator.clipboard.writeText(text);
  return (
    <button
      onClick={handleCopy}
      title="Copy signature"
      className="p-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
    >
      <Copy className="h-3.5 w-3.5" />
    </button>
  );
};

// ─── Main modal ───────────────────────────────────────────────────────────────

const TxStatusModal: FC<TxStatusModalProps> = ({
  state,
  onClose,
  cluster = 'mainnet-beta',
}) => {
  const { phase, signature, error, label } = state;
  const cfg = getPhaseConfig(phase, label);
  const Icon = cfg.icon;
  const isDone = phase === 'success' || phase === 'error';
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on backdrop click (only when done)
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (isDone && e.target === overlayRef.current) onClose();
  };

  // Close on Escape (only when done)
  useEffect(() => {
    if (!isDone) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isDone, onClose]);

  if (phase === 'idle') return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-black/60 backdrop-blur-sm',
        'animate-in fade-in duration-200',
      )}
    >
      <div
        className={clsx(
          'glass-panel relative w-full max-w-md rounded-2xl p-8',
          'border border-white/10',
          'animate-in zoom-in-95 duration-200',
        )}
        role="dialog"
        aria-modal="true"
        aria-label={cfg.title}
      >
        {/* Close — only when done */}
        {isDone && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className={clsx(
            'relative flex items-center justify-center',
            'h-16 w-16 rounded-full',
            phase === 'success' && 'bg-green-400/10',
            phase === 'error' && 'bg-red-400/10',
            !isDone && 'bg-vault-500/10',
          )}>
            {cfg.showSpinner && (
              <Loader2 className="absolute h-16 w-16 text-vault-500/30 animate-spin" />
            )}
            <Icon className={clsx('h-8 w-8', cfg.iconClass)} />
          </div>
        </div>

        {/* Title + subtitle */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-white mb-1">{cfg.title}</h3>
          <p className="text-sm text-white/50">{cfg.subtitle}</p>
        </div>

        {/* Progress steps */}
        {cfg.showProgress && (
          <div className="mb-6">
            <ProgressSteps phase={phase} />
          </div>
        )}

        {/* Error message */}
        {phase === 'error' && error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm break-words">
            {error}
          </div>
        )}

        {/* Signature row */}
        {signature && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/8 mb-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-white/30 mb-0.5 font-medium uppercase tracking-wide">
                Signature
              </span>
              <span className="text-xs font-mono text-white/60">
                {shortSig(signature)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <CopyButton text={signature} />
              <a
                href={explorerUrl(signature, cluster)}
                target="_blank"
                rel="noreferrer"
                title="View on Solscan"
                className="p-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {phase === 'success' && (
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-vault-600 hover:bg-vault-500 text-white text-sm font-medium transition-colors"
          >
            Done
          </button>
        )}

        {phase === 'error' && (
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm font-medium transition-colors border border-white/10"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Processing — non-dismissable note */}
        {!isDone && (
          <p className="text-center text-[11px] text-white/25 mt-4">
            Do not close this window while the transaction is in progress.
          </p>
        )}
      </div>
    </div>
  );
};

export default TxStatusModal;

5. src/components/WalletButton.tsx

The WalletButton is the "entry point" into the authenticated session. It composes the wallet adapter's connection state with the SIWS auth state from Build 6's useAuth. It lives in the Sidebar footer and drives the full connect → sign-in → authenticated session flow.

React

// src/components/WalletButton.tsx
import { FC, useState, useRef, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import {
  Wallet,
  LogOut,
  Copy,
  ChevronDown,
  CheckCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../hooks/useAuth';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shortAddr(addr: string) {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

// ─── Connection phase badge ───────────────────────────────────────────────────

type ConnState = 'disconnected' | 'connected' | 'authenticating' | 'authenticated' | 'error';

function connStateBadge(s: ConnState) {
  switch (s) {
    case 'authenticated':
      return <CheckCircle className="h-3 w-3 text-green-400" />;
    case 'authenticating':
      return <Loader2 className="h-3 w-3 text-vault-400 animate-spin" />;
    case 'error':
      return <AlertCircle className="h-3 w-3 text-red-400" />;
    default:
      return null;
  }
}

// ─── Dropdown menu ────────────────────────────────────────────────────────────

interface DropdownProps {
  address: string;
  onCopy: () => void;
  onDisconnect: () => void;
  onClose: () => void;
}

const WalletDropdown: FC<DropdownProps> = ({ address, onCopy, onDisconnect, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={clsx(
        'absolute bottom-full left-0 right-0 mb-2',
        'glass-card rounded-xl border border-white/10 overflow-hidden',
        'animate-in slide-in-from-bottom-2 duration-150',
        'shadow-xl shadow-black/40',
        'z-50',
      )}
    >
      {/* Address display */}
      <div className="px-3 py-2.5 border-b border-white/8">
        <p className="text-[10px] text-white/30 mb-0.5 uppercase tracking-wide font-medium">
          Connected Wallet
        </p>
        <p className="text-xs font-mono text-white/70">{shortAddr(address)}</p>
      </div>

      {/* Actions */}
      <button
        onClick={onCopy}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
      >
        <Copy className="h-3.5 w-3.5" />
        Copy address
      </button>

      <button
        onClick={onDisconnect}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400/80 hover:text-red-300 hover:bg-red-500/10 transition-colors border-t border-white/5"
      >
        <LogOut className="h-3.5 w-3.5" />
        Disconnect
      </button>
    </div>
  );
};

// ─── Main WalletButton ────────────────────────────────────────────────────────

const WalletButton: FC = () => {
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const { isAuthenticated, isAuthenticating, signIn, signOut, authError } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Determine UI state
  const connState: ConnState = (() => {
    if (!connected) return 'disconnected';
    if (authError) return 'error';
    if (isAuthenticating) return 'authenticating';
    if (isAuthenticated) return 'authenticated';
    return 'connected';
  })();

  // Auto-trigger SIWS sign-in once wallet connects
  useEffect(() => {
    if (connected && !isAuthenticated && !isAuthenticating && !authError) {
      signIn();
    }
  }, [connected, isAuthenticated, isAuthenticating, authError, signIn]);

  const handleCopy = () => {
    if (!publicKey) return;
    navigator.clipboard.writeText(publicKey.toBase58());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    setDropdownOpen(false);
  };

  const handleDisconnect = async () => {
    setDropdownOpen(false);
    await signOut();
    await disconnect();
  };

  // ── Not connected ──
  if (!connected) {
    return (
      <button
        onClick={() => setVisible(true)}
        className={clsx(
          'w-full flex items-center justify-center gap-2',
          'py-2.5 px-4 rounded-xl',
          'bg-vault-600 hover:bg-vault-500',
          'text-white text-sm font-medium',
          'transition-all duration-200',
          'shadow-lg shadow-vault-900/30',
          'hover:shadow-vault-900/50 hover:scale-[1.02]',
        )}
      >
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </button>
    );
  }

  // ── Connected (authenticating) ──
  if (connState === 'authenticating') {
    return (
      <div
        className={clsx(
          'w-full flex items-center justify-center gap-2',
          'py-2.5 px-4 rounded-xl',
          'bg-vault-600/40 border border-vault-500/30',
          'text-white/60 text-sm',
          'cursor-not-allowed',
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin text-vault-400" />
        Signing in…
      </div>
    );
  }

  // ── Auth error: show retry ──
  if (connState === 'error') {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{authError ?? 'Sign-in failed'}</span>
        </div>
        <button
          onClick={signIn}
          className="w-full py-2 rounded-xl bg-vault-600/60 hover:bg-vault-600 text-white text-sm font-medium transition-colors"
        >
          Retry Sign-in
        </button>
      </div>
    );
  }

  // ── Connected + authenticated ──
  const addr = publicKey!.toBase58();

  return (
    <div className="relative">
      {dropdownOpen && (
        <WalletDropdown
          address={addr}
          onCopy={handleCopy}
          onDisconnect={handleDisconnect}
          onClose={() => setDropdownOpen(false)}
        />
      )}

      <button
        onClick={() => setDropdownOpen((v) => !v)}
        className={clsx(
          'w-full flex items-center gap-2.5',
          'py-2.5 px-3 rounded-xl',
          'bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20',
          'text-sm transition-all duration-150',
          'group',
        )}
      >
        {/* Avatar / status dot */}
        <div className="relative shrink-0">
          <div className="h-7 w-7 rounded-full bg-vault-600/40 flex items-center justify-center">
            <Wallet className="h-3.5 w-3.5 text-vault-300" />
          </div>
          <div className={clsx(
            'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--color-bg-primary,#0a0a0f)]',
            isAuthenticated ? 'bg-green-400' : 'bg-yellow-400',
          )} />
        </div>

        {/* Address + state badge */}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-white/80 truncate">
              {copied ? 'Copied!' : shortAddr(addr)}
            </span>
            {connStateBadge(connState)}
          </div>
          <p className="text-[10px] text-white/30">
            {isAuthenticated ? 'Authenticated' : 'Connected'}
          </p>
        </div>

        <ChevronDown className={clsx(
          'h-3.5 w-3.5 text-white/30 transition-transform duration-150 shrink-0',
          dropdownOpen && 'rotate-180',
        )} />
      </button>
    </div>
  );
};

export default WalletButton;

6. src/components/Sidebar.tsx (updated)

Add WalletButton to the sidebar footer, replacing the old static "Vault secured" badge. The sidebar itself stays structurally the same — just the footer slot changes.

React

// src/components/Sidebar.tsx  — UPDATED SECTION (footer only)
// Replace the old footer div inside Sidebar with:

import WalletButton from './WalletButton';

// ... (keep all existing imports, nav items, tab list, collapse logic)

// In the JSX, replace the old static footer section with:
<div className="border-t border-white/8 p-3 flex flex-col gap-3">
  {/* Vault status badge — keep as-is from original */}
  {!collapsed && (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
      <div className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.8)]" />
      <span className="text-[11px] text-green-400 font-medium">Vault Secured</span>
    </div>
  )}

  {/* Wallet button */}
  <WalletButton />

  {/* Collapsed state: just icon */}
  {collapsed && (
    <div className="flex justify-center">
      <div className="h-8 w-8 rounded-full bg-vault-600/20 flex items-center justify-center">
        <Wallet className="h-4 w-4 text-vault-400" />
      </div>
    </div>
  )}
</div>

7. src/App.tsx — Final Real Wiring (replaces the mock)

This is the centrepiece of Build 7. It replaces the mock useVaultState with real React Query hooks from Build 6, integrates TxStatusModal globally, handles the unauthenticated/no-vault states, and wires every panel to its real hook.

React

// src/App.tsx
import { FC, useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from './hooks/useAuth';

// ─── Hooks (Build 6) ──────────────────────────────────────────────────────────
import { useVaultSummary }        from './hooks/useVaultSummary';
import { useGuardians }           from './hooks/useGuardians';
import { useBeneficiaries }       from './hooks/useBeneficiaries';
import { useAssets }              from './hooks/useAssets';
import { useLiveness }            from './hooks/useLiveness';
import { useDistribution }        from './hooks/useDistribution';
import { useDocuments }           from './hooks/useDocuments';
import { useSettings }            from './hooks/useSettings';
import { useActivityLog }         from './hooks/useActivityLog';
import { usePortfolioHistory }    from './hooks/usePortfolioHistory';
import { useNotifications }       from './hooks/useNotifications';
import { useTxBuilder }           from './hooks/useTxBuilder';

// ─── Components ───────────────────────────────────────────────────────────────
import Sidebar                    from './components/Sidebar';
import TxStatusModal              from './components/TxStatusModal';
import type { TxStatusState }     from './components/TxStatusModal';

// Panel components (unchanged from Build 6 — now receive real data)
import DashboardPanel             from './components/DashboardPanel';
import VaultPanel                 from './components/VaultPanel';
import GuardiansPanel             from './components/GuardiansPanel';
import BeneficiariesPanel         from './components/BeneficiariesPanel';
import LivenessPanel              from './components/LivenessPanel';
import DistributionPanel          from './components/DistributionPanel';
import DocumentsPanel             from './components/DocumentsPanel';
import SettingsPanel              from './components/SettingsPanel';

// Skeletons (Build 7)
import {
  DashboardSkeleton,
  ListSkeleton,
  LivenessSkeleton,
  DistributionSkeleton,
  VaultSkeleton,
  SettingsSkeleton,
} from './components/LoadingSkeleton';

// ─── Tab definition ───────────────────────────────────────────────────────────

export type TabId =
  | 'dashboard'
  | 'vault'
  | 'guardians'
  | 'beneficiaries'
  | 'liveness'
  | 'distribution'
  | 'documents'
  | 'settings';

// ─── Not-connected screen ─────────────────────────────────────────────────────

const NotConnected: FC = () => (
  <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-6">
    <div className="h-20 w-20 rounded-full bg-vault-600/20 flex items-center justify-center">
      <svg
        className="h-10 w-10 text-vault-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        {/* Simple shield icon */}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 10c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.25-8.25-3.286z"
        />
      </svg>
    </div>
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">
        Welcome to{' '}
        <span className="shimmer-text">LegacyVault</span>
      </h2>
      <p className="text-white/40 max-w-sm text-sm leading-relaxed">
        Connect your wallet to access your vault, manage beneficiaries, and
        secure your digital legacy on-chain.
      </p>
    </div>
    <p className="text-white/25 text-xs">
      Use the Connect Wallet button in the sidebar to get started.
    </p>
  </div>
);

// ─── No-vault screen ──────────────────────────────────────────────────────────

const NoVault: FC<{ onCreate: () => void }> = ({ onCreate }) => (
  <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-6">
    <div className="h-20 w-20 rounded-full bg-vault-600/20 flex items-center justify-center">
      <svg
        className="h-10 w-10 text-vault-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 4.5v15m7.5-7.5h-15"
        />
      </svg>
    </div>
    <div>
      <h2 className="text-xl font-bold text-white mb-2">No Vault Found</h2>
      <p className="text-white/40 max-w-sm text-sm leading-relaxed">
        You don't have a LegacyVault yet. Create one to start protecting your
        digital assets and configuring beneficiaries.
      </p>
    </div>
    <button
      onClick={onCreate}
      className="px-6 py-3 rounded-xl bg-vault-600 hover:bg-vault-500 text-white text-sm font-medium transition-all hover:scale-[1.02] shadow-lg shadow-vault-900/30"
    >
      Create My Vault
    </button>
  </div>
);

// ─── Error banner ─────────────────────────────────────────────────────────────

const ErrorBanner: FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="mx-6 mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
    <div className="h-5 w-5 text-red-400 shrink-0 mt-0.5">⚠</div>
    <div className="flex-1">
      <p className="text-sm text-red-300">{message}</p>
    </div>
    <button
      onClick={onRetry}
      className="text-xs text-red-400 hover:text-red-300 underline shrink-0"
    >
      Retry
    </button>
  </div>
);

// ─── Panel renderer ───────────────────────────────────────────────────────────

interface PanelProps {
  tab: TabId;
  onTxStateChange: (s: TxStatusState) => void;
}

/**
 * Renders the active panel.
 * Each panel receives exactly the data slice it needs from the
 * real React Query hooks (Build 6) — no prop drilling of global state.
 */
const PanelRenderer: FC<PanelProps> = ({ tab, onTxStateChange }) => {
  // All hooks — React Query suspense disabled; we handle loading per-panel
  const summary      = useVaultSummary();
  const guardians    = useGuardians();
  const beneficiaries = useBeneficiaries();
  const assets       = useAssets();
  const liveness     = useLiveness();
  const distribution = useDistribution();
  const documents    = useDocuments();
  const settings     = useSettings();
  const activity     = useActivityLog();
  const portfolio    = usePortfolioHistory();
  const notifications = useNotifications();
  const tx           = useTxBuilder({ onStateChange: onTxStateChange });

  switch (tab) {
    // ── Dashboard ─────────────────────────────────────────────────────────────
    case 'dashboard':
      if (summary.isLoading || portfolio.isLoading) return <DashboardSkeleton />;
      if (summary.error) return (
        <ErrorBanner message="Failed to load vault summary." onRetry={summary.refetch} />
      );
      return (
        <DashboardPanel
          summary={summary.data!}
          portfolio={portfolio.data ?? []}
          assets={assets.data ?? []}
          activity={activity.data ?? []}
          notifications={notifications.data ?? []}
        />
      );

    // ── Vault ─────────────────────────────────────────────────────────────────
    case 'vault':
      if (summary.isLoading || assets.isLoading) return <VaultSkeleton />;
      return (
        <VaultPanel
          summary={summary.data!}
          assets={assets.data ?? []}
          onFreeze={() => tx.execute('freeze-vault', {})}
          onUnfreeze={() => tx.execute('unfreeze-vault', {})}
          onDeposit={(params) => tx.execute('deposit', params)}
          onWithdraw={(params) => tx.execute('withdraw', params)}
        />
      );

    // ── Guardians ─────────────────────────────────────────────────────────────
    case 'guardians':
      if (guardians.isLoading) return <ListSkeleton rows={4} />;
      if (guardians.error) return (
        <ErrorBanner message="Failed to load guardians." onRetry={guardians.refetch} />
      );
      return (
        <GuardiansPanel
          guardians={guardians.data ?? []}
          vaultStatus={summary.data?.status ?? 'locked'}
          onAdd={(params) => tx.execute('add-guardian', params)}
          onRemove={(pubkey) => tx.execute('remove-guardian', { pubkey })}
          onSetThreshold={(t) => tx.execute('set-guardian-threshold', { threshold: t })}
        />
      );

    // ── Beneficiaries ─────────────────────────────────────────────────────────
    case 'beneficiaries':
      if (beneficiaries.isLoading) return <ListSkeleton rows={4} />;
      if (beneficiaries.error) return (
        <ErrorBanner message="Failed to load beneficiaries." onRetry={beneficiaries.refetch} />
      );
      return (
        <BeneficiariesPanel
          beneficiaries={beneficiaries.data ?? []}
          onAdd={(params) => tx.execute('add-beneficiary', params)}
          onUpdate={(params) => tx.execute('update-beneficiary', params)}
          onRemove={(pubkey) => tx.execute('remove-beneficiary', { pubkey })}
          onSetAssetRule={(params) => tx.execute('set-asset-rule', params)}
        />
      );

    // ── Liveness ──────────────────────────────────────────────────────────────
    case 'liveness':
      if (liveness.isLoading) return <LivenessSkeleton />;
      if (liveness.error) return (
        <ErrorBanner message="Failed to load liveness data." onRetry={liveness.refetch} />
      );
      return (
        <LivenessPanel
          liveness={liveness.data!}
          guardians={guardians.data ?? []}
          onCheckIn={() => tx.execute('check-in', {})}
          onAddDelegate={(params) => tx.execute('add-delegate', params)}
          onRemoveDelegate={(pubkey) => tx.execute('remove-delegate', { pubkey })}
        />
      );

    // ── Distribution ──────────────────────────────────────────────────────────
    case 'distribution':
      if (distribution.isLoading) return <DistributionSkeleton />;
      if (distribution.error) return (
        <ErrorBanner message="Failed to load distribution state." onRetry={distribution.refetch} />
      );
      return (
        <DistributionPanel
          distribution={distribution.data!}
          summary={summary.data!}
          onInitiateUnlock={() => tx.execute('initiate-unlock', {})}
          onApproveUnlock={() => tx.execute('approve-unlock', {})}
          onCancelUnlock={() => tx.execute('cancel-unlock', {})}
          onInitSolDistribution={() => tx.execute('init-sol-distribution', {})}
          onExecuteSolBatch={(params) => tx.execute('execute-sol-batch', params)}
          onInitSplDistribution={(params) => tx.execute('init-spl-distribution', params)}
          onExecuteSplBatch={(params) => tx.execute('execute-spl-batch', params)}
          onFinalizeUnlock={() => tx.execute('finalize-unlock', {})}
          onOpenDispute={(params) => tx.execute('open-dispute', params)}
          onResolveDispute={(params) => tx.execute('resolve-dispute', params)}
        />
      );

    // ── Documents ─────────────────────────────────────────────────────────────
    case 'documents':
      if (documents.isLoading) return <ListSkeleton rows={3} />;
      if (documents.error) return (
        <ErrorBanner message="Failed to load documents." onRetry={documents.refetch} />
      );
      return (
        <DocumentsPanel
          documents={documents.data ?? []}
          onUpload={documents.upload}
          onRevoke={(docId) => tx.execute('revoke-document', { docId })}
        />
      );

    // ── Settings ──────────────────────────────────────────────────────────────
    case 'settings':
      if (settings.isLoading) return <SettingsSkeleton />;
      if (settings.error) return (
        <ErrorBanner message="Failed to load settings." onRetry={settings.refetch} />
      );
      return (
        <SettingsPanel
          settings={settings.data!}
          onUpdateSettings={(params) => tx.execute('update-vault-settings', params)}
          onSetSubscription={(params) => tx.execute('set-subscription', params)}
        />
      );

    default:
      return null;
  }
};

// ─── Root App ─────────────────────────────────────────────────────────────────

const App: FC = () => {
  const { connected } = useWallet();
  const { isAuthenticated } = useAuth();
  const summary = useVaultSummary({ enabled: connected && isAuthenticated });

  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ── Global TxStatusModal state ─────────────────────────────────────────────
  const [txState, setTxState] = useState<TxStatusState>({ phase: 'idle' });

  const handleTxStateChange = useCallback((s: TxStatusState) => {
    setTxState(s);
  }, []);

  const handleTxModalClose = useCallback(() => {
    setTxState({ phase: 'idle' });
  }, []);

  // ── Create vault handler ───────────────────────────────────────────────────
  // Uses the global tx builder directly (no panel context needed)
  const { execute: executeTx } = useTxBuilder({ onStateChange: handleTxStateChange });

  const handleCreateVault = useCallback(async () => {
    setActiveTab('settings'); // Navigate to settings so user can configure
    // Optionally auto-trigger create-vault:
    // await executeTx('create-vault', defaultVaultParams);
  }, []);

  // ── Unread notification count (for Sidebar badge) ─────────────────────────
  const { data: notifs } = useNotifications({ enabled: isAuthenticated });
  const unreadCount = notifs?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-bg-primary,#0a0a0f)] text-white">

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onCollapseToggle={() => setSidebarCollapsed((v) => !v)}
        vaultStatus={summary.data?.status ?? 'locked'}
        unreadCount={unreadCount}
      />

      {/* Main content area */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-white capitalize">
              {activeTab}
            </h1>
            {summary.data?.vaultAddress && (
              <p className="text-xs text-white/30 font-mono mt-0.5">
                {summary.data.vaultAddress.slice(0, 8)}…{summary.data.vaultAddress.slice(-8)}
              </p>
            )}
          </div>

          {/* Vault status pill */}
          {isAuthenticated && summary.data && (
            <StatusPill status={summary.data.status} />
          )}
        </header>

        {/* Panel area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Not connected */}
          {!connected && <NotConnected />}

          {/* Connected but not authenticated */}
          {connected && !isAuthenticated && (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-white/40 text-sm">
                <div className="h-8 w-8 rounded-full border-2 border-vault-500/50 border-t-vault-400 animate-spin" />
                Authenticating…
              </div>
            </div>
          )}

          {/* Authenticated but no vault */}
          {connected && isAuthenticated && summary.data === null && !summary.isLoading && (
            <NoVault onCreate={handleCreateVault} />
          )}

          {/* Vault exists — render active panel */}
          {connected && isAuthenticated && (summary.data || summary.isLoading) && (
            <PanelRenderer
              tab={activeTab}
              onTxStateChange={handleTxStateChange}
            />
          )}
        </div>
      </main>

      {/* Global TxStatusModal */}
      <TxStatusModal
        state={txState}
        onClose={handleTxModalClose}
        cluster={
          (import.meta.env.VITE_CLUSTER as 'mainnet-beta' | 'devnet' | 'testnet')
          ?? 'mainnet-beta'
        }
      />
    </div>
  );
};

// ─── Vault status pill (top bar) ─────────────────────────────────────────────

const STATUS_STYLES: Record<string, { dot: string; text: string; label: string }> = {
  locked:       { dot: 'bg-green-400',  text: 'text-green-400',  label: 'Locked'       },
  unlocking:    { dot: 'bg-yellow-400', text: 'text-yellow-400', label: 'Unlocking'    },
  unlocked:     { dot: 'bg-blue-400',   text: 'text-blue-400',   label: 'Executing'    },
  frozen:       { dot: 'bg-red-400',    text: 'text-red-400',    label: 'Frozen'       },
  distributed:  { dot: 'bg-white/30',   text: 'text-white/40',   label: 'Distributed'  },
};

const StatusPill: FC<{ status: string }> = ({ status }) => {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.locked;
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
      <div className={`h-1.5 w-1.5 rounded-full ${s.dot} shadow-[0_0_4px_currentColor]`} />
      <span className={`text-xs font-medium ${s.text}`}>{s.label}</span>
    </div>
  );
};

export default App;

8. Build 7 environment variables

Add these to .env (never commit real values):

env

# .env.example

# Solana RPC endpoint (Helius, Triton, etc.)
VITE_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

# API base URL (Build 4 server)
VITE_API_BASE_URL=https://api.legacyvault.io/v1

# Cluster for explorer links
VITE_CLUSTER=mainnet-beta

9. Build 7 summary — what changed and why
File	Change	Why
src/providers/AppProviders.tsx	NEW	Clean single-file provider tree — wallet + query + auth
src/main.tsx	Updated	Wrap root with AppProviders
src/components/LoadingSkeleton.tsx	NEW	Per-panel skeleton states; eliminates layout shift; matches glass UI
src/components/TxStatusModal.tsx	NEW	Global tx lifecycle modal (building → signing → sending → confirming → success/error); step progress, sig copy/explorer link
src/components/WalletButton.tsx	NEW	Connect → SIWS sign-in → authenticated session; dropdown; auto-triggers signIn() after wallet connect
src/components/Sidebar.tsx	Updated	Footer slot replaced with <WalletButton />
src/App.tsx	REPLACED	Removes all mock state; wires real hooks; renders skeletons/errors/no-vault states; injects TxStatusModal globally
