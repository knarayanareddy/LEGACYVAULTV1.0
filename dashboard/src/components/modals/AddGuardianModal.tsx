import { FC, useState } from 'react';
import { X, Shield, User, Info, AlertCircle } from 'lucide-react';

interface AddGuardianModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (params: { guardianWallet: string; role: 'personal' | 'professional' | 'delegate' }) => void;
}

const AddGuardianModal: FC<AddGuardianModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [wallet, setWallet] = useState('');
  const [role, setRole] = useState<'personal' | 'professional' | 'delegate'>('personal');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (wallet.length < 32) return;
    onAdd({ guardianWallet: wallet, role });
    onClose();
    setWallet('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-card w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-vault-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-vault-500/20 flex items-center justify-center text-vault-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Add Guardian</h3>
              <p className="text-xs text-slate-400">Designate a new vault protector</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Guardian Wallet Address</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                placeholder="Enter Solana address (e.g., Grd1...xyz)"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:border-vault-500 focus:ring-1 focus:ring-vault-500 transition-all outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Guardian Role</label>
            <div className="grid grid-cols-3 gap-2">
              {(['personal', 'professional', 'delegate'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold uppercase tracking-tight border transition-all ${
                    role === r 
                      ? 'bg-vault-500 border-vault-400 text-white shadow-lg shadow-vault-500/20' 
                      : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-200/80 leading-relaxed">
              Guardians can approve or reject vault unlock requests. Choose trusted individuals or professional services.
            </p>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-white/5 text-white text-sm font-semibold hover:bg-white/10 transition-all border border-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={wallet.length < 32}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-vault-600 to-indigo-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-vault-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Guardian
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGuardianModal;
