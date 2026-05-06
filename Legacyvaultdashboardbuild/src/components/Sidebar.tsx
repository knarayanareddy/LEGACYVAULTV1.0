import {
  Shield, LayoutDashboard, Users, Heart, Send, FileText,
  Settings, ChevronLeft, ChevronRight, Wallet, Lock
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  unreadCount: number;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'vault', label: 'Vault & Assets', icon: Wallet },
  { id: 'guardians', label: 'Guardians', icon: Users },
  { id: 'beneficiaries', label: 'Beneficiaries', icon: Heart },
  { id: 'liveness', label: 'Liveness', icon: Heart },
  { id: 'distribution', label: 'Distribution', icon: Send },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed, unreadCount }: SidebarProps) {
  return (
    <aside className={`relative flex flex-col bg-gradient-to-b from-[#0d1225] to-[#0a0e1a] border-r border-vault-900/30 transition-all duration-300 h-full ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-vault-900/30">
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-vault-500 to-purple-600 flex items-center justify-center shadow-lg shadow-vault-500/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0d1225] animate-pulse" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-lg font-bold shimmer-text tracking-tight">LegacyVault</h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">Digital Estate</p>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item, i) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-vault-600/20 to-purple-600/10 text-vault-300 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className={`relative flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                isActive ? 'bg-vault-600/30 text-vault-300' : 'bg-white/5 text-slate-500 group-hover:text-slate-300'
              }`}>
                <Icon className="w-4.5 h-4.5" strokeWidth={1.8} />
                {item.id === 'distribution' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              {!collapsed && (
                <span className="text-sm font-medium animate-fade-in">{item.label}</span>
              )}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-5 rounded-full bg-gradient-to-b from-vault-400 to-purple-500 animate-fade-in" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Vault Status */}
      {!collapsed && (
        <div className="mx-3 mb-4 p-4 rounded-2xl glass-card animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Vault Secured</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            All assets protected by 3-of-5 guardian threshold
          </p>
          <div className="mt-3 h-1 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full w-3/5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
          </div>
          <p className="text-[10px] text-slate-600 mt-1.5">3 of 5 guardians approved</p>
        </div>
      )}

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mx-3 mb-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-all flex items-center justify-center"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
