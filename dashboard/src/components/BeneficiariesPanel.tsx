import { useState, FC } from 'react';
import {
  Edit2, Check, X, UserPlus, ChevronDown, ExternalLink, PieChart, Trash2, Shield
} from 'lucide-react';
import type { BeneficiaryView } from '../types/api';
import AddBeneficiaryModal from './modals/AddBeneficiaryModal';

interface BeneficiariesPanelProps {
  beneficiaries: BeneficiaryView[];
  onAdd: (params: { beneficiaryWallet: string; shareBps: number; active: boolean }) => void;
  onUpdate?: (params: { beneficiaryWallet: string; shareBps?: number; active?: boolean }) => void;
  onRemove?: (beneficiaryWallet: string) => void;
}

const BeneficiariesPanel: FC<BeneficiariesPanelProps> = ({ beneficiaries, onAdd, onUpdate, onRemove }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState(0);

  const allocatedBps = beneficiaries.filter(b => b.active).reduce((sum, b) => sum + b.shareBps, 0);
  const remainingBps = 10_000 - allocatedBps;

  const barColors = ['bg-gradient-to-r from-vault-500 to-indigo-500', 'bg-gradient-to-r from-purple-500 to-pink-500', 'bg-gradient-to-r from-cyan-500 to-teal-500'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Beneficiaries</h2>
          <p className="text-sm text-slate-400 mt-1">Configure asset distribution for your heirs</p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2 active:scale-95">
          <UserPlus className="w-4 h-4" /> Add Beneficiary
        </button>
      </div>

      <AddBeneficiaryModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={onAdd}
      />

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-vault-400" />
            <span className="text-sm font-semibold text-white">Share Allocation</span>
          </div>
          <div className="text-right">
            <span className={`text-sm font-mono font-semibold ${remainingBps === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {allocatedBps} / 10,000 bps
            </span>
          </div>
        </div>
        <div className="h-3 rounded-full bg-slate-800 overflow-hidden flex">
          {beneficiaries.filter(b => b.active).map((b, i) => (
            <div
              key={b.pubkey}
              className={`h-full ${barColors[i % barColors.length]} transition-all duration-500`}
              style={{ width: `${(b.shareBps / 10000) * 100}%` }}
              title={`${b.name}: ${(b.shareBps / 100).toFixed(1)}%`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {beneficiaries.map((beneficiary, i) => {
          const isExpanded = expandedId === beneficiary.pubkey;
          return (
            <div
              key={beneficiary.pubkey}
              className={`glass-card rounded-2xl overflow-hidden transition-all animate-fade-in ${!beneficiary.active ? 'opacity-50' : ''}`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
                    {beneficiary.avatar?.startsWith('http') ? (
                      <img src={beneficiary.avatar} alt={beneficiary.name || ''} className="w-full h-full object-cover" />
                    ) : (
                      beneficiary.avatar || '👤'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{beneficiary.name || 'Anonymous'}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">{beneficiary.pubkey}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-white font-mono">{(beneficiary.shareBps / 100).toFixed(0)}%</p>
                    <p className="text-[10px] text-slate-500 font-mono">{beneficiary.shareBps} bps</p>
                  </div>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : beneficiary.pubkey)}
                    className="p-1 rounded-lg hover:bg-white/5 text-slate-500 transition-colors flex-shrink-0"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>

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

                    {beneficiary.assetOverrides.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-400 mb-2">Asset Overrides</p>
                        <div className="space-y-1.5">
                          {beneficiary.assetOverrides.map((override) => (
                            <div key={override.mint} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-300">{override.mint.slice(0, 8)}…</span>
                                <span className="text-[10px] px-1 py-0.5 rounded bg-vault-500/10 text-vault-400">{override.mode}</span>
                              </div>
                              {override.fixedBps && (
                                <span className="text-xs font-mono text-slate-300">{override.fixedBps} bps</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-3 pt-4">
                      <button 
                        onClick={() => {
                          const bps = window.prompt("Enter new share allocation (e.g. 2500 for 25%):", beneficiary.shareBps.toString());
                          if (bps && onUpdate) onUpdate({ beneficiaryWallet: beneficiary.pubkey, shareBps: parseInt(bps) });
                        }}
                        className="text-xs text-vault-400 hover:text-vault-300 transition-colors"
                      >
                        Edit Allocation
                      </button>
                      <button 
                        onClick={() => {
                          if (onRemove && window.confirm("Are you sure you want to remove this beneficiary?")) {
                            onRemove(beneficiary.pubkey);
                          }
                        }}
                        className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                      >
                        Remove Beneficiary
                      </button>
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
};

export default BeneficiariesPanel;
