import { FC, useState, useCallback, useEffect } from 'react';
import { useWallet } from './hooks/useWallet';
import { useAuth } from './hooks/useAuth';
import { useVault } from './hooks/useVault';
import { useVaultSummary } from './hooks/useVaultSummary';
import { useGuardians } from './hooks/useGuardians';
import { useBeneficiaries } from './hooks/useBeneficiaries';
import { useAssets } from './hooks/useAssets';
import { useLiveness } from './hooks/useLiveness';
import { useDistribution } from './hooks/useDistributionState';
import { useDocuments } from './hooks/useDocuments';
import { useSettings } from './hooks/useSettings';
import { useActivityLog } from './hooks/useActivity';
import { usePortfolioHistory } from './hooks/usePortfolio';
import { useNotifications } from './hooks/useNotifications';
import { useTxBuilder, UseTxBuilderReturn } from './hooks/useTxBuilder';
import { Buffer } from 'buffer';
import { PublicKey } from '@solana/web3.js';
import { config } from './config/constants';

if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

import Sidebar from './components/Sidebar';
import DashboardPanel from './components/DashboardPanel';
import VaultPanel from './components/VaultPanel';
import GuardiansPanel from './components/GuardiansPanel';
import BeneficiariesPanel from './components/BeneficiariesPanel';
import LivenessPanel from './components/LivenessPanel';
import DistributionPanel from './components/DistributionPanel';
import DocumentsPanel from './components/DocumentsPanel';
import SettingsPanel from './components/SettingsPanel';
import ApprovalsPanel from './components/ApprovalsPanel';

import { TxStatusModal, TxStatusState } from './components/TxStatusModal';
import {
  DashboardSkeleton,
  VaultSkeleton,
  ListSkeleton,
  LivenessSkeleton,
  DistributionSkeleton,
  SettingsSkeleton,
} from './components/LoadingSkeleton';

type TabId =
  | 'dashboard'
  | 'vault'
  | 'guardians'
  | 'beneficiaries'
  | 'liveness'
  | 'distribution'
  | 'approvals'
  | 'documents'
  | 'settings';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// ─── Sub-screens ─────────────────────────────────────────────────────────────

const NotConnected: FC = () => (
  <div className="flex-1 flex flex-col items-center justify-center gap-8 text-center px-6">
    <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-vault-600/20 to-purple-600/10 flex items-center justify-center animate-float">
      <svg className="h-12 w-12 text-vault-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
      </svg>
    </div>
    <div>
      <h2 className="text-3xl font-bold text-white mb-3">Connect Your Wallet</h2>
      <p className="text-white/40 max-w-sm mx-auto text-sm leading-relaxed">
        Securely access your legacy vault by connecting your Solana wallet.
      </p>
    </div>
    <div className="flex justify-center scale-110">
      <WalletMultiButton />
    </div>
  </div>
);

const NoVault: FC<{ onCreate: () => void }> = ({ onCreate }) => (
  <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-6">
    <div className="h-20 w-20 rounded-full bg-vault-600/20 flex items-center justify-center">
      <svg className="h-10 w-10 text-vault-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    </div>
    <div>
      <h2 className="text-xl font-bold text-white mb-2">No Vault Found</h2>
      <p className="text-white/40 max-w-sm text-sm leading-relaxed">
        You don't have a LegacyVault yet. Create one to start protecting your digital assets.
      </p>
    </div>
    <button onClick={onCreate} className="px-6 py-3 rounded-xl bg-vault-600 hover:bg-vault-500 text-white text-sm font-medium transition-all hover:scale-[1.02]">
      Create My Vault
    </button>
  </div>
);

// ─── Panel Renderer ──────────────────────────────────────────────────────────

interface PanelProps {
  tab: TabId;
  tx: UseTxBuilderReturn;
}

