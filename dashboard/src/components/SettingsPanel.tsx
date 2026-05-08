import { useState, FC } from 'react';
import {
  Shield, Bell, CreditCard, User,
  CheckCircle2, AlertTriangle, Crown
} from 'lucide-react';
import UpgradeModal from './modals/UpgradeModal';

interface SettingsData {
  inactivityDays: number;
  timelockDays: number;
  guardianThreshold: number;
  subscriptionTier: string;
  subscriptionExpiry: number | null;
}

interface SettingsPanelProps {
  settings: SettingsData;
  onUpdateSettings: (params: { inactivityDays?: number; timelockDays?: number; guardianThreshold?: number }) => void;
}

const SettingsPanel: FC<SettingsPanelProps> = ({ settings, onUpdateSettings }) => {
  const [inactivity, setInactivity] = useState(settings.inactivityDays);
  const [timelock, setTimelock] = useState(settings.timelockDays);
  const [threshold, setThreshold] = useState(settings.guardianThreshold);
  const [saved, setSaved] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  const handleSave = () => {
    onUpdateSettings({
      inactivityDays: inactivity,
      timelockDays: timelock,
      guardianThreshold: threshold
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tiers = [
    { name: 'free', price: '$0/mo', features: ['1 Vault', '3 Guardians', 'Basic notifications', '10 MB doc storage'] },
    { name: 'pro', price: '$9.99/mo', features: ['5 Vaults', '7 Guardians', 'Professional guardian access', 'Advanced notifications', '100 MB doc storage'] },
    { name: 'enterprise', price: '$29.99/mo', features: ['Unlimited Vaults', '15 Guardians', 'Professional guardian network', 'Priority support', '1 GB doc storage', 'Custom timelocks'] },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Settings</h2>
        <p className="text-sm text-slate-400 mt-1">Configure your vault parameters and preferences</p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-4 h-4 text-vault-400" />
          <h3 className="text-base font-semibold text-white">Vault Parameters</h3>
        </div>
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">Inactivity Threshold</label>
              <span className="text-sm font-mono font-semibold text-vault-400">{inactivity} days</span>
            </div>
            <input
              type="range"
              min={30}
              max={365}
              step={5}
              value={inactivity}
              onChange={(e) => setInactivity(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-vault-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">Timelock Duration</label>
              <span className="text-sm font-mono font-semibold text-vault-400">{timelock} days</span>
            </div>
            <input
              type="range"
              min={7}
              max={90}
              step={1}
              value={timelock}
              onChange={(e) => setTimelock(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-vault-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">Guardian Threshold</label>
              <span className="text-sm font-mono font-semibold text-vault-400">{threshold} required</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-vault-500"
            />
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <CreditCard className="w-4 h-4 text-vault-400" />
          <h3 className="text-base font-semibold text-white">Subscription</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {tiers.map((tier) => (
              <div
                key={tier.name}
                onClick={() => setIsUpgradeOpen(true)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                settings.subscriptionTier === tier.name
                  ? 'bg-vault-600/10 border-vault-500/30'
                  : 'bg-white/[0.02] border-white/5'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-white capitalize">{tier.name}</p>
                {settings.subscriptionTier === tier.name && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-vault-500/20 text-vault-400 font-semibold">Active</span>
                )}
              </div>
              <p className="text-lg font-bold text-vault-400 font-mono mb-3">{tier.price}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
            saved
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-gradient-to-r from-vault-600 to-purple-600 text-white hover:shadow-lg hover:shadow-vault-500/30'
          }`}
        >
          {saved ? 'Settings Updated!' : 'Save Settings'}
        </button>
      </div>

      <div className="glass-card rounded-2xl p-5 border-amber-500/10">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-400">Legal Disclaimer</p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              LegacyVault is an automation and custody tool for digital assets. It is not legal advice.
            </p>
          </div>
        </div>
      </div>

      <UpgradeModal 
        isOpen={isUpgradeOpen} 
        onClose={() => setIsUpgradeOpen(false)} 
        onUpgrade={(tier) => {
          alert(`Upgrading to ${tier} is mocked locally!`);
          setIsUpgradeOpen(false);
        }}
      />
    </div>
  );
};

export default SettingsPanel;
