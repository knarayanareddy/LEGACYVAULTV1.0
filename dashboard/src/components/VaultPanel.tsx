import { useState, FC } from 'react';
import {
  Wallet, Copy, ExternalLink, ArrowDownRight, ArrowUpRight,
  Lock, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown,
  Plus, Search, Filter, ArrowUp, Shield, X
} from 'lucide-react';
import type { VaultSummaryResponse, VaultAssetView } from '../types/api';
import DepositModal from './modals/DepositModal';
import WithdrawModal from './modals/WithdrawModal';

interface VaultPanelProps {
  summary: VaultSummaryResponse;
  assets: VaultAssetView[];
  onFreeze: () => void;
  onUnfreeze: () => void;
  onDeposit: (lamports: number) => void;
  onWithdraw: (lamports: number) => void;
  onDepositSpl: (mint: string, amount: number) => void;
  onWithdrawSpl: (mint: string, amount: number) => void;
}

const VaultPanel: FC<VaultPanelProps> = ({ 
  summary, 
  assets, 
  onFreeze, 
  onUnfreeze, 
  onDeposit, 
  onWithdraw,
  onDepositSpl,
  onWithdrawSpl
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<VaultAssetView | null>(null);

  const filteredAssets = filter === 'all' ? assets : assets.filter(a => a.type === filter);

  const copyPubkey = () => {
    navigator.clipboard?.writeText(summary.pubkey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stateColors: Record<string, string> = {
    locked: 'from-emerald-500 to-teal-500',
    unlocking: 'from-amber-500 to-orange-500',
    unlocked: 'from-vault-500 to-indigo-500',
    frozen: 'from-rose-500 to-red-500',
    distributed: 'from-purple-500 to-pink-500',
  };

  const handleAction = (asset: VaultAssetView, type: 'deposit' | 'withdraw') => {
    setSelectedAsset(asset);
    if (type === 'deposit') setIsDepositOpen(true);
    else setIsWithdrawOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => { setIsDepositOpen(false); setSelectedAsset(null); }}
        onDeposit={(amount) => {
          if (selectedAsset?.symbol === 'SOL') onDeposit(amount);
          else if (selectedAsset) onDepositSpl(selectedAsset.mint!, amount);
        }}
        assetSymbol={selectedAsset?.symbol ?? 'SOL'}
      />

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => { setIsWithdrawOpen(false); setSelectedAsset(null); }}
        onWithdraw={(amount) => {
          if (selectedAsset?.symbol === 'SOL') onWithdraw(amount);
          else if (selectedAsset) onWithdrawSpl(selectedAsset.mint!, amount);
        }}
        assetSymbol={selectedAsset?.symbol ?? 'SOL'}
        balance={selectedAsset?.balance ?? 0}
      />

      <div className="glass-card rounded-2xl p-6 relative overflow-hidden shadow-2xl shadow-vault-900/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-vault-600/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="relative">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stateColors[summary.status] || 'from-vault-500 to-indigo-500'} flex items-center justify-center shadow-lg shadow-black/20 animate-pulse-slow`}>
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Vault Details</h2>
                <p className="text-sm text-slate-400 mt-0.5">Primary Estate Control Center</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border ${
                summary.status === 'locked' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                summary.status === 'frozen' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {summary.status}
              </div>
              {summary.status === 'locked' ? (
                <button onClick={onFreeze} className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all border border-rose-500/10 active:scale-95" title="Emergency Freeze">
                  <AlertTriangle className="w-4 h-4" />
                </button>
              ) : summary.status === 'frozen' ? (
                <button onClick={onUnfreeze} className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all border border-emerald-500/10 active:scale-95" title="Unfreeze">
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-black/40 border border-white/5 flex items-center gap-4 backdrop-blur-md">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Vault Public Key</p>
              <p className="text-xs text-slate-300 font-mono truncate">{summary.pubkey}</p>
            </div>
            <button onClick={copyPubkey} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 transition-colors">
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-vault-500/30 transition-all group">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-vault-400">Total Value</p>
              <p className="text-xl font-bold text-white mt-1">${summary.totalUsdValue.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/30 transition-all group">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-emerald-400">Assets</p>
              <p className="text-xl font-bold text-white mt-1">{assets.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-purple-500/30 transition-all group">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-purple-400">Heirs</p>
              <p className="text-xl font-bold text-white mt-1">{summary.totalBeneficiaries}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white tracking-tight">Vault Assets</h3>
        <div className="flex items-center gap-2">
          {['all', 'sol', 'spl'].map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                filter === t ? 'bg-vault-500 text-white shadow-lg shadow-vault-500/20' : 'bg-white/5 text-slate-500 hover:bg-white/10'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssets.map((asset, i) => (
          <div key={asset.symbol} className="glass-card rounded-2xl p-5 border-white/5 hover:border-white/10 transition-all group animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg shadow-inner">
                  {asset.symbol === 'SOL' ? '☀️' : '🪙'}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{asset.symbol}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{asset.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white">${asset.usdValue.toLocaleString()}</p>
                <p className="text-[10px] text-emerald-400 font-bold">+1.2%</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="flex flex-col">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Balance</p>
                <p className="text-sm font-mono text-slate-200">{asset.balance.toLocaleString()} {asset.symbol}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(asset, 'deposit')}
                  className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-90"
                >
                  <ArrowDownRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleAction(asset, 'withdraw')}
                  className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all active:scale-90"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        <button className="rounded-2xl border-2 border-dashed border-white/5 p-5 flex flex-col items-center justify-center gap-2 hover:bg-white/5 hover:border-vault-500/30 transition-all text-slate-500 group">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-vault-500/10 group-hover:text-vault-400 transition-all">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest">Add New Asset</span>
        </button>
      </div>
    </div>
  );
};

export default VaultPanel;
