import { useState } from 'react';
import {
  Send, CheckCircle2, Clock, AlertTriangle, ExternalLink,
  Play, Layers, ArrowRight, Shield, Wallet
} from 'lucide-react';
import type { DistributionBatch } from '../types';
import { mockAssets } from '../data/mockData';

interface DistributionPanelProps {
  distributionBatches: DistributionBatch[];
  vaultState: string;
  unlockReady: boolean;
  approvedGuardians: number;
  guardianThreshold: number;
  selectedMints: Record<string, boolean>;
  createMissingAtas: boolean;
  onToggleMint: (mint: string) => void;
  onToggleCreateAtas: (v: boolean) => void;
  onProcessBatch: (id: string) => void;
  onProcessAll: () => void;
  onInitiateUnlock: () => void;
  onCancelUnlock: () => void;
  onFreeze: () => void;
}

const statusConfig: Record<string, { color: string; icon: typeof Clock; label: string }> = {
  pending: { color: 'text-slate-400 bg-slate-500/10', icon: Clock, label: 'Pending' },
  processing: { color: 'text-amber-400 bg-amber-500/10', icon: Clock, label: 'Processing...' },
  completed: { color: 'text-emerald-400 bg-emerald-500/10', icon: CheckCircle2, label: 'Completed' },
  failed: { color: 'text-rose-400 bg-rose-500/10', icon: AlertTriangle, label: 'Failed' },
};

