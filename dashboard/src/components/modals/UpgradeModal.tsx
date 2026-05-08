import { FC } from 'react';
import { X, Check, Zap, Shield, Crown } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (tier: string) => void;
}

const tiers = [
  {
    name: 'Pro',
    price: '0.5 SOL',
    period: '/year',
    icon: Zap,
    color: 'from-blue-500 to-vault-500',
    features: [
      'Up to 5 Guardians',
      'Unlimited Beneficiaries',
      'Advanced Document Storage',
      'Custom Liveness Thresholds',
      'Priority Support'
    ]
  },
  {
    name: 'Enterprise',
    price: '2.0 SOL',
    period: '/lifetime',
    icon: Crown,
    color: 'from-vault-500 to-purple-600',
    features: [
      'Unlimited Guardians',
      'Multi-sig Distribution',
      'Institutional Custody Integration',
      'Dedicated Account Manager',
      'Custom Smart Contract Logic'
    ],
    popular: true
  }
];

const UpgradeModal: FC<UpgradeModalProps> = ({ isOpen, onClose, onUpgrade }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-[#0f0f16] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-vault-500/20 text-vault-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Upgrade Your Protection</h3>
              <p className="text-sm text-slate-400">Unlock advanced features for your digital legacy</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <div 
                key={tier.name}
                className={`relative flex flex-col p-6 rounded-2xl border transition-all duration-300 group ${
                  tier.popular ? 'bg-white/[0.03] border-vault-500/50 shadow-lg shadow-vault-500/10' : 'bg-white/[0.01] border-white/10 hover:border-white/20'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-vault-600 text-white text-[10px] font-bold uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center text-white shadow-lg`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">{tier.name}</h4>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-white">{tier.price}</span>
                      <span className="text-xs text-slate-500">{tier.period}</span>
                    </div>
                  </div>
                </div>

                <ul className="flex-1 space-y-3 mb-8">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => onUpgrade(tier.name)}
                  className={`w-full py-3 rounded-xl font-bold transition-all active:scale-95 ${
                    tier.popular 
                      ? 'bg-gradient-to-r from-vault-600 to-purple-600 text-white shadow-lg shadow-vault-500/20'
                      : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  Upgrade to {tier.name}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
