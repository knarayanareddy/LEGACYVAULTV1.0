import { FC, useState } from 'react';
import { X, Wallet, ArrowUp } from 'lucide-react';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWithdraw: (amount: number) => void;
  maxAmount: number;
}

const WithdrawModal: FC<WithdrawModalProps> = ({ isOpen, onClose, onWithdraw, maxAmount }) => {
  const [amount, setAmount] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!isNaN(val) && val > 0 && val <= maxAmount) {
      onWithdraw(val);
      onClose();
      setAmount('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#0f0f16] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <ArrowUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Withdraw Assets</h3>
              <p className="text-xs text-slate-400">Transfer funds out of your vault</p>
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
              <span className="text-slate-500 text-xs">Available: {maxAmount.toLocaleString()} SOL</span>
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <Wallet className="w-5 h-5" />
              </div>
              <input
                type="number"
                step="0.01"
                max={maxAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white font-mono text-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder-slate-600"
                placeholder="0.00"
                required
              />
              <button 
                type="button"
                onClick={() => setAmount(maxAmount.toString())}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-purple-500/20 text-purple-400 text-[10px] font-bold rounded uppercase hover:bg-purple-500/30 transition-colors"
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
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all active:scale-95"
            >
              Confirm Withdrawal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WithdrawModal;
