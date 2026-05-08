// ─────────────────────────────────────────────────────────────────────────────
// Standard API response wrappers
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  data: T;
  meta?: {
    total?: number;
    limit?: number;
    offset?: number;
    hasMore?: boolean;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth types
// ─────────────────────────────────────────────────────────────────────────────

export interface NonceResponse {
  nonce: string;
  expiresAt: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  wallet: string;
}

export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Vault read types
// ─────────────────────────────────────────────────────────────────────────────

export type VaultUIStatus =
  | 'locked'
  | 'unlocking'
  | 'unlocked'
  | 'frozen'
  | 'distributed';

export type CheckInHealth = 'healthy' | 'warning' | 'danger';

export interface VaultSummaryResponse {
  pubkey: string;
  ownerPubkey: string;
  status: VaultUIStatus;
  createdAt: number;
  lastCheckIn: number;
  timelockStart: number | null;
  inactivityThreshold: number;
  timelockDuration: number;
  guardianThreshold: number;
  totalGuardians: number;
  totalBeneficiaries: number;
  totalBps: number;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  subscriptionExpiry: number | null;
  daysSinceCheckIn: number;
  daysRemaining: number;
  checkInHealth: CheckInHealth;
  approvedGuardians: number;
  totalUsdValue: number;
  unlockSession: UnlockSessionView | null;
}

export interface UnlockSessionView {
  pubkey: string;
  status: string;
  initiatedBy: string;
  initiatedAt: number;
  approvedAt: number | null;
  timelockStartedAt: number | null;
  timelockEndsAt: number | null;
  executedAt: number | null;
  approvalCount: number;
  threshold: number;
  timeRemaining: number | null;
}

export interface GuardianView {
  pubkey: string;
  role: 'personal' | 'professional' | 'delegate';
  status: 'pending' | 'active' | 'inactive' | 'removed';
  approved: boolean;
  approvalTime: number | null;
  name: string | null;
  avatar: string | null;
  lastContact: number | null;
  reputation: number | null;
  bondAmount: number | null;
}

export interface AssetOverrideView {
  mint: string;
  mode: 'pro-rata' | 'fixed-bps' | 'entire-to-beneficiary';
  fixedBps: number | null;
}

export interface BeneficiaryView {
  pubkey: string;
  shareBps: number;
  active: boolean;
  name: string | null;
  avatar: string | null;
  assetOverrides: AssetOverrideView[];
}

export interface VaultAssetView {
  type: 'SOL' | 'SPL' | 'NFT' | 'POSITION';
  mint: string | null;
  symbol: string;
  name: string;
  icon: string | null;
  balance: number;
  usdValue: number;
  change24h: number | null;
}

export interface LivenessSummaryResponse {
  lastCheckIn: number | null;
  daysSinceCheckIn: number;
  daysRemaining: number;
  checkInHealth: CheckInHealth;
  inactivityThresholdDays: number;
  delegates: LivenessDelegateView[];
}

export interface LivenessDelegateView {
  wallet: string;
  addedAt: number;
  active: boolean;
}

export interface LivenessRecord {
  timestamp: number;
  signedBy: string;
  txSignature: string | null;
}

export interface DistributionStateResponse {
  unlockSession: UnlockSessionView | null;
  solSession: SolSessionView | null;
  splSessions: SplSessionView[];
  availableMints: string[];
  canFinalize: boolean;
}

export interface SolSessionView {
  pubkey: string;
  totalBeneficiaries: number;
  cursor: number;
  totalLamports: number;
  distributedLamports: number;
  completed: boolean;
  batches: DistributionBatchView[];
}

export interface SplSessionView {
  pubkey: string;
  mint: string;
  symbol: string;
  totalBeneficiaries: number;
  cursor: number;
  totalAmount: number;
  distributedAmount: number;
  completed: boolean;
  createMissingAtas: boolean;
  batches: DistributionBatchView[];
}

export interface DistributionBatchView {
  id: string;
  startIndex: number;
  batchSize: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  txSignature: string | null;
  processedAt: number | null;
}

export interface DocumentView {
  id: string;
  type: 'will' | 'letter' | 'legal' | 'identity' | 'financial' | 'other';
  name: string;
  sizeBytes: number;
  hash: string;
  uri: string;
  uploadedAt: string;
  encrypted: boolean;
  revoked: boolean;
}

export interface ActivityLogView {
  id: string;
  activityType: string;
  description: string;
  actorWallet: string | null;
  txSignature: string | null;
  timestamp: number;
  metadata: Record<string, unknown> | null;
}

export interface NotificationView {
  id: string;
  vaultPubkey: string | null;
  notificationType: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  read: boolean;
  createdAt: string;
}

export interface PortfolioSummaryResponse {
  totalUsdValue: number;
  breakdown: {
    sol: number;
    spl: number;
    nft: number;
    position: number;
  };
}

export interface PortfolioSnapshotView {
  timestamp: string;
  totalUsdValue: number;
}

export interface AssetDistributionSlice {
  symbol: string;
  name: string;
  usdValue: number;
  percentage: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tx builder response
// ─────────────────────────────────────────────────────────────────────────────

export interface TxBuilderResponse {
  transaction: string;        // base64 encoded unsigned VersionedTransaction
  estimatedFee: number;       // lamports
  computeUnits: number;
  warnings: string[];
}
