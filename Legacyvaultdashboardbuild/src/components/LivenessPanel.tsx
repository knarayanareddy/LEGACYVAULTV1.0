import {
  Heart, Clock, CheckCircle2, AlertTriangle, Shield, Mail, Smartphone, Wallet,
  Zap, Bell, Calendar
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { mockLiveness } from '../data/mockData';

interface LivenessPanelProps {
  lastCheckIn: number;
  inactivityThreshold: number;
  daysSinceCheckIn: number;
  inactivityDays: number;
  checkInHealth: string;
  vaultState: string;
  onCheckIn: () => void;
}

const channelIcons: Record<string, typeof Wallet> = {
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

export default function LivenessPanel({
  daysSinceCheckIn, inactivityDays,
  checkInHealth, vaultState, onCheckIn
}: LivenessPanelProps) {
  void { lastCheckIn: 0, inactivityThreshold: 0 };
  const checkInPercent = Math.max(0, 100 - (daysSinceCheckIn / inactivityDays) * 100);
  const daysRemaining = Math.max(0, inactivityDays - daysSinceCheckIn);
  const healthColor = checkInHealth === 'healthy' ? 'emerald' : checkInHealth === 'warning' ? 'amber' : 'rose';

  const chartData = mockLiveness.map(r => ({
    date: r.date.slice(5),
    value: r.checkIn ? 1 : 0,
    channel: r.channel,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Liveness Monitor</h2>
          <p className="text-sm text-slate-400 mt-1">Heartbeat tracking to prevent false unlock triggers</p>
        </div>
      </div>

      {/* Health Status Card */}
      <div className={`glass-card rounded-2xl p-6 border-${healthColor}-500/20 relative overflow-hidden`}>
        <div className={`absolute top-0 right-0 w-48 h-48 bg-${healthColor}-500/5 rounded-full -translate-y-1/2 translate-x-1/4`} />
        <div className="relative flex items-center gap-6 flex-wrap">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${
            checkInHealth === 'healthy' ? 'from-emerald-500 to-teal-500' :
            checkInHealth === 'warning' ? 'from-amber-500 to-orange-500' :
            'from-rose-500 to-red-500'
          } flex items-center justify-center shadow-lg animate-pulse-glow`}>
            <Heart className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <p className={`text-lg font-bold capitalize text-${healthColor}-400`}>
              {checkInHealth === 'healthy' ? '✓ Healthy' : checkInHealth === 'warning' ? '⚠ Warning' : '✕ Critical'}
            </p>
            <p className="text-sm text-slate-400 mt-0.5">
              Last check-in: {daysSinceCheckIn} days ago · {daysRemaining} days remaining
            </p>
          </div>
          <button
            onClick={onCheckIn}
            className={`px-6 py-3 rounded-xl bg-gradient-to-r from-vault-600 to-purple-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-vault-500/30 transition-all active:scale-95 ${
              vaultState === 'frozen' ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={vaultState === 'frozen'}
          >
            <Wallet className="w-4 h-4 inline mr-2" />
            Check In Now
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">Time until inactivity threshold</span>
            <span className={`text-xs font-mono font-semibold text-${healthColor}-400`}>{daysRemaining}d / {inactivityDays}d</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${
                checkInHealth === 'healthy' ? 'from-emerald-500 to-emerald-400' :
                checkInHealth === 'warning' ? 'from-amber-500 to-amber-400' :
                'from-rose-500 to-rose-400'
              }`}
              style={{ width: `${checkInPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-vault-500/10 text-vault-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-sm font-semibold text-white">Inactivity Threshold</p>
          </div>
          <p className="text-2xl font-bold text-white font-mono">{inactivityDays}d</p>
          <p className="text-xs text-slate-500 mt-1">After this period without check-in, guardians can initiate unlock</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <p className="text-sm font-semibold text-white">Timelock Delay</p>
          </div>
          <p className="text-2xl font-bold text-white font-mono">30d</p>
          <p className="text-xs text-slate-500 mt-1">Mandatory waiting period after unlock approval before distribution</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <p className="text-sm font-semibold text-white">Multi-Channel</p>
          </div>
          <p className="text-2xl font-bold text-white font-mono">4</p>
          <p className="text-xs text-slate-500 mt-1">Wallet, Email OTP, SMS, Push notification check-in channels</p>
        </div>
      </div>

      {/* Check-in History */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-vault-400" />
            <h3 className="text-base font-semibold text-white">Check-in History</h3>
          </div>
        </div>

        {/* Chart */}
        <div className="h-36 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} />
              <YAxis hide domain={[0, 1]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0]?.payload;
                    return (
                      <div className="bg-[#131832] border border-vault-800/30 rounded-lg px-3 py-2 text-xs">
                        <p className="text-slate-300 font-semibold">{d?.date}</p>
                        <p className={d?.value ? 'text-emerald-400' : 'text-rose-400'}>
                          {d?.value ? '✓ Checked in' : '✕ Missed'}
                        </p>
                        <p className="text-slate-500">via {d?.channel}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.value ? '#22c55e' : '#f43f5e'} fillOpacity={0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* History List */}
        <div className="space-y-2">
          {mockLiveness.slice().reverse().map((record, i) => {
            const Icon = channelIcons[record.channel] || Wallet;
            return (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  record.checkIn ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {record.checkIn ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-200 font-medium">
                    {record.checkIn ? 'Check-in confirmed' : 'Check-in missed'}
                  </p>
                  <p className="text-[10px] text-slate-500">{record.date}</p>
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${channelColors[record.channel]}`}>
                  <Icon className="w-3 h-3" />
                  {record.channel}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
