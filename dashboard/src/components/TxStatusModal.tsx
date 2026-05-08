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
import { TxStatus } from '../hooks/useTxBuilder';

export interface TxStatusState {
  phase: TxStatus;
  signature?: string | null;
  error?: string | null;
  label?: string;
}

interface TxStatusModalProps {
  state: TxStatusState;
  onClose: () => void;
  cluster?: 'mainnet-beta' | 'devnet' | 'testnet';
}

const EXPLORER_BASE = 'https://solscan.io/tx';

function explorerUrl(sig: string, cluster: string) {
  const suffix = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`;
  return `${EXPLORER_BASE}/${sig}${suffix}`;
}

function shortSig(sig: string) {
  return `${sig.slice(0, 8)}…${sig.slice(-8)}`;
}

interface PhaseConfig {
  icon: FC<{ className?: string }>;
  iconClass: string;
  title: string;
  subtitle: string;
  showSpinner: boolean;
  showProgress: boolean;
}

function getPhaseConfig(phase: TxStatus, label?: string): PhaseConfig {
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

const PHASES_ORDER: TxStatus[] = ['building', 'signing', 'sending', 'confirming', 'success'];

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

const ProgressSteps: FC<{ phase: TxStatus }> = ({ phase }) => {
  const steps = [
    { phase: 'building' as TxStatus, label: 'Build' },
    { phase: 'signing' as TxStatus, label: 'Sign' },
    { phase: 'sending' as TxStatus, label: 'Send' },
    { phase: 'confirming' as TxStatus, label: 'Confirm' },
    { phase: 'success' as TxStatus, label: 'Done' },
  ];

  const currentIdx = PHASES_ORDER.indexOf(phase);

  return (
    <div className="flex items-start justify-between w-full px-2 relative">
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

export const TxStatusModal: FC<TxStatusModalProps> = ({
  state,
  onClose,
  cluster = 'mainnet-beta',
}) => {
  const { phase, signature, error, label } = state;
  const cfg = getPhaseConfig(phase, label);
  const Icon = cfg.icon;
  const isDone = phase === 'success' || phase === 'error';
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (isDone && e.target === overlayRef.current) onClose();
  };

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
      >
        {isDone && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}

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

        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-white mb-1">{cfg.title}</h3>
          <p className="text-sm text-white/50">{cfg.subtitle}</p>
        </div>

        {cfg.showProgress && (
          <div className="mb-6">
            <ProgressSteps phase={phase} />
          </div>
        )}

        {phase === 'error' && error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm break-words">
            {error}
          </div>
        )}

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
              <button
                onClick={() => navigator.clipboard.writeText(signature)}
                className="p-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <a
                href={explorerUrl(signature, cluster)}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        )}

        {isDone && (
          <button
            onClick={onClose}
            className={clsx(
              'w-full py-3 rounded-xl font-medium transition-all',
              phase === 'success'
                ? 'bg-green-500 hover:bg-green-400 text-green-950'
                : 'bg-white/10 hover:bg-white/20 text-white',
            )}
          >
            {phase === 'success' ? 'Great, thanks!' : 'Close'}
          </button>
        )}
      </div>
    </div>
  );
};
