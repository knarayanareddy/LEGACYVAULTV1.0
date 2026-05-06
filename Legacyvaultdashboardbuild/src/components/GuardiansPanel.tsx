import { useState } from 'react';
import {
  Check, X, Clock, UserPlus, Star, ExternalLink,
  ChevronDown, AlertTriangle, Award
} from 'lucide-react';
import type { Guardian } from '../types';

interface GuardiansPanelProps {
  guardians: Guardian[];
  guardianThreshold: number;
  approvedGuardians: number;
  onToggleApproval: (id: string) => void;
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
};

export default function GuardiansPanel({ guardians, guardianThreshold, approvedGuardians, onToggleApproval }: GuardiansPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const thresholdMet = approvedGuardians >= guardianThreshold;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Guardians</h2>
          <p className="text-sm text-slate-400 mt-1">Manage your vault's guardian network</p>
        </div>
        <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-vault-600 to-purple-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-vault-500/30 transition-all flex items-center gap-2 active:scale-95">
          <UserPlus className="w-4 h-4" /> Add Guardian
        </button>
      </div>

      {/* Threshold Status */}
      <div className={`glass-card rounded-2xl p-5 ${thresholdMet ? 'border-emerald-500/20' : 'border-amber-500/20'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${thresholdMet ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {thresholdMet ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Unlock Threshold</p>
              <p className="text-xs text-slate-500">{approvedGuardians} of {guardianThreshold} required guardians approved</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: guardians.length }).map((_, i) => (
              <div
                key={i}
                className={`w-8 h-2 rounded-full transition-all ${
                  i < approvedGuardians ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Guardian Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {guardians.map((guardian, i) => {
          const isExpanded = expandedId === guardian.id;
          return (
            <div
              key={guardian.id}
              className={`glass-card rounded-2xl overflow-hidden transition-all animate-fade-in ${
                guardian.status === 'pending' ? 'opacity-70' : ''
              }`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center text-2xl flex-shrink-0">
                    {guardian.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white">{guardian.name}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${roleColors[guardian.role]}`}>
                        {guardian.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">{guardian.pubkey}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${statusColors[guardian.status]}`}>
                        <span className={`status-dot ${guardian.status} mr-1`} />
                        {guardian.status}
                      </span>
                      {guardian.reputation && (
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Star className="w-3 h-3 text-amber-400" />
                          <span>{guardian.reputation}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {guardian.approved ? (
                      <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                        <Check className="w-4 h-4" /> Approved
                      </div>
                    ) : guardian.status === 'pending' ? (
                      <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                        <Clock className="w-4 h-4" /> Pending
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-slate-500 text-xs">
                        <X className="w-4 h-4" /> Not Approved
                      </div>
                    )}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : guardian.id)}
                      className="p-1 rounded-lg hover:bg-white/5 text-slate-500 transition-colors"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Approval Toggle (for active guardians) */}
                {guardian.status === 'active' && (
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      {guardian.approved ? 'This guardian has approved unlock' : 'Guardian has not approved unlock'}
                    </p>
                    <button
                      onClick={() => onToggleApproval(guardian.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        guardian.approved
                          ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      }`}
                    >
                      {guardian.approved ? 'Revoke Approval' : 'Approve'}
                    </button>
                  </div>
                )}

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-white/5 space-y-3 animate-scale-in">
                    {guardian.role === 'professional' && guardian.bondAmount && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Award className="w-3.5 h-3.5 text-amber-400" />
                          Bond Amount
                        </div>
                        <span className="text-xs font-mono text-amber-400">{guardian.bondAmount} SOL</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Last Contact</span>
                      <span className="text-xs text-slate-300">{Math.floor((Date.now() - guardian.lastContact) / 86400000)}d ago</span>
                    </div>
                    {guardian.approvalTime && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Approved At</span>
                        <span className="text-xs text-slate-300">{new Date(guardian.approvalTime).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Pubkey</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono text-slate-300">{guardian.pubkey}</span>
                        <ExternalLink className="w-3 h-3 text-slate-600 cursor-pointer hover:text-vault-400" />
                      </div>
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