const PanelRenderer: FC<PanelProps> = ({ tab, tx }) => {
  const summary = useVaultSummary();
  const guardians = useGuardians();
  const beneficiaries = useBeneficiaries();
  const assets = useAssets();
  const liveness = useLiveness();
  const distribution = useDistribution();
  const documents = useDocuments();
  const settings = useSettings();
  const activity = useActivityLog();
  const portfolio = usePortfolioHistory();
  const notifications = useNotifications();
  const { vaultPubkey } = useVault();

  switch (tab) {
    case 'dashboard':
      if (summary.isLoading && !summary.data) return <DashboardSkeleton />;
      if (!summary.data) return <div className="p-8 text-rose-400">Failed to load dashboard data.</div>;
      return (
        <DashboardPanel
          summary={summary.data}
          portfolio={portfolio.data ?? []}
          assets={assets.data ?? []}
          activity={activity.data ?? []}
          notifications={notifications.data ?? []}
          onInitiateUnlock={() => tx.execute('initiate-unlock', { vault: summary.data!.pubkey })}
        />
      );

    case 'vault':
      if (summary.isLoading && !summary.data) return <VaultSkeleton />;
      if (!summary.data) return <div className="p-8 text-rose-400">Failed to load vault summary.</div>;
      return (
        <VaultPanel
          summary={summary.data}
          assets={assets.data ?? []}
          onFreeze={() => tx.execute('freeze-vault', { vault: summary.data!.pubkey })}
          onUnfreeze={() => tx.execute('unfreeze-vault', { vault: summary.data!.pubkey })}
          onDeposit={(lamports) => tx.execute('deposit-sol', { vault: summary.data!.pubkey, lamports })}
          onWithdraw={(lamports) => tx.execute('withdraw-sol', { vault: summary.data!.pubkey, lamports })}
          onDepositSpl={(mint, amount) => tx.execute('deposit-spl', { vault: summary.data!.pubkey, mint, amount })}
          onWithdrawSpl={(mint, amount) => tx.execute('withdraw-spl', { vault: summary.data!.pubkey, mint, amount })}
        />
      );

    case 'guardians':
      if (guardians.isLoading && !guardians.data.length) return <ListSkeleton rows={4} />;
      if (!guardians.data) return <div className="p-8 text-rose-400">Failed to load guardians.</div>;
      return (
        <GuardiansPanel
          guardians={guardians.data}
          vaultStatus={summary.data?.status ?? 'locked'}
          onAdd={(params: any) => tx.execute('add-guardian', { vault: summary.data?.pubkey || vaultPubkey, ...params })}
          onRemove={(pubkey: string) => tx.execute('remove-guardian', { vault: summary.data?.pubkey || vaultPubkey, guardianWallet: pubkey })}
          onSetThreshold={(threshold) => tx.execute('set-guardian-threshold', { vault: summary.data?.pubkey || vaultPubkey, threshold })}
        />
      );

    case 'beneficiaries':
      if (beneficiaries.isLoading && !beneficiaries.data.length) return <ListSkeleton rows={4} />;
      if (!beneficiaries.data) return <div className="p-8 text-rose-400">Failed to load beneficiaries.</div>;
      return (
        <BeneficiariesPanel
          beneficiaries={beneficiaries.data}
          onAdd={(params: any) => tx.execute('add-beneficiary', { vault: summary.data?.pubkey || vaultPubkey, ...params })}
          onUpdate={(params: any) => tx.execute('update-beneficiary', { vault: summary.data?.pubkey || vaultPubkey, ...params })}
          onRemove={(beneficiaryWallet: string) => tx.execute('remove-beneficiary', { vault: summary.data?.pubkey || vaultPubkey, beneficiaryWallet })}
        />
      );

    case 'liveness':
      if (liveness.isLoading && !liveness.data) return <LivenessSkeleton />;
      if (!liveness.data) return <div className="p-8 text-rose-400">Failed to load liveness.</div>;
      return (
        <LivenessPanel
          liveness={liveness.data}
          onCheckIn={() => tx.execute('check-in', { vault: summary.data!.pubkey })}
        />
      );

    case 'distribution':
      if (distribution.isLoading && !distribution.data) return <DistributionSkeleton />;
      if (!distribution.data) return <div className="p-8 text-rose-400">Failed to load distribution state.</div>;
      return (
        <DistributionPanel
          distribution={distribution.data}
          onInitiateUnlock={() => tx.execute('initiate-unlock', { vault: summary.data!.pubkey })}
          onCancelUnlock={() => tx.execute('cancel-unlock', { vault: summary.data!.pubkey })}
          onInitSolDist={() => tx.execute('init-dist-sol', { vault: summary.data!.pubkey })}
          onExecSolDist={() => tx.execute('exec-dist-sol-batch', { vault: summary.data!.pubkey, startIndex: 0, batchSize: 10 })}
          onInitSplDist={(mint) => tx.execute('init-dist-spl', { vault: summary.data!.pubkey, mint, createMissingAtas: true })}
          onExecSplDist={(mint) => tx.execute('exec-dist-spl-batch', { vault: summary.data!.pubkey, mint, startIndex: 0, batchSize: 10, createMissingAtas: true })}
          onFinalize={() => tx.execute('finalize-unlock', { vault: summary.data!.pubkey })}
        />
      );

    case 'documents':
      if (documents.isLoading) return <ListSkeleton rows={3} />;
      if (!documents.data) return <div className="p-8 text-rose-400">Failed to load documents.</div>;
      return (
        <DocumentsPanel
          documents={documents.data}
          onUpload={(file, type) => documents.upload(file, type)}
        />
      );

    case 'settings':
      if (settings.isLoading) return <SettingsSkeleton />;
      if (!settings.data) return <div className="p-8 text-rose-400">Failed to load settings.</div>;
      return (
        <SettingsPanel
          settings={settings.data}
          onUpdateSettings={(params: any) => tx.execute('update-vault-settings', { vault: summary.data!.pubkey, ...params })}
        />
      );

    case 'approvals':
      return (
        <ApprovalsPanel
          onApprove={(vId: string) => tx.execute('approve-unlock', { vault: vId })}
          onReject={(vId: string) => tx.execute('cancel-unlock', { vault: vId })}
        />
      );

    default:
      return null;
  }
};

