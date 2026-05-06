import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import VaultPanel from './components/VaultPanel';
import GuardiansPanel from './components/GuardiansPanel';
import BeneficiariesPanel from './components/BeneficiariesPanel';
import LivenessPanel from './components/LivenessPanel';
import DistributionPanel from './components/DistributionPanel';
import DocumentsPanel from './components/DocumentsPanel';
import SettingsPanel from './components/SettingsPanel';
import { useVaultState } from './hooks/useVaultState';
import { Search, Bell, Shield } from 'lucide-react';

export default function App() {
  const {
    vault, guardians, beneficiaries, documents, distributionBatches,
    notifications, activity, selectedMints, createMissingAtas, activeTab,
    setActiveTab, setCreateMissingAtas,
    toggleBeneficiaryActive, updateBeneficiaryShare,
    toggleGuardianApproval, initiateUnlock, cancelUnlock, freezeVault,
    performCheckIn, toggleMintSelection, processDistribution, processAllDistributions,
    daysSinceCheckIn, inactivityDays, checkInHealth, approvedGuardians,
    unlockReady, totalValue,
  } = useVaultState();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            totalValue={totalValue}
            approvedGuardians={approvedGuardians}
            guardianThreshold={vault.guardianThreshold}
            totalBeneficiaries={vault.totalBeneficiaries}
            daysSinceCheckIn={daysSinceCheckIn}
            inactivityDays={inactivityDays}
            checkInHealth={checkInHealth}
            vaultState={vault.state}
            activity={activity}
            notifications={notifications}
            onNavigate={setActiveTab}
            onCheckIn={performCheckIn}
          />
        );
      case 'vault':
        return (
          <VaultPanel
            vaultPubkey={vault.pubkey}
            vaultState={vault.state}
            totalValue={totalValue}
          />
        );
      case 'guardians':
        return (
          <GuardiansPanel
            guardians={guardians}
            guardianThreshold={vault.guardianThreshold}
            approvedGuardians={approvedGuardians}
            onToggleApproval={toggleGuardianApproval}
          />
        );
      case 'beneficiaries':
        return (
          <BeneficiariesPanel
            beneficiaries={beneficiaries}
            totalBps={vault.totalBps}
            onToggleActive={toggleBeneficiaryActive}
            onUpdateShare={updateBeneficiaryShare}
          />
        );
      case 'liveness':
        return (
          <LivenessPanel
            lastCheckIn={vault.lastCheckIn}
            inactivityThreshold={vault.inactivityThreshold}
            daysSinceCheckIn={daysSinceCheckIn}
            inactivityDays={inactivityDays}
            checkInHealth={checkInHealth}
            vaultState={vault.state}
            onCheckIn={performCheckIn}
          />
        );
      case 'distribution':
        return (
          <DistributionPanel
            distributionBatches={distributionBatches}
            vaultState={vault.state}
            unlockReady={unlockReady}
            approvedGuardians={approvedGuardians}
            guardianThreshold={vault.guardianThreshold}
            selectedMints={selectedMints}
            createMissingAtas={createMissingAtas}
            onToggleMint={toggleMintSelection}
            onToggleCreateAtas={setCreateMissingAtas}
            onProcessBatch={processDistribution}
            onProcessAll={processAllDistributions}
            onInitiateUnlock={initiateUnlock}
            onCancelUnlock={cancelUnlock}
            onFreeze={freezeVault}
          />
        );
      case 'documents':
        return <DocumentsPanel documents={documents} />;
      case 'settings':
        return (
          <SettingsPanel
            inactivityDays={inactivityDays}
            guardianThreshold={vault.guardianThreshold}
            subscriptionTier={vault.subscriptionTier}
            subscriptionExpiry={vault.subscriptionExpiry}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#0a0e1a] overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-vault-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] bg-cyan-600/3 rounded-full blur-[100px]" />
      </div>

      {/* Sidebar */}
      <div className="relative z-10 flex-shrink-0 h-full">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          unreadCount={unreadCount}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 h-full">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-vault-900/30 bg-[#0a0e1a]/80 backdrop-blur-xl flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search anything..."
                className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-vault-500/50 focus:bg-white/[0.07] transition-all w-64"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Shield className="w-3.5 h-3.5 text-vault-500" />
              <span>LegacyVault</span>
              <span>/</span>
              <span className="text-slate-300 capitalize">{activeTab}</span>
            </div>

            {/* Notifications */}
            <button className="relative p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Profile */}
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-vault-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-vault-500/20">
                O
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-semibold text-white">Vault Owner</p>
                <p className="text-[10px] text-slate-500 font-mono">7xKX...qYw1</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
