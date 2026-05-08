import { FC } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface ApprovalsPanelProps {
  onApprove: (vaultId: string) => void;
  onReject: (vaultId: string) => void;
}

const mockRequests = [
  {
    vaultId: 'Vlt11111111111111111111111111111111111111111',
    vaultName: 'Main Family Trust',
    ownerAddress: 'Ownr111111111111111111111111111111111111111',
    status: 'pending',
    requestedAt: '2 hours ago',
    deadline: '70 hours remaining'
  }
];

const ApprovalsPanel: FC<ApprovalsPanelProps> = ({ onApprove, onReject }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Pending Approvals</h2>
        <p className="text-sm text-slate-400 mt-1">Review and sign off on emergency unlock requests for vaults you guard.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {mockRequests.length === 0 ? (
          <div className="p-8 text-center glass-card rounded-2xl border-dashed border-white/10">
            <ShieldAlert className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">No Pending Requests</p>
            <p className="text-sm text-slate-500 mt-1">You're all caught up. No vaults require your signature right now.</p>
          </div>
        ) : (
          mockRequests.map((req, i) => (
            <div key={i} className="glass-card p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 border-amber-500/20 bg-amber-500/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{req.vaultName}</h3>
                  <p className="text-sm text-slate-400">Owner: {req.ownerAddress}</p>
                  <p className="text-xs text-amber-400 mt-1 font-mono">Unlock requested {req.requestedAt} — {req.deadline}</p>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button
                  onClick={() => onReject(req.vaultId)}
                  className="flex-1 md:flex-none px-6 py-2.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-bold transition-all"
                >
                  Reject
                </button>
                <button
                  onClick={() => onApprove(req.vaultId)}
                  className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" /> Approve Unlock
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ApprovalsPanel;