// ─── Root App ─────────────────────────────────────────────────────────────────

const App: FC = () => {
  const { connected, publicKey: walletPublicKey, disconnect } = useWallet();
  const { isAuthenticated, signIn, isSigningIn, signOut } = useAuth();
  const { vaultPubkey, setVaultPubkey } = useVault();
  const summary = useVaultSummary({ enabled: connected && isAuthenticated });

  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [txState, setTxState] = useState<TxStatusState>({ phase: 'idle' });
  const tx = useTxBuilder();

  // Auto-sign-in when connected
  useEffect(() => {
    if (connected && !isAuthenticated && !isSigningIn) {
      signIn().catch(err => console.error("Auto SignIn Failed:", err));
    }
  }, [connected, isAuthenticated, isSigningIn, signIn]);

  // Logout listener
  useEffect(() => {
    const handleLogout = () => {
      signOut();
      disconnect().catch(err => console.error("Disconnect Failed:", err));
      setVaultPubkey(null);
      setActiveTab('dashboard');
    };
    window.addEventListener('legacyvault_logout', handleLogout);
    return () => window.removeEventListener('legacyvault_logout', handleLogout);
  }, [signOut, disconnect, setVaultPubkey]);

  // Sync tx status to global modal state
  useEffect(() => {
    if (tx.status !== 'idle') {
      setTxState({
        phase: tx.status,
        signature: tx.signature,
        error: tx.error,
        label: activeTab === 'dashboard' && !vaultPubkey ? 'Create Vault' : activeTab,
      });
    }
  }, [tx.status, tx.signature, tx.error, activeTab, vaultPubkey]);

  const handleTxModalClose = useCallback(() => {
    tx.reset();
    setTxState({ phase: 'idle' });
  }, [tx]);

  const handleCreateVault = useCallback(async () => {
    try {
      await tx.execute('create-vault', {
        vaultNonce: 0,
        inactivityThreshold: 2592000, // 30 days
        timelockDuration: 86400 * 7,  // 7 days
        guardianThreshold: 1,
      });

      if (walletPublicKey) {
        const vaultPda = PublicKey.findProgramAddressSync(
          [Buffer.from('vault'), walletPublicKey.toBuffer(), Buffer.from([0])],
          new PublicKey(config.programId)
        )[0];
        setVaultPubkey(vaultPda.toBase58());
      }
    } catch (e) {
      console.error("Create Vault Failed:", e);
    }
  }, [tx, walletPublicKey, setVaultPubkey]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0a0f] text-white">
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab: any) => setActiveTab(tab)}
        collapsed={sidebarCollapsed}
        onCollapseToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        vaultStatus={summary.status}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-white capitalize">{activeTab}</h1>
            {summary.vaultAddress && (
              <p className="text-xs text-white/30 font-mono mt-0.5">
                {summary.vaultAddress.slice(0, 8)}…{summary.vaultAddress.slice(-8)}
              </p>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          {!connected && <NotConnected />}
          {connected && !isAuthenticated && (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-white/40 text-sm">
                <div className="h-8 w-8 rounded-full border-2 border-vault-500/50 border-t-vault-400 animate-spin" />
                Authenticating…
              </div>
            </div>
          )}
          {connected && isAuthenticated && !vaultPubkey && (
            <NoVault onCreate={handleCreateVault} />
          )}
          {connected && isAuthenticated && vaultPubkey && (summary.data || summary.isLoading) && (
            <PanelRenderer tab={activeTab} tx={tx} />
          )}
        </div>
      </main>

      <TxStatusModal
        state={txState}
        onClose={handleTxModalClose}
      />
    </div>
  );
};

export default App;
