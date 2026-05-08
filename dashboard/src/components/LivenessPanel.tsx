import { FC } from 'react';
import {
  Heart, Clock, CheckCircle2, AlertTriangle, Shield, Mail, Smartphone, Wallet,
  Zap, Bell, Calendar
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import type { LivenessSummaryResponse, LivenessRecord } from '../types/api';

interface LivenessPanelProps {
  liveness: LivenessSummaryResponse;
  onCheckIn: () => void;
}

const channelIcons: Record<string, any> = {
  wallet: Wallet,
  email: Mail,
  sms: Smartphone,
  push: Bell,
};

const channelColors: Record<string, string> = {
  wallet: 'text-vault-400 bg-vault-500/10',
  email: 'text-cyan-400 bg-cyan-500/10',
  sms: 'text-amber-400 bg-amber-500/10',
  push: 'text-purple-400 bg-purple-500/10',
};

const LivenessPanel: FC<LivenessPanelProps> = ({ liveness, onCheckIn }) => {
  const checkInPercent = Math.max(0, 100 - (liveness.daysSinceCheckIn / liveness.inactivityThresholdDays) * 100);
  const healthColor = liveness.checkInHealth === 'healthy' ? 'emerald' : liveness.checkInHealth === 'warning' ? 'amber' : 'rose';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Liveness Monitor</h2>
          <p className="text-sm text-slate-400 mt-1">Heartbeat tracking to prevent false unlock triggers</p>
        </div>
      </div>

      <div className={`glass-card rounded-2xl p-6 relative overflow-hidden`}>
        <div className="relative flex items-center gap-6 flex-wrap">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${
            liveness.checkInHealth === 'healthy' ? 'from-emerald-500 to-teal-500' :
            liveness.checkInHealth === 'warning' ? 'from-amber-500 to-orange-500' :
            'from-rose-500 to-red-500'
          } flex items-center justify-center shadow-lg`}>
            <Heart className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <p className={`text-lg font-bold capitalize text-${healthColor}-400`}>
              {liveness.checkInHealth === 'healthy' ? '✓ Healthy' : liveness.checkInHealth === 'warning' ? '⚠ Warning' : '✕ Critical'}
            </p>
            <p className="text-sm text-slate-400 mt-0.5">
              Last check-in: {liveness.daysSinceCheckIn} days ago · {liveness.daysRemaining} days remaining
            </p>
          </div>
          <button
            onClick={onCheckIn}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-vault-600 to-purple-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-vault-500/30 transition-all active:scale-95"
          >
            <Wallet className="w-4 h-4 inline mr-2" />
            Check In Now
          </button>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">Time until inactivity threshold</span>
            <span className={`text-xs font-mono font-semibold text-${healthColor}-400`}>{liveness.daysRemaining}d / {liveness.inactivityThresholdDays}d</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${
                liveness.checkInHealth === 'healthy' ? 'from-emerald-500 to-emerald-400' :
                liveness.checkInHealth === 'warning' ? 'from-amber-500 to-amber-400' :
                'from-rose-500 to-rose-400'
              }`}
              style={{ width: `${checkInPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-vault-500/10 text-vault-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-sm font-semibold text-white">Inactivity Threshold</p>
          </div>
          <p className="text-2xl font-bold text-white font-mono">{liveness.inactivityThresholdDays}d</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <p className="text-sm font-semibold text-white">Security Delegates</p>
          </div>
          <p className="text-2xl font-bold text-white font-mono">{liveness.delegates.length}</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <p className="text-sm font-semibold text-white">Multi-Channel</p>
          </div>
          <p className="text-2xl font-bold text-white font-mono">4</p>
        </div>
      </div>
    </div>
  );
};

export default LivenessPanel;
