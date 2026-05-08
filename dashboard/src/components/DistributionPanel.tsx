import { useState, FC, useMemo } from 'react';
import {
  Send, CheckCircle2, Clock, AlertTriangle, ExternalLink,
  Play, Layers, ArrowRight, Shield, Wallet, X
} from 'lucide-react';
import type { DistributionStateResponse } from '../types/api';

interface DistributionPanelProps {
  distribution: DistributionStateResponse;
  onInitiateUnlock: () => void;
  onCancelUnlock: () => void;
  onInitSolDist: () => void;
  onExecSolDist: () => void;
  onInitSplDist: (mint: string) => void;
  onExecSplDist: (mint: string) => void;
  onFinalize: () => void;
}

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  pending: { color: 'text-slate-400 bg-slate-500/10', icon: Clock, label: 'Pending' },
  processing: { color: 'text-amber-400 bg-amber-500/10', icon: Clock, label: 'Processing...' },
  completed: { color: 'text-emerald-400 bg-emerald-500/10', icon: CheckCircle2, label: 'Completed' },
  failed: { color: 'text-rose-400 bg-rose-500/10', icon: AlertTriangle, label: 'Failed' },
};

const DistributionPanel: FC<DistributionPanelProps> = ({
  distribution, 
  onInitiateUnlock,
  onCancelUnlock,
  onInitSolDist,
  onExecSolDist,
  onInitSplDist,
  onExecSplDist,
  onFinalize
}) => {
  const [activeSection, setActiveSection] = useState<'unlock' | 'sol' | 'spl' | 'finalize'>('unlock');

  const { unlockSession, solSession, splSessions, availableMints, canFinalize } = distribution;

  const isUnlocking = unlockSession !== null;
  const vaultState = unlockSession?.status || 'locked';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Distribution</h2>
          <p className="text-sm text-slate-400 mt-1">Manage unlock process and asset distribution</p>
        </div>
        <div className="flex items-center gap-2">
          {!isUnlocking ? (
            <button
              onClick={onInitiateUnlock}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all active:scale-95"
            >
              <Shield className="w-4 h-4 inline mr-1.5" />
              Initiate Unlock
            </button>
          ) : (
            <button
              onClick={onCancelUnlock}
              className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-400 text-sm font-semibold hover:bg-rose-500/20 transition-all active:scale-95 border border-rose-500/20"
            >
              <X className="w-4 h-4 inline mr-1.5" />
              Cancel Unlock
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {(['unlock', 'sol', 'spl', 'finalize'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`p-4 rounded-2xl border transition-all text-left ${
              activeSection === s 
                ? 'bg-vault-500/10 border-vault-500 text-vault-400 shadow-lg shadow-vault-500/10' 
                : 'bg-white/[0.02] border-white/5 text-slate-500 hover:bg-white/5'
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1">{s}</p>
            <p className="text-sm font-bold text-white capitalize">{s} Phase</p>
          </button>
        ))}
      </div>

      {activeSection === 'unlock' && (
        <div className="glass-card rounded-2xl p-6 animate-scale-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-vault-400" />
              Unlock Status
            </h3>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
              isUnlocking ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
            }`}>
              {vaultState}
            </span>
          </div>
          {isUnlocking ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Approvals</p>
                  <p className="text-xl font-bold text-white mt-1">{unlockSession.approvals} / {unlockSession.required}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Time Remaining</p>
                  <p className="text-xl font-bold text-white mt-1">48h 12m</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <Shield className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-20" />
              <p className="text-sm text-slate-500">No active unlock session. Initiate unlock to begin distribution.</p>
            </div>
          )}
        </div>
      )}

      {activeSection === 'sol' && (
        <div className="glass-card rounded-2xl p-6 animate-scale-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              SOL Distribution
            </h3>
            {solSession && (
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                solSession.completed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
              }`}>
                {solSession.completed ? 'Completed' : 'Active'}
              </span>
            )}
          </div>
          
          {solSession ? (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Total SOL to Distribute</p>
                  <p className="text-xl font-bold text-white mt-1">{solSession.totalAmount} SOL</p>
                </div>
                <button
                  onClick={onExecSolDist}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20"
                >
                  Execute Next Batch
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <button
                onClick={onInitSolDist}
                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition-all"
              >
                Initialize SOL Distribution
              </button>
            </div>
          )}
        </div>
      )}

      {activeSection === 'spl' && (
        <div className="glass-card rounded-2xl p-6 animate-scale-in">
          <h3 className="text-base font-semibold text-white mb-6 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            SPL Token Distribution
          </h3>
          <div className="space-y-3">
            {splSessions.map((session) => (
              <div key={session.mint} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-lg">🪙</div>
                  <div>
                    <p className="text-sm font-semibold text-white">{session.symbol}</p>
                    <p className="text-xs text-slate-500 font-mono">{session.mint.slice(0, 8)}…</p>
                  </div>
                </div>
                <button
                  onClick={() => onExecSplDist(session.mint)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-[10px] font-bold hover:bg-cyan-500 transition-all"
                >
                  Execute Batch
                </button>
              </div>
            ))}
            {availableMints.map(mint => (
              !splSessions.find(s => s.mint === mint) && (
                <div key={mint} className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-dashed border-white/10">
                  <p className="text-xs text-slate-500 font-mono truncate mr-4">{mint}</p>
                  <button
                    onClick={() => onInitSplDist(mint)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 text-[10px] font-bold hover:bg-white/10 transition-all"
                  >
                    Init Session
                  </button>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {activeSection === 'finalize' && (
        <div className="glass-card rounded-2xl p-6 animate-scale-in text-center py-12">
          <Send className="w-12 h-12 text-vault-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Finalize Distribution</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-8">
            Once all SOL and SPL batches are distributed, you can finalize the vault to permanently close the unlock session.
          </p>
          <button
            onClick={onFinalize}
            disabled={!canFinalize}
            className={`px-10 py-4 rounded-2xl font-bold transition-all ${
              canFinalize ? 'bg-gradient-to-r from-vault-600 to-purple-600 text-white hover:shadow-2xl hover:shadow-vault-600/40' : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            Finalize & Close Vault
          </button>
        </div>
      )}
    </div>
  );
};

export default DistributionPanel;