export default function DistributionPanel({
  distributionBatches, vaultState, unlockReady, approvedGuardians, guardianThreshold,
  selectedMints, createMissingAtas, onToggleMint, onToggleCreateAtas,
  onProcessBatch, onProcessAll, onInitiateUnlock, onCancelUnlock, onFreeze
}: DistributionPanelProps) {
  const [activeSection, setActiveSection] = useState<'unlock' | 'sol' | 'spl' | 'finalize'>('unlock');

  const splAssets = mockAssets.filter(a => a.type === 'SPL' && a.mintAddress);
  const selectedCount = Object.values(selectedMints).filter(Boolean).length;
  const completedCount = distributionBatches.filter(b => b.status === 'completed').length;
  const totalCount = distributionBatches.length;
  const allCompleted = completedCount === totalCount;

  const isUnlocking = vaultState === 'unlocking';
  const isLocked = vaultState === 'locked';
  const isFrozen = vaultState === 'frozen';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Distribution</h2>
          <p className="text-sm text-slate-400 mt-1">Manage unlock process and asset distribution</p>
        </div>
        <div className="flex items-center gap-2">
          {isLocked && (
            <button
              onClick={onInitiateUnlock}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all active:scale-95"
            >
              <Shield className="w-4 h-4 inline mr-1.5" />
              Initiate Unlock
            </button>
          )}
          {isUnlocking && (
            <button
              onClick={onCancelUnlock}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95"
            >
              Cancel Unlock
            </button>
          )}
          <button
            onClick={onFreeze}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
              isFrozen
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                : 'bg-gradient-to-r from-rose-600 to-red-600 text-white hover:shadow-lg hover:shadow-rose-500/30'
            }`}
          >
            {isFrozen ? 'Unfreeze' : '❄ Panic Freeze'}
          </button>
        </div>
      </div>

      {/* Unlock Status */}
      <div className={`glass-card rounded-2xl p-5 ${isUnlocking ? 'border-amber-500/20' : isFrozen ? 'border-rose-500/20' : 'border-emerald-500/20'}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isUnlocking ? 'bg-amber-500/20 text-amber-400' :
              isFrozen ? 'bg-rose-500/20 text-rose-400' :
              'bg-emerald-500/20 text-emerald-400'
            }`}>
              {isUnlocking ? <Clock className="w-5 h-5" /> : isFrozen ? <AlertTriangle className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-white capitalize">{vaultState}</p>
              <p className="text-xs text-slate-500">
                {isUnlocking ? 'Unlock in progress — timelock active' :
                 isFrozen ? 'Vault frozen — no operations allowed' :
                 'Vault locked — all assets secured'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <p className="text-slate-500">Guardian Approvals</p>
              <p className={`font-semibold font-mono ${unlockReady ? 'text-emerald-400' : 'text-amber-400'}`}>
                {approvedGuardians}/{guardianThreshold} required
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-500">Distribution</p>
              <p className="font-semibold font-mono text-slate-300">{completedCount}/{totalCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 w-fit">
        {(['unlock', 'sol', 'spl', 'finalize'] as const).map(section => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all capitalize ${
              activeSection === section
                ? 'bg-vault-600/30 text-vault-300'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {section === 'sol' ? 'SOL' : section === 'spl' ? 'SPL' : section}
          </button>
        ))}
      </div>

      {/* Unlock Section */}
      {activeSection === 'unlock' && (
        <div className="glass-card rounded-2xl p-6 animate-scale-in">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-vault-400" />
            Unlock Process
          </h3>
          <div className="space-y-4">
            {[
              { step: 1, title: 'Inactivity Threshold Met', desc: 'Owner has not checked in for the configured period', done: !isLocked },
              { step: 2, title: 'Guardian Approvals', desc: `${approvedGuardians} of ${guardianThreshold} guardians have approved`, done: unlockReady },
              { step: 3, title: 'Timelock Started', desc: '30-day mandatory timelock after approvals', done: isUnlocking },
              { step: 4, title: 'Distribution Ready', desc: 'Assets can be distributed to beneficiaries', done: allCompleted },
            ].map((step) => (
              <div key={step.step} className="flex items-start gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  step.done ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  'bg-slate-800 text-slate-500 border border-slate-700'
                }`}>
                  {step.done ? '✓' : step.step}
                </div>
                <div className="flex-1 pt-1">
                  <p className={`text-sm font-semibold ${step.done ? 'text-emerald-400' : 'text-slate-300'}`}>{step.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                </div>
                {step.step < 4 && <ArrowRight className="w-4 h-4 text-slate-600 mt-1.5" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SOL Distribution */}
      {activeSection === 'sol' && (
        <div className="glass-card rounded-2xl p-6 animate-scale-in">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-vault-400" />
            SOL Distribution
          </h3>
          <div className="space-y-2">
            {distributionBatches.filter(b => b.symbol === 'SOL').map((batch, i) => {
              const cfg = statusConfig[batch.status];
              const StatusIcon = cfg.icon;
              return (
                <div key={batch.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="w-10 h-10 rounded-lg bg-vault-500/10 flex items-center justify-center text-lg">◎</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{batch.beneficiary}</p>
                    <p className="text-xs text-slate-500 font-mono">{batch.amount.toFixed(3)} SOL</p>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${cfg.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </div>
                  {batch.txSignature && (
                    <ExternalLink className="w-3.5 h-3.5 text-slate-600 hover:text-vault-400 cursor-pointer" />
                  )}
                  {batch.status === 'pending' && !isFrozen && (
                    <button
                      onClick={() => onProcessBatch(batch.id)}
                      className="p-1.5 rounded-lg bg-vault-500/10 text-vault-400 hover:bg-vault-500/20 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SPL Distribution */}
      {activeSection === 'spl' && (
        <div className="glass-card rounded-2xl p-6 animate-scale-in space-y-5">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-vault-400" />
            SPL Token Distribution
          </h3>

          {/* Mint Selection */}
          <div>
            <p className="text-xs text-slate-400 mb-2">Select mints to distribute:</p>
            <div className="space-y-1.5">
              {splAssets.map((asset) => (
                <label key={asset.mintAddress} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={!!selectedMints[asset.mintAddress!]}
                    onChange={() => onToggleMint(asset.mintAddress!)}
                    className="w-4 h-4 rounded accent-vault-500"
                  />
                  <span className="text-lg">{asset.icon}</span>
                  <span className="text-sm font-semibold text-white">{asset.symbol}</span>
                  <span className="text-xs text-slate-500 font-mono truncate max-w-[200px]">{asset.mintAddress}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Create Missing ATAs */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div
              className={`toggle-switch ${createMissingAtas ? 'active' : ''}`}
              onClick={() => onToggleCreateAtas(!createMissingAtas)}
            />
            <div>
              <p className="text-xs font-semibold text-slate-300">Create missing beneficiary ATAs</p>
              <p className="text-[10px] text-slate-500">Create missing ATAs in the same tx (may hit tx size limits)</p>
            </div>
          </div>

          {/* SPL Batches */}
          {selectedCount > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-2">Distribution batches for selected mints:</p>
              <div className="space-y-2">
                {distributionBatches.filter(b => b.symbol !== 'SOL').map((batch, i) => {
                  const cfg = statusConfig[batch.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <div key={batch.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                      <span className="text-lg">{mockAssets.find(a => a.symbol === batch.symbol)?.icon || '🪙'}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{batch.beneficiary}</p>
                        <p className="text-xs text-slate-500 font-mono">{batch.amount.toLocaleString()} {batch.symbol}</p>
                      </div>
                      <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </div>
                      {batch.txSignature && (
                        <ExternalLink className="w-3.5 h-3.5 text-slate-600 hover:text-vault-400 cursor-pointer" />
                      )}
                      {batch.status === 'pending' && !isFrozen && (
                        <button
                          onClick={() => onProcessBatch(batch.id)}
                          className="p-1.5 rounded-lg bg-vault-500/10 text-vault-400 hover:bg-vault-500/20 transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Finalize */}
      {activeSection === 'finalize' && (
        <div className="glass-card rounded-2xl p-6 animate-scale-in">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Send className="w-4 h-4 text-vault-400" />
            Finalize Distribution
          </h3>

          {/* Progress */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Distribution Progress</span>
              <span className="text-xs font-mono font-semibold text-slate-300">{completedCount}/{totalCount}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-vault-500 to-purple-500 transition-all duration-500"
                style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>

          {allCompleted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-lg font-bold text-emerald-400">Distribution Complete!</p>
              <p className="text-sm text-slate-400 mt-1">All assets have been distributed to beneficiaries</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                Distribution requires: unlock approved + timelock elapsed. Run SOL + SPL batches then finalize.
              </p>
              <button
                onClick={onProcessAll}
                disabled={isFrozen || isLocked}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] ${
                  isFrozen || isLocked
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-vault-600 to-purple-600 text-white hover:shadow-lg hover:shadow-vault-500/30'
                }`}
              >
                <Send className="w-4 h-4 inline mr-2" />
                Process All Distributions
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
