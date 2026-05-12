import { useState, FC } from 'react';
import {
  Check, X, Clock, UserPlus, Star, ExternalLink,
  ChevronDown, AlertTriangle, Award, Shield
} from 'lucide-react';
import type { GuardianView, VaultUIStatus } from '../types/api';
import AddGuardianModal from './modals/AddGuardianModal';

interface GuardiansPanelProps {
  guardians: GuardianView[];
  vaultStatus: VaultUIStatus;
  onAdd: (params: { guardianWallet: string; role: 'personal' | 'professional' | 'delegate' }) => void;
  onRemove: (pubkey: string) => void;
  onSetThreshold: (threshold: number) => void;
  onAccept?: (pubkey: string) => void;
}

const roleColors: Record<string, string> = {
  personal: 'bg-vault-500/10 text-vault-400 border-vault-500/20',
  professional: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  delegate: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400',
  pending: 'bg-amber-500/10 text-amber-400',
  inactive: 'bg-slate-500/10 text-slate-400',
  removed: 'bg-rose-500/10 text-rose-400',
};

const GuardiansPanel: FC<GuardiansPanelProps> = ({ guardians, vaultStatus, onAdd, onRemove, onSetThreshold, onAccept }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newThreshold, setNewThreshold] = useState<number>(Math.ceil(guardians.length / 2) || 1);
  const approvedCount = guardians.filter(g => g.approved).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Guardians</h2>
          <p className="text-sm text-slate-400 mt-1">Manage your vault's guardian network</p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-vault-600 to-purple-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-vault-500/30 transition-all flex items-center gap-2 active:scale-95">
          <UserPlus className="w-4 h-4" /> Add Guardian
        </button>
      </div>

      <AddGuardianModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={onAdd}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5 border-white/5 bg-gradient-to-br from-vault-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-vault-500/20 text-vault-400`}>
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white uppercase tracking-tight">Guardian Consensus</p>
                <p className="text-xs text-slate-500">{approvedCount} of {guardians.length} guardians approved</p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white uppercase tracking-tight">Approval Threshold</p>
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    type="number" 
                    min="1" 
                    max={guardians.length || 1} 
                    value={newThreshold}
                    onChange={(e) => setNewThreshold(parseInt(e.target.value))}
                    className="w-12 bg-black/40 border border-white/10 rounded-lg py-1 px-2 text-white text-xs font-mono outline-none focus:border-vault-500"
                  />
                  <span className="text-xs text-slate-500">Guardians Required</span>
                  <button 
                    onClick={() => onSetThreshold(newThreshold)}
                    className="ml-2 p-1.5 rounded-lg bg-vault-500/10 text-vault-400 hover:bg-vault-500/20 transition-all active:scale-90"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {guardians.map((guardian, i) => {
          const isExpanded = expandedId === guardian.pubkey;
          return (
            <div
              key={guardian.pubkey}
              className={`glass-card rounded-2xl overflow-hidden transition-all animate-fade-in ${
                guardian.status === 'pending' ? 'opacity-70' : ''
              }`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
                    {guardian.avatar?.startsWith('http') ? (
                      <img src={guardian.avatar} alt={guardian.name || ''} className="w-full h-full object-cover" />
                    ) : (
                      guardian.avatar || '👤'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white truncate">{guardian.name || 'Anonymous'}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${roleColors[guardian.role]}`}>
                        {guardian.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">{guardian.pubkey}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${statusColors[guardian.status]}`}>
                        {guardian.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {guardian.approved ? (
                      <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                        <Check className="w-4 h-4" /> Approved
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-slate-500 text-xs">
                        <X className="w-4 h-4" /> Not Approved
                      </div>
                    )}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : guardian.pubkey)}
                      className="p-1 rounded-lg hover:bg-white/5 text-slate-500 transition-colors"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-white/5 space-y-3 animate-scale-in">
                    {guardian.status === 'pending' && onAccept && (
                      <div className="flex justify-end mb-3">
                        <button
                          onClick={() => onAccept(guardian.pubkey)}
                          className="px-3 py-1.5 rounded-lg bg-vault-500/20 text-vault-400 text-xs font-semibold hover:bg-vault-500/30 transition-colors"
                        >
                          Accept Invitation
                        </button>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Status</span>
                      <span className="text-xs text-slate-300 capitalize">{guardian.status}</span>
                    </div>
                    {guardian.approvalTime && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Approved At</span>
                        <span className="text-xs text-slate-300">{new Date(guardian.approvalTime * 1000).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <button 
                        onClick={() => onRemove(guardian.pubkey)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Remove Guardian
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


export default GuardiansPanel;
