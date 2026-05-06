import { useState } from 'react';
import {
  Wallet, Copy, ExternalLink, ArrowDownRight, ArrowUpRight,
  Lock, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown,
  Plus, Search, Filter
} from 'lucide-react';
import type { VaultAsset } from '../types';
import { mockAssets } from '../data/mockData';

interface VaultPanelProps {
  vaultPubkey: string;
  vaultState: string;
  totalValue: number;
}

export default function VaultPanel({ vaultPubkey, vaultState, totalValue }: VaultPanelProps) {
  const [assets] = useState<VaultAsset[]>(mockAssets);
  const [filter, setFilter] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  const filteredAssets = filter === 'all' ? assets : assets.filter(a => a.type === filter);

  const copyPubkey = () => {
    navigator.clipboard?.writeText(vaultPubkey);
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Vault Header */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-vault-600/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="relative">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stateColors[vaultState] || 'from-vault-500 to-indigo-500'} flex items-center justify-center shadow-lg`}>
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Vault Details</h2>
                <p className="text-sm text-slate-400 mt-0.5">Your digital estate vault</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                vaultState === 'locked' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                vaultState === 'frozen' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {vaultState === 'locked' && <Lock className="w-3 h-3 inline mr-1" />}
                {vaultState === 'frozen' && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                {vaultState}
              </div>
            </div>
          </div>

          {/* Pubkey */}
          <div className="mt-5 p-3 rounded-xl bg-black/30 border border-white/5 flex items-center gap-3">
            <span className="text-xs text-slate-500 font-mono flex-shrink-0">Vault PDA:</span>
            <span className="text-xs text-slate-300 font-mono flex-1 truncate">{vaultPubkey}</span>
            <button onClick={copyPubkey} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors">
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <ExternalLink className="w-4 h-4 text-slate-600 cursor-pointer hover:text-vault-400 transition-colors" />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-5">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-xs text-slate-500">Total Value</p>
              <p className="text-lg font-bold text-white mt-0.5">${totalValue.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-xs text-slate-500">Assets</p>
              <p className="text-lg font-bold text-white mt-0.5">{assets.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-xs text-slate-500">Asset Types</p>
              <p className="text-lg font-bold text-white mt-0.5">{new Set(assets.map(a => a.type)).size}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {['all', 'SOL', 'SPL', 'NFT', 'POSITION'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f
                  ? 'bg-vault-600/30 text-vault-300 border border-vault-500/30'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              {f === 'all' ? 'All Assets' : f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search assets..."
              className="pl-9 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-vault-500/50 w-48"
            />
          </div>
          <button className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-500 hover:text-slate-300 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
          <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-vault-600 to-purple-600 text-white text-xs font-semibold hover:shadow-lg hover:shadow-vault-500/20 transition-all flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Deposit
          </button>
        </div>
      </div>

      {/* Asset List */}
      <div className="space-y-2">
        {filteredAssets.map((asset, i) => (
          <div
            key={asset.id}
            className="glass-card rounded-xl p-4 flex items-center gap-4 animate-fade-in hover:border-vault-500/30"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center text-2xl flex-shrink-0">
              {asset.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white">{asset.name}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                  asset.type === 'SOL' ? 'bg-vault-500/10 text-vault-400' :
                  asset.type === 'SPL' ? 'bg-cyan-500/10 text-cyan-400' :
                  asset.type === 'NFT' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-purple-500/10 text-purple-400'
                }`}>{asset.type}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">{asset.symbol}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-semibold text-white font-mono">
                {asset.balance.toLocaleString(undefined, { maximumFractionDigits: 3 })}
              </p>
              <p className="text-xs text-slate-500 font-mono">${asset.usdValue.toLocaleString()}</p>
            </div>
            <div className="flex-shrink-0 w-16 text-right">
              {asset.change24h !== undefined && (
                <div className={`flex items-center justify-end gap-1 text-xs font-semibold ${asset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {asset.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-emerald-400 transition-colors" title="Deposit">
                <ArrowDownRight className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-rose-400 transition-colors" title="Withdraw">
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
