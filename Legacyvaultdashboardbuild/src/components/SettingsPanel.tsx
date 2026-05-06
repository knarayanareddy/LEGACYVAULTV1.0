import { useState } from 'react';
import {
  Shield, Bell, CreditCard, User,
  CheckCircle2, AlertTriangle, Crown
} from 'lucide-react';

interface SettingsPanelProps {
  inactivityDays: number;
  guardianThreshold: number;
  subscriptionTier: string;
  subscriptionExpiry: number | null;
}

export default function SettingsPanel({ inactivityDays, guardianThreshold, subscriptionTier, subscriptionExpiry }: SettingsPanelProps) {
  const [inactivityValue, setInactivityValue] = useState(inactivityDays);
  const [timelockValue, setTimelockValue] = useState(30);
  const [thresholdValue, setThresholdValue] = useState(guardianThreshold);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [multiChannel, setMultiChannel] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tiers = [
    { name: 'Free', price: '$0/mo', features: ['1 Vault', '3 Guardians', 'Basic notifications', '10 MB doc storage'], current: false },
    { name: 'Pro', price: '$9.99/mo', features: ['5 Vaults', '7 Guardians', 'Professional guardian access', 'Advanced notifications', '100 MB doc storage'], current: subscriptionTier === 'pro' },
    { name: 'Enterprise', price: '$29.99/mo', features: ['Unlimited Vaults', '15 Guardians', 'Professional guardian network', 'Priority support', '1 GB doc storage', 'Custom timelocks'], current: false },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Settings</h2>
        <p className="text-sm text-slate-400 mt-1">Configure your vault parameters and preferences</p>
      </div>

      {/* Vault Parameters */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-4 h-4 text-vault-400" />
          <h3 className="text-base font-semibold text-white">Vault Parameters</h3>
        </div>
        <div className="space-y-5">
          {/* Inactivity Threshold */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">Inactivity Threshold</label>
              <span className="text-sm font-mono font-semibold text-vault-400">{inactivityValue} days</span>
            </div>
            <input
              type="range"
              min={30}
              max={365}
              step={5}
              value={inactivityValue}
              onChange={(e) => setInactivityValue(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-slate-600 mt-1">
              <span>30d</span>
              <span>365d</span>
            </div>
          </div>

          {/* Timelock Duration */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">Timelock Duration</label>
              <span className="text-sm font-mono font-semibold text-vault-400">{timelockValue} days</span>
            </div>
            <input
              type="range"
              min={7}
              max={90}
              step={1}
              value={timelockValue}
              onChange={(e) => setTimelockValue(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-slate-600 mt-1">
              <span>7d</span>
              <span>90d</span>
            </div>
          </div>

          {/* Guardian Threshold */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">Guardian Threshold (M-of-N)</label>
              <span className="text-sm font-mono font-semibold text-vault-400">{thresholdValue} of 5</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={thresholdValue}
              onChange={(e) => setThresholdValue(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-slate-600 mt-1">
              <span>1</span>
              <span>5</span>
            </div>
          </div>

          {/* Multi-Channel Check-in */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div>
              <p className="text-sm font-medium text-slate-300">Multi-Channel Check-in</p>
              <p className="text-[10px] text-slate-500">Require wallet signature + email OTP for check-in</p>
            </div>
            <div
              className={`toggle-switch ${multiChannel ? 'active' : ''}`}
              onClick={() => setMultiChannel(!multiChannel)}
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Bell className="w-4 h-4 text-vault-400" />
          <h3 className="text-base font-semibold text-white">Notifications</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-300">Enable Notifications</p>
            <div
              className={`toggle-switch ${notificationsEnabled ? 'active' : ''}`}
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            />
          </div>
          {notificationsEnabled && (
            <div className="space-y-2 pl-4 animate-scale-in">
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                <p className="text-xs text-slate-400">Email Notifications</p>
                <div className={`toggle-switch ${emailNotifs ? 'active' : ''}`} onClick={() => setEmailNotifs(!emailNotifs)} />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                <p className="text-xs text-slate-400">SMS Notifications</p>
                <div className={`toggle-switch ${smsNotifs ? 'active' : ''}`} onClick={() => setSmsNotifs(!smsNotifs)} />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                <p className="text-xs text-slate-400">Push Notifications</p>
                <div className={`toggle-switch ${pushNotifs ? 'active' : ''}`} onClick={() => setPushNotifs(!pushNotifs)} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subscription */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <CreditCard className="w-4 h-4 text-vault-400" />
          <h3 className="text-base font-semibold text-white">Subscription</h3>
        </div>

        {/* Current Plan */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-vault-600/10 to-purple-600/10 border border-vault-500/20 mb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <p className="text-sm font-bold text-white capitalize">{subscriptionTier} Plan</p>
            </div>
            {subscriptionExpiry && (
              <p className="text-xs text-slate-400">Renews {new Date(subscriptionExpiry).toLocaleDateString()}</p>
            )}
          </div>
        </div>

        {/* Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`p-4 rounded-xl border transition-all ${
                tier.current
                  ? 'bg-vault-600/10 border-vault-500/30'
                  : 'bg-white/[0.02] border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-white">{tier.name}</p>
                {tier.current && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-vault-500/20 text-vault-400 font-semibold">Current</span>
                )}
              </div>
              <p className="text-lg font-bold text-vault-400 font-mono mb-3">{tier.price}</p>
              <ul className="space-y-1.5">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              {!tier.current && (
                <button className={`w-full mt-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  tier.name === 'Enterprise'
                    ? 'bg-gradient-to-r from-vault-600 to-purple-600 text-white hover:shadow-lg hover:shadow-vault-500/20'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}>
                  {tier.name === 'Free' ? 'Downgrade' : 'Upgrade'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Owner Profile */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-4 h-4 text-vault-400" />
          <h3 className="text-base font-semibold text-white">Owner Profile</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-xs text-slate-400">Owner Pubkey</span>
            <span className="text-xs font-mono text-slate-300">7xKX...qYw1</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-xs text-slate-400">Vault Created</span>
            <span className="text-xs text-slate-300">~6 months ago</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-xs text-slate-400">Delegate Liveness Key</span>
            <span className="text-xs text-slate-500">Not configured</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
            saved
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-gradient-to-r from-vault-600 to-purple-600 text-white hover:shadow-lg hover:shadow-vault-500/30'
          }`}
        >
          {saved ? (
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Saved!</span>
          ) : (
            'Save Settings'
          )}
        </button>
      </div>

      {/* Disclaimer */}
      <div className="glass-card rounded-2xl p-5 border-amber-500/10">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-400">Legal Disclaimer</p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              LegacyVault is an automation and custody tool for digital assets. It is <strong>not</strong> legal advice,
              does not guarantee compliance with any jurisdiction's estate/probate law, and does not claim to produce
              legally enforceable wills by itself. Users should consult licensed counsel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
