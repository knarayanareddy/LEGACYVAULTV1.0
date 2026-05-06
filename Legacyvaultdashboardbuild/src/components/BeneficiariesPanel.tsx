import { useState } from 'react';
import {
  Edit2, Check, X, UserPlus, ChevronDown, ExternalLink, PieChart
} from 'lucide-react';
import type { Beneficiary } from '../types';

interface BeneficiariesPanelProps {
  beneficiaries: Beneficiary[];
  totalBps: number;
  onToggleActive: (id: string) => void;
  onUpdateShare: (id: string, bps: number) => void;
}

export default function BeneficiariesPanel({ beneficiaries, totalBps, onToggleActive, onUpdateShare }: BeneficiariesPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState(0);
  const allocatedBps = beneficiaries.filter(b => b.active).reduce((sum, b) => sum + b.shareBps, 0);
  const remainingBps = totalBps - allocatedBps;

  const startEdit = (b: Beneficiary) => {
    setEditingId(b.id);
    setEditValue(b.shareBps);
  };

  const saveEdit = () => {
    if (editingId) {
      onUpdateShare(editingId, editValue);
      setEditingId(null);
    }
  };

  const barColors = ['bg-gradient-to-r from-vault-500 to-indigo-500', 'bg-gradient-to-r from-purple-500 to-pink-500', 'bg-gradient-to-r from-cyan-500 to-teal-500'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Beneficiaries</h2>
          <p className="text-sm text-slate-400 mt-1">Configure asset distribution for your heirs</p>
        </div>
        <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2 active:scale-95">
          <UserPlus className="w-4 h-4" /> Add Beneficiary
        </button>
      </div>

      {/* BPS Allocation Bar */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-vault-400" />
            <span className="text-sm font-semibold text-white">Share Allocation</span>
          </div>
          <div className="text-right">
            <span className={`text-sm font-mono font-semibold ${remainingBps === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {allocatedBps} / {totalBps} bps
            </span>
            {remainingBps > 0 && (
              <p className="text-[10px] text-amber-500">{remainingBps} bps unallocated</p>
            )}
          </div>
        </div>
        <div className="h-3 rounded-full bg-slate-800 overflow-hidden flex">
          {beneficiaries.filter(b => b.active).map((b, i) => (
            <div
              key={b.id}
              className={`h-full ${barColors[i % barColors.length]} transition-all duration-500`}
              style={{ width: `${(b.shareBps / totalBps) * 100}%` }}
              title={`${b.name}: ${(b.shareBps / 100).toFixed(1)}%`}
            />
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3">
          {beneficiaries.filter(b => b.active).map((b, i) => (
            <div key={b.id} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${barColors[i % barColors.length].replace('bg-gradient-to-r ', '').split(' ')[0].replace('from-', 'bg-')}`} />
              <span className="text-[10px] text-slate-400">{b.name} ({(b.shareBps / 100).toFixed(0)}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Beneficiary Cards */}
      <div className="space-y-3">
        {beneficiaries.map((beneficiary, i) => {
          const isExpanded = expandedId === beneficiary.id;
          const isEditing = editingId === beneficiary.id;
          return (
            <div
              key={beneficiary.id}
              className={`glass-card rounded-2xl overflow-hidden transition-all animate-fade-in ${!beneficiary.active ? 'opacity-50' : ''}`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center text-2xl flex-shrink-0">
                    {beneficiary.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{beneficiary.name}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{beneficiary.email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(Number(e.target.value))}
                          className="w-20 px-2 py-1 rounded-lg bg-black/30 border border-vault-500/30 text-xs text-white font-mono text-center focus:outline-none"
                          min={0}
                          max={10000}
                        />
                        <button onClick={saveEdit} className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold text-white font-mono">{(beneficiary.shareBps / 100).toFixed(0)}%</p>
                        <button onClick={() => startEdit(beneficiary)} className="p-1 rounded-lg hover:bg-white/5 text-slate-500 hover:text-vault-400 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-500 font-mono">{beneficiary.shareBps} bps</p>
                  </div>
                  {/* Toggle */}
                  <div
                    className={`toggle-switch flex-shrink-0 ${beneficiary.active ? 'active' : ''}`}
                    onClick={() => onToggleActive(beneficiary.id)}
                  />
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : beneficiary.id)}
                    className="p-1 rounded-lg hover:bg-white/5 text-slate-500 transition-colors flex-shrink-0"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-white/5 space-y-3 animate-scale-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Public Key</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono text-slate-300">{beneficiary.pubkey}</span>
                        <ExternalLink className="w-3 h-3 text-slate-600 cursor-pointer hover:text-vault-400" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Status</span>
                      <span className={`text-xs font-semibold ${beneficiary.active ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {beneficiary.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Asset Overrides */}
                    {beneficiary.assetOverrides.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-400 mb-2">Asset Overrides</p>
                        <div className="space-y-1.5">
                          {beneficiary.assetOverrides.map((override) => (
                            <div key={override.mintAddress} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-300">{override.symbol}</span>
                                <span className="text-[10px] px-1 py-0.5 rounded bg-vault-500/10 text-vault-400">{override.type}</span>
                              </div>
                              {override.value && (
                                <span className="text-xs font-mono text-slate-300">{override.value} bps</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Estimated Distribution */}
                    <div className="p-3 rounded-xl bg-gradient-to-r from-vault-600/10 to-purple-600/10 border border-vault-500/10">
                      <p className="text-xs text-slate-400 mb-1">Estimated Distribution</p>
                      <p className="text-sm font-bold text-white font-mono">
                        ~${(103701 * beneficiary.shareBps / 10000).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
