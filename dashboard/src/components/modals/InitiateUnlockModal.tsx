import { FC } from 'react';
import { X, Shield, AlertTriangle, Info, Lock } from 'lucide-react';

interface InitiateUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const InitiateUnlockModal: FC<InitiateUnlockModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-card w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Initiate Unlock</h3>
              <p className="text-xs text-slate-400">Begin the vault distribution process</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-rose-200">High Impact Action</p>
              <p className="text-xs text-rose-200/70 mt-1 leading-relaxed">
                Initiating an unlock will alert all guardians and begin the timelock countdown. This should only be done in the event of the owner's passing or permanent loss of access.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Process Overview</h4>
            <div className="space-y-2">
              {[
                'Guardians are notified to approve/reject',
                'Timelock duration must elapse',
                'Assets become distributable to heirs'
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-bold flex items-center justify-center text-slate-400">
                    {i + 1}
                  </div>
                  <p className="text-xs text-slate-300 font-medium">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-white/5 text-white text-sm font-semibold hover:bg-white/10 transition-all border border-white/5"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
            >
              Confirm Unlock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InitiateUnlockModal;
