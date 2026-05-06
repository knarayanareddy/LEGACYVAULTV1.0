import type {
  VaultState, Guardian, Beneficiary, VaultAsset,
  LivenessRecord, VaultDocument, DistributionBatch,
  Notification, ActivityLog
} from '../types';

const now = Date.now();
const day = 86400000;

export const mockVault: VaultState = {
  pubkey: 'Lv1xKp9YbZ7RmN4QwE3tJd8Fs2A6gHc5UjMnVbXpLqYw',
  owner: '7xKXp9YbZ7RmN4QwE3tJd8Fs2A6gHc5UjMnVbXpLqYw1',
  state: 'locked',
  createdAt: now - 180 * day,
  lastCheckIn: now - 3 * day,
  inactivityThreshold: 90 * day / 1000,
  timelockDuration: 30 * day / 1000,
  timelockStart: null,
  guardianThreshold: 3,
  totalGuardians: 5,
  totalBeneficiaries: 3,
  totalBps: 10000,
  subscriptionTier: 'pro',
  subscriptionExpiry: now + 365 * day,
};

export const mockGuardians: Guardian[] = [
  { id: 'g1', pubkey: 'Gd1...xKp9', name: 'Sarah Chen', role: 'personal', status: 'active', approved: true, approvalTime: now - 120 * day, avatar: '👩‍💼', reputation: 95, lastContact: now - 2 * day },
  { id: 'g2', pubkey: 'Gd2...mN4Q', name: 'James Wilson', role: 'personal', status: 'active', approved: true, approvalTime: now - 115 * day, avatar: '👨‍💻', reputation: 88, lastContact: now - 5 * day },
  { id: 'g3', pubkey: 'Gd3...wE3t', name: 'LegalTrust Pro', role: 'professional', status: 'active', approved: true, approvalTime: now - 100 * day, avatar: '⚖️', reputation: 99, bondAmount: 50, lastContact: now - 1 * day },
  { id: 'g4', pubkey: 'Gd4...Jd8F', name: 'Maria Garcia', role: 'personal', status: 'active', approved: false, approvalTime: null, avatar: '👩‍🏫', reputation: 72, lastContact: now - 10 * day },
  { id: 'g5', pubkey: 'Gd5...s2A6', name: 'David Park', role: 'delegate', status: 'pending', approved: false, approvalTime: null, avatar: '👨‍🔬', reputation: 60, lastContact: now - 30 * day },
];

