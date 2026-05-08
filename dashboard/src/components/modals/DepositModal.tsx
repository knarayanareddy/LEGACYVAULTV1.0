import { FC, useState } from 'react';
import { X, Wallet, ArrowDown } from 'lucide-react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeposit: (amount: number) => void;
}

const DepositModal: FC<DepositModalProps> = ({ isOpen, onClose, onDeposit }) => {
  const [amount, setAmount] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!isNaN(val) && val > 0) {
      onDeposit(val);
      onClose();
      setAmount('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#0f0f16] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-vault-500/20 text-vault-400 flex items-center justify-center">
              <ArrowDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Deposit Assets</h3>
              <p className="text-xs text-slate-400">Secure funds in your LegacyVault</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300 flex justify-between">
              Amount (SOL)
              <span className="text-slate-500 text-xs">Balance: 14.50 SOL</span>
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <Wallet className="w-5 h-5" />
              </div>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white font-mono text-lg focus:outline-none focus:border-vault-500 focus:ring-1 focus:ring-vault-500 transition-all placeholder-slate-600"
                placeholder="0.00"
                required
              />
              <button 
                type="button"
                onClick={() => setAmount('14.50')}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-vault-500/20 text-vault-400 text-[10px] font-bold rounded uppercase hover:bg-vault-500/30 transition-colors"
              >
                Max
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white font-semibold hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-vault-600 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-vault-500/30 transition-all active:scale-95"
            >
              Confirm Deposit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepositModal;
