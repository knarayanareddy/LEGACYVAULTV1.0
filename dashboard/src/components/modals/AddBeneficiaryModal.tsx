import { FC, useState } from 'react';
import { X, Heart, User, Percent, Info, ToggleLeft } from 'lucide-react';

interface AddBeneficiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (params: { beneficiaryWallet: string; shareBps: number; active: boolean }) => void;
}

const AddBeneficiaryModal: FC<AddBeneficiaryModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [wallet, setWallet] = useState('');
  const [share, setShare] = useState<number>(1000); // 10%
  const [active, setActive] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (wallet.length < 32) return;
    onAdd({ beneficiaryWallet: wallet, shareBps: share, active });
    onClose();
    setWallet('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-card w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Add Beneficiary</h3>
              <p className="text-xs text-slate-400">Designate an heir for your assets</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Beneficiary Wallet Address</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                placeholder="Enter Solana address (e.g., Heir1...xyz)"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Share Allocation</label>
              <span className="text-xs font-bold text-purple-400">{(share / 100).toFixed(2)}%</span>
            </div>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <Percent className="w-4 h-4" />
              </div>
              <input
                type="range"
                min="1"
                max="10000"
                step="1"
                value={share}
                onChange={(e) => setShare(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500 mt-4 mb-2"
              />
              <div className="flex justify-between text-[10px] text-slate-600 font-bold px-1 uppercase tracking-tighter">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2">
              <ToggleLeft className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-300">Set as Active</span>
            </div>
            <button
              type="button"
              onClick={() => setActive(!active)}
              className={`w-10 h-5 rounded-full transition-all relative ${active ? 'bg-purple-500' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${active ? 'right-1' : 'left-1'}`} />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-200/80 leading-relaxed">
              Beneficiaries will receive their allocated share of the vault's assets once the distribution is finalized.
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
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Beneficiary
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBeneficiaryModal;