export const mockBeneficiaries: Beneficiary[] = [
  {
    id: 'b1', pubkey: 'Bn1...pLqY', name: 'Emma Vault', email: 'emma@vault.io',
    shareBps: 5000, active: true, avatar: '👧',
    assetOverrides: [
      { mintAddress: 'So11111111111111111111111111111111111111112', symbol: 'SOL', type: 'pro-rata' },
    ],
  },
  {
    id: 'b2', pubkey: 'Bn2...wZxR', name: 'Liam Vault', email: 'liam@vault.io',
    shareBps: 3000, active: true, avatar: '👦',
    assetOverrides: [
      { mintAddress: 'So11111111111111111111111111111111111111112', symbol: 'SOL', type: 'pro-rata' },
      { mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', type: 'fixed-bps', value: 4000 },
    ],
  },
  {
    id: 'b3', pubkey: 'Bn3...tKmN', name: 'Charity Fund', email: 'admin@charity.org',
    shareBps: 2000, active: true, avatar: '🏛️',
    assetOverrides: [
      { mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', type: 'fixed-bps', value: 6000 },
    ],
  },
];

export const mockAssets: VaultAsset[] = [
  { id: 'a1', type: 'SOL', symbol: 'SOL', name: 'Solana', balance: 245.832, usdValue: 41791.44, icon: '◎', change24h: 3.2 },
  { id: 'a2', type: 'SPL', mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', name: 'USD Coin', balance: 28500.00, usdValue: 28500.00, icon: '💵', change24h: 0.01 },
  { id: 'a3', type: 'SPL', mintAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK', name: 'Bonk', balance: 125000000, usdValue: 3750.00, icon: '🐕', change24h: -2.1 },
  { id: 'a4', type: 'SPL', mintAddress: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP', name: 'Jupiter', balance: 4200, usdValue: 5460.00, icon: '🪐', change24h: 1.8 },
  { id: 'a5', type: 'NFT', symbol: 'MAD', name: 'Mad Lads #4521', balance: 1, usdValue: 8200.00, icon: '🎨', change24h: -0.5 },
  { id: 'a6', type: 'POSITION', symbol: 'jitoSOL', name: 'Jito Staked SOL', balance: 50.0, usdValue: 8500.00, icon: '🔒', change24h: 3.1 },
  { id: 'a7', type: 'SPL', mintAddress: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', symbol: 'ETH', name: 'Wormhole ETH', balance: 2.5, usdValue: 7500.00, icon: '⟠', change24h: 1.5 },
];

export const mockLiveness: LivenessRecord[] = [
  { date: '2026-01-15', checkIn: true, channel: 'wallet' },
  { date: '2026-02-01', checkIn: true, channel: 'wallet' },
  { date: '2026-02-15', checkIn: true, channel: 'email' },
  { date: '2026-03-01', checkIn: true, channel: 'wallet' },
  { date: '2026-03-15', checkIn: true, channel: 'push' },
  { date: '2026-04-01', checkIn: true, channel: 'wallet' },
  { date: '2026-04-15', checkIn: true, channel: 'wallet' },
  { date: '2026-05-01', checkIn: true, channel: 'email' },
  { date: '2026-05-15', checkIn: false, channel: 'wallet' },
  { date: '2026-06-01', checkIn: false, channel: 'wallet' },
];

export const mockDocuments: VaultDocument[] = [
  { id: 'd1', name: 'Last Will & Testament.pdf', type: 'will', hash: 'QmX7...9kL2', size: '2.4 MB', uploadedAt: now - 150 * day, encrypted: true, icon: '📜' },
  { id: 'd2', name: 'Letter of Intent.pdf', type: 'letter', hash: 'QmY3...7mN4', size: '1.1 MB', uploadedAt: now - 140 * day, encrypted: true, icon: '✉️' },
  { id: 'd3', name: 'Trust Agreement.pdf', type: 'legal', hash: 'QmZ8...5pR6', size: '3.8 MB', uploadedAt: now - 130 * day, encrypted: true, icon: '⚖️' },
  { id: 'd4', name: 'Identity Documents.zip', type: 'identity', hash: 'QmA2...3tW8', size: '5.2 MB', uploadedAt: now - 120 * day, encrypted: true, icon: '🪪' },
  { id: 'd5', name: 'Financial Summary.xlsx', type: 'financial', hash: 'QmB5...8xK1', size: '0.8 MB', uploadedAt: now - 60 * day, encrypted: true, icon: '📊' },
  { id: 'd6', name: 'Insurance Policies.pdf', type: 'other', hash: 'QmC9...2vM3', size: '4.1 MB', uploadedAt: now - 45 * day, encrypted: true, icon: '🛡️' },
];

export const mockDistributionBatches: DistributionBatch[] = [
  { id: 'db1', asset: 'So11111111111111111111111111111111111111112', symbol: 'SOL', amount: 122.916, beneficiary: 'Emma Vault', status: 'pending' },
  { id: 'db2', asset: 'So11111111111111111111111111111111111111112', symbol: 'SOL', amount: 73.750, beneficiary: 'Liam Vault', status: 'pending' },
  { id: 'db3', asset: 'So11111111111111111111111111111111111111112', symbol: 'SOL', amount: 49.166, beneficiary: 'Charity Fund', status: 'pending' },
  { id: 'db4', asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', amount: 14250.00, beneficiary: 'Emma Vault', status: 'pending' },
  { id: 'db5', asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', amount: 11400.00, beneficiary: 'Liam Vault', status: 'pending' },
  { id: 'db6', asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', amount: 2850.00, beneficiary: 'Charity Fund', status: 'pending' },
];

export const mockNotifications: Notification[] = [
  { id: 'n1', type: 'warning', title: 'Check-in Reminder', message: 'Your next liveness check-in is due in 4 days', time: now - 2 * 3600000, read: false },
  { id: 'n2', type: 'info', title: 'Guardian Update', message: 'David Park is still pending acceptance', time: now - 1 * day, read: false },
  { id: 'n3', type: 'success', title: 'Deposit Confirmed', message: '50 SOL deposited successfully', time: now - 3 * day, read: true },
  { id: 'n4', type: 'info', title: 'Subscription Renewal', message: 'Your Pro subscription renews in 30 days', time: now - 5 * day, read: true },
];

export const mockActivity: ActivityLog[] = [
  { id: 'al1', type: 'deposit', description: 'Deposited 50 SOL into vault', timestamp: now - 3 * day, txSignature: '5xKp9...mN4Qw' },
  { id: 'al2', type: 'check_in', description: 'Owner check-in via wallet signature', timestamp: now - 3 * day },
  { id: 'al3', type: 'guardian_approve', description: 'Maria Garcia accepted guardian role', timestamp: now - 10 * day, txSignature: '3wE3t...Jd8Fs' },
  { id: 'al4', type: 'config_change', description: 'Updated beneficiary shares distribution', timestamp: now - 15 * day, txSignature: '2A6gH...c5UjM' },
  { id: 'al5', type: 'deposit', description: 'Deposited 10,000 USDC into vault', timestamp: now - 20 * day, txSignature: '1nVbX...pLqYw' },
  { id: 'al6', type: 'check_in', description: 'Owner check-in via email OTP', timestamp: now - 30 * day },
  { id: 'al7', type: 'config_change', description: 'Added LegalTrust Pro as professional guardian', timestamp: now - 100 * day, txSignature: '9Kp9Y...Z7RmN' },
  { id: 'al8', type: 'deposit', description: 'Vault initialized with 100 SOL', timestamp: now - 180 * day, txSignature: '8xKp9...bZ7Rm' },
];

export const assetDistribution = [
  { name: 'SOL', value: 41791, color: '#5c7cfa' },
  { name: 'USDC', value: 28500, color: '#22c55e' },
  { name: 'jitoSOL', value: 8500, color: '#a78bfa' },
  { name: 'ETH', value: 7500, color: '#06b6d4' },
  { name: 'NFT', value: 8200, color: '#f59e0b' },
  { name: 'JUP', value: 5460, color: '#ec4899' },
  { name: 'BONK', value: 3750, color: '#f97316' },
];

export const portfolioHistory = [
  { date: 'Jan', value: 72000 },
  { date: 'Feb', value: 78500 },
  { date: 'Mar', value: 85200 },
  { date: 'Apr', value: 91800 },
  { date: 'May', value: 88400 },
  { date: 'Jun', value: 95600 },
  { date: 'Jul', value: 103701 },
];
