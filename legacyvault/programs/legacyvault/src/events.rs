use anchor_lang::prelude::*;
use crate::state::*;

// ─── Global ────────────────────────────────────────────────────────────────

#[event]
pub struct GlobalConfigInitialized {
    pub admin: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct GlobalConfigUpdated {
    pub admin: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct ProgramPaused {
    pub admin: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct ProgramUnpaused {
    pub admin: Pubkey,
    pub timestamp: i64,
}

// ─── Vault ─────────────────────────────────────────────────────────────────

#[event]
pub struct VaultCreated {
    pub vault: Pubkey,
    pub owner: Pubkey,
    pub vault_nonce: u8,
    pub inactivity_threshold: i64,
    pub timelock_duration: i64,
    pub guardian_threshold: u8,
    pub timestamp: i64,
}

#[event]
pub struct VaultSettingsUpdated {
    pub vault: Pubkey,
    pub owner: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct VaultFrozen {
    pub vault: Pubkey,
    pub frozen_by: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct VaultUnfrozen {
    pub vault: Pubkey,
    pub unfrozen_by: Pubkey,
    pub timestamp: i64,
}

// ─── Guardians ─────────────────────────────────────────────────────────────

#[event]
pub struct GuardianAdded {
    pub vault: Pubkey,
    pub guardian: Pubkey,
    pub role: GuardianRole,
    pub timestamp: i64,
}

#[event]
pub struct GuardianAccepted {
    pub vault: Pubkey,
    pub guardian: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct GuardianRemoved {
    pub vault: Pubkey,
    pub guardian: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct GuardianThresholdUpdated {
    pub vault: Pubkey,
    pub new_threshold: u8,
    pub timestamp: i64,
}

// ─── Beneficiaries ─────────────────────────────────────────────────────────

#[event]
pub struct BeneficiaryAdded {
    pub vault: Pubkey,
    pub beneficiary: Pubkey,
    pub share_bps: u16,
    pub timestamp: i64,
}

#[event]
pub struct BeneficiaryUpdated {
    pub vault: Pubkey,
    pub beneficiary: Pubkey,
    pub share_bps: u16,
    pub active: bool,
    pub timestamp: i64,
}

#[event]
pub struct BeneficiaryRemoved {
    pub vault: Pubkey,
    pub beneficiary: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct AssetRuleSet {
    pub vault: Pubkey,
    pub beneficiary: Pubkey,
    pub mint: Pubkey,
    pub mode: AssetRuleMode,
    pub timestamp: i64,
}

#[event]
pub struct AssetRuleCleared {
    pub vault: Pubkey,
    pub beneficiary: Pubkey,
    pub mint: Pubkey,
    pub timestamp: i64,
}

// ─── Assets ────────────────────────────────────────────────────────────────

#[event]
pub struct Deposited {
    pub vault: Pubkey,
    pub depositor: Pubkey,
    /// "SOL" | "SPL" | "NFT" | "POSITION"
    pub asset_type: String,
    pub mint: Option<Pubkey>,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct Withdrawn {
    pub vault: Pubkey,
    pub owner: Pubkey,
    pub asset_type: String,
    pub mint: Option<Pubkey>,
    pub amount: u64,
    pub timestamp: i64,
}

// ─── Liveness ──────────────────────────────────────────────────────────────

#[event]
pub struct LivenessCheckIn {
    pub vault: Pubkey,
    pub signed_by: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct LivenessDelegateAdded {
    pub vault: Pubkey,
    pub delegate: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct LivenessDelegateRemoved {
    pub vault: Pubkey,
    pub delegate: Pubkey,
    pub timestamp: i64,
}

// ─── Documents ─────────────────────────────────────────────────────────────

#[event]
pub struct DocumentSet {
    pub vault: Pubkey,
    pub doc_hash: [u8; 64],
    pub doc_uri_len: u8, // length of the URI stored; full URI too large to emit
    pub timestamp: i64,
}

#[event]
pub struct DocumentRevoked {
    pub vault: Pubkey,
    pub timestamp: i64,
}

// ─── Unlock ────────────────────────────────────────────────────────────────

#[event]
pub struct UnlockInitiated {
    pub vault: Pubkey,
    pub unlock_session: Pubkey,
    pub initiated_by: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct UnlockApproved {
    pub vault: Pubkey,
    pub unlock_session: Pubkey,
    pub guardian: Pubkey,
    pub approval_count: u8,
    pub timestamp: i64,
}

#[event]
pub struct UnlockThresholdMet {
    pub vault: Pubkey,
    pub unlock_session: Pubkey,
    pub timelock_ends_at: i64,
    pub timestamp: i64,
}

#[event]
pub struct UnlockCancelled {
    pub vault: Pubkey,
    pub unlock_session: Pubkey,
    pub cancelled_by: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct DisputeOpened {
    pub vault: Pubkey,
    pub unlock_session: Pubkey,
    pub opened_by: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct DisputeResolved {
    pub vault: Pubkey,
    pub unlock_session: Pubkey,
    pub resolved_by: Pubkey,
    pub resolution: DisputeStatus,
    pub timestamp: i64,
}

// ─── Distribution ──────────────────────────────────────────────────────────

#[event]
pub struct SolDistributionInitialized {
    pub vault: Pubkey,
    pub unlock_session: Pubkey,
    pub total_beneficiaries: u8,
    pub total_lamports: u64,
    pub timestamp: i64,
}

#[event]
pub struct SolBatchExecuted {
    pub vault: Pubkey,
    pub start_index: u8,
    pub batch_size: u8,
    pub amount_distributed: u64,
    pub timestamp: i64,
}

#[event]
pub struct SplDistributionInitialized {
    pub vault: Pubkey,
    pub unlock_session: Pubkey,
    pub mint: Pubkey,
    pub total_beneficiaries: u8,
    pub total_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct SplBatchExecuted {
    pub vault: Pubkey,
    pub mint: Pubkey,
    pub start_index: u8,
    pub batch_size: u8,
    pub amount_distributed: u64,
    pub timestamp: i64,
}

#[event]
pub struct UnlockFinalized {
    pub vault: Pubkey,
    pub unlock_session: Pubkey,
    pub executed_at: i64,
}

// ─── Subscription ──────────────────────────────────────────────────────────

#[event]
pub struct SubscriptionUpdated {
    pub vault: Pubkey,
    pub tier: SubscriptionTier,
    pub expires_at: i64,
    pub timestamp: i64,
}

// ─── Professional guardians ────────────────────────────────────────────────

#[event]
pub struct ProfessionalGuardianRegistered {
    pub guardian: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct ProfessionalGuardianKycUpdated {
    pub guardian: Pubkey,
    pub status: KycStatus,
    pub timestamp: i64,
}

#[event]
pub struct GuardianBonded {
    pub vault: Pubkey,
    pub guardian: Pubkey,
    pub bond_lamports: u64,
    pub timestamp: i64,
}

#[event]
pub struct GuardianSlashed {
    pub vault: Pubkey,
    pub guardian: Pubkey,
    pub slash_amount: u64,
    pub timestamp: i64,
}
