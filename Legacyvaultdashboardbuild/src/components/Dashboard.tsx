import {
  Wallet, Shield, Heart, Send, ArrowUpRight, ArrowDownRight,
  Clock, AlertTriangle, CheckCircle2, TrendingUp, Activity,
  ChevronRight, ExternalLink
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { assetDistribution, portfolioHistory } from '../data/mockData';
import type { ActivityLog, Notification } from '../types';

interface DashboardProps {
  totalValue: number;
  approvedGuardians: number;
  guardianThreshold: number;
  totalBeneficiaries: number;
  daysSinceCheckIn: number;
  inactivityDays: number;
  checkInHealth: string;
  vaultState: string;
  activity: ActivityLog[];
  notifications: Notification[];
  onNavigate: (tab: string) => void;
  onCheckIn: () => void;
}

const statCards = [
  { label: 'Total Vault Value', value: '$103,701', change: '+8.2%', up: true, icon: Wallet, gradient: 'from-vault-500 to-indigo-600', shadow: 'shadow-vault-500/20' },
  { label: 'Guardians Active', value: '3 / 5', change: 'Threshold: 3', up: true, icon: Shield, gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20' },
  { label: 'Beneficiaries', value: '3', change: '10,000 bps allocated', up: true, icon: Heart, gradient: 'from-purple-500 to-pink-600', shadow: 'shadow-purple-500/20' },
  { label: 'Last Check-in', value: '3 days', change: 'Threshold: 90 days', up: true, icon: Clock, gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' },
];

const activityIcons: Record<string, { icon: typeof Activity; color: string }> = {
  deposit: { icon: ArrowDownRight, color: 'text-emerald-400 bg-emerald-400/10' },
  withdraw: { icon: ArrowUpRight, color: 'text-rose-400 bg-rose-400/10' },
  guardian_approve: { icon: Shield, color: 'text-vault-400 bg-vault-400/10' },
  check_in: { icon: CheckCircle2, color: 'text-cyan-400 bg-cyan-400/10' },
  unlock_init: { icon: AlertTriangle, color: 'text-amber-400 bg-amber-400/10' },
  distribution: { icon: Send, color: 'text-purple-400 bg-purple-400/10' },
  freeze: { icon: AlertTriangle, color: 'text-rose-400 bg-rose-400/10' },
  config_change: { icon: Activity, color: 'text-slate-400 bg-slate-400/10' },
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d ago`;
  const hours = Math.floor(diff / 3600000);
  if (hours > 0) return `${hours}h ago`;
  return 'Just now';
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#131832] border border-vault-800/30 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-sm font-semibold text-slate-200">{label}</p>
        <p className="text-sm text-vault-400 font-mono">${payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard({
  daysSinceCheckIn, inactivityDays, checkInHealth, vaultState,
  activity, notifications, onNavigate, onCheckIn
}: DashboardProps) {
  const _unused = { totalValue: 0, approvedGuardians: 0, guardianThreshold: 0, totalBeneficiaries: 0 };
  void _unused;
  const checkInPercent = Math.max(0, 100 - (daysSinceCheckIn / inactivityDays) * 100);
  const checkInColor = checkInHealth === 'healthy' ? '#22c55e' : checkInHealth === 'warning' ? '#f59e0b' : '#f43f5e';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Vault Overview</h2>
          <p className="text-sm text-slate-400 mt-1">Monitor your digital estate at a glance</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
            vaultState === 'locked' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
            vaultState === 'frozen' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: checkInColor }} />
            {vaultState}
          </div>
          <button
            onClick={onCheckIn}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-vault-600 to-purple-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-vault-500/30 transition-all active:scale-95"
          >
            Check In
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`glass-card rounded-2xl p-5 animate-fade-in`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg ${card.shadow}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                {card.up !== undefined && (
                  <div className={`flex items-center gap-1 text-xs font-semibold ${card.up ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {card.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {card.change}
                  </div>
                )}
              </div>
              <p className="text-2xl font-bold text-white tracking-tight">{card.value}</p>
              <p className="text-xs text-slate-500 mt-1">{card.label}</p>
              {card.label === 'Last Check-in' && (
                <div className="mt-3 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${checkInPercent}%`, backgroundColor: checkInColor }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Portfolio History */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-white">Portfolio Value</h3>
              <p className="text-xs text-slate-500 mt-0.5">7 month history</p>
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-semibold">+44.0%</span>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioHistory}>
                <defs>
                  <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5c7cfa" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#5c7cfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
                <XAxis dataKey="date" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#5c7cfa" strokeWidth={2.5} fill="url(#portfolioGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Distribution */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-base font-semibold text-white mb-1">Asset Allocation</h3>
          <p className="text-xs text-slate-500 mb-4">By USD value</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {assetDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#131832] border border-vault-800/30 rounded-lg px-3 py-2 text-xs">
                          <span className="text-slate-300 font-semibold">{payload[0]?.name}: </span>
                          <span className="text-vault-400 font-mono">${payload[0]?.value?.toLocaleString()}</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {assetDistribution.slice(0, 5).map((asset) => (
              <div key={asset.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: asset.color }} />
                  <span className="text-xs text-slate-400">{asset.name}</span>
                </div>
                <span className="text-xs font-mono text-slate-300">${asset.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-white">Recent Activity</h3>
            <button onClick={() => onNavigate('vault')} className="text-xs text-vault-400 hover:text-vault-300 flex items-center gap-1 transition-colors">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {activity.slice(0, 5).map((item, i) => {
              const meta = activityIcons[item.type] || activityIcons.config_change;
              const Icon = meta.icon;
              return (
                <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{item.description}</p>
                    <p className="text-[11px] text-slate-500">{timeAgo(item.timestamp)}</p>
                  </div>
                  {item.txSignature && (
                    <ExternalLink className="w-3.5 h-3.5 text-slate-600 hover:text-vault-400 cursor-pointer flex-shrink-0 transition-colors" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Notifications */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-white">Notifications</h3>
            <span className="text-xs bg-vault-600/20 text-vault-400 px-2 py-0.5 rounded-full font-semibold">
              {notifications.filter(n => !n.read).length} new
            </span>
          </div>
          <div className="space-y-3">
            {notifications.map((n, i) => (
              <div key={n.id} className={`p-3 rounded-xl transition-colors animate-fade-in ${n.read ? 'bg-transparent' : 'bg-white/[0.03] border border-white/5'}`} style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    n.type === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                    n.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                    n.type === 'error' ? 'bg-rose-500/10 text-rose-400' :
                    'bg-vault-500/10 text-vault-400'
                  }`}>
                    {n.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                     n.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
                     <Activity className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200">{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-slate-600 mt-1">{timeAgo(n.time)}</p>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-vault-500 flex-shrink-0 mt-2" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
