export interface VaultState {
  pubkey: string;
  owner: string;
  state: 'locked' | 'unlocking' | 'unlocked' | 'frozen' | 'distributed';
  createdAt: number;
  lastCheckIn: number;
  inactivityThreshold: number; // seconds
  timelockDuration: number; // seconds
  timelockStart: number | null;
  guardianThreshold: number; // M of N
  totalGuardians: number;
  totalBeneficiaries: number;
  totalBps: number;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  subscriptionExpiry: number | null;
}

export interface Guardian {
  id: string;
  pubkey: string;
  name: string;
  role: 'personal' | 'professional' | 'delegate';
  status: 'active' | 'pending' | 'inactive';
  approved: boolean;
  approvalTime: number | null;
  avatar: string;
  reputation?: number;
  bondAmount?: number;
  lastContact: number;
}

export interface Beneficiary {
  id: string;
  pubkey: string;
  name: string;
  email: string;
  shareBps: number;
  active: boolean;
  avatar: string;
  assetOverrides: AssetOverride[];
}

export interface AssetOverride {
  mintAddress: string;
  symbol: string;
  type: 'pro-rata' | 'fixed-bps' | 'entire-to-beneficiary';
  value?: number;
}

export interface VaultAsset {
  id: string;
  type: 'SOL' | 'SPL' | 'NFT' | 'POSITION';
  mintAddress?: string;
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  icon: string;
  change24h?: number;
}

export interface LivenessRecord {
  date: string;
  checkIn: boolean;
  channel: 'wallet' | 'email' | 'sms' | 'push';
}

export interface VaultDocument {
  id: string;
  name: string;
  type: 'will' | 'letter' | 'legal' | 'identity' | 'financial' | 'other';
  hash: string;
  size: string;
  uploadedAt: number;
  encrypted: boolean;
  icon: string;
}

export interface DistributionBatch {
  id: string;
  asset: string;
  symbol: string;
  amount: number;
  beneficiary: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  txSignature?: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  time: number;
  read: boolean;
}

export interface ActivityLog {
  id: string;
  type: 'deposit' | 'withdraw' | 'guardian_approve' | 'check_in' | 'unlock_init' | 'distribution' | 'freeze' | 'config_change';
  description: string;
  timestamp: number;
  txSignature?: string;
}
