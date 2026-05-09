use anchor_lang::prelude::*;
use crate::constants::*;

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum VaultStatus {
    Active,       // UI: "locked"
    Unlocking,    // UI: "unlocking"   — collecting guardian approvals
    Executing,    // UI: "unlocked"    — timelock elapsed; distribution in progress
    Distributed,  // UI: "distributed" — finalized; terminal state
    Frozen,       // UI: "frozen"      — safety halt
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum UnlockSessionStatus {
    Proposed,   // Initiated; collecting approvals
    Approved,   // M-of-N reached; timelock running
    Executing,  // Timelock elapsed; distribution started
    Executed,   // finalize_unlock called; complete
    Cancelled,  // Owner cancelled or arbiter resolved to cancel
    Disputed,   // Open dispute blocking progression
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum GuardianRole {
    Personal,
    Professional,
    Delegate,     // check-in only; cannot approve unlock
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum GuardianStatus {
    Pending,
    Active,
    Inactive,
    Removed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum AssetRuleMode {
    ProRata,              // use global share_bps
    FixedBps,             // use override fixed_bps value
    EntireToBeneficiary,  // this beneficiary receives 100% of this asset
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum SubscriptionTier {
    Free,
    Pro,
    Enterprise,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum DisputeStatus {
    Open,
    ResolvedCancel,
    ResolvedProceed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum KycStatus {
    Unverified,
    Pending,
    Verified,
    Revoked,
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT STRUCTS
// ─────────────────────────────────────────────────────────────────────────────

/// Global program configuration. One per program deployment.
/// PDA seeds: [b"global_config"]
#[account]
#[derive(Debug)]
pub struct GlobalConfig {
    /// The admin multisig pubkey (Squads or equivalent).
    pub admin: Pubkey,
    /// Global kill switch. When true, all non-admin instructions are blocked.
    pub paused: bool,
    /// Receives protocol creation and subscription fees.
    pub fee_receiver: Pubkey,
    /// Fee charged in lamports on vault creation.
    pub creation_fee_lamports: u64,
    /// Monthly subscription fee for Pro tier (in lamports).
    pub subscription_fee_pro_lamports: u64,
    /// Monthly subscription fee for Enterprise tier (in lamports).
    pub subscription_fee_enterprise_lamports: u64,
    // Per-tier guardian limits (enforced on-chain)
    pub max_guardians_free: u8,
    pub max_guardians_pro: u8,
    pub max_guardians_enterprise: u8,
    // Per-tier beneficiary limits
    pub max_beneficiaries_free: u8,
    pub max_beneficiaries_pro: u8,
    pub max_beneficiaries_enterprise: u8,
    /// PDA bump.
    pub bump: u8,
}

impl GlobalConfig {
    pub const SIZE: usize = GLOBAL_CONFIG_SPACE;
}

// ─────────────────────────────────────────────────────────────────────────────

/// Core vault account. One per owner per nonce.
/// PDA seeds: [b"vault", owner_pubkey, &[vault_nonce]]
#[account]
#[derive(Debug)]
pub struct Vault {
    /// The wallet that created and controls this vault.
    pub owner: Pubkey,
    /// Nonce supporting multiple vaults per owner (0 for first vault).
    pub vault_nonce: u8,
    /// Current vault lifecycle status.
    pub status: VaultStatus,
    /// Vault PDA bump.
    pub bump: u8,
    /// Vault authority PDA bump (the account that holds assets).
    pub authority_bump: u8,

    // ── Timestamps ──────────────────────────────────────────────────────────
    pub created_at: i64,
    pub last_check_in: i64,

    // ── Liveness configuration ───────────────────────────────────────────────
    /// Seconds of inactivity before guardians may initiate an unlock.
    /// Bounded: [MIN_INACTIVITY_SECONDS, MAX_INACTIVITY_SECONDS].
    pub inactivity_threshold: i64,

    // ── Timelock configuration ───────────────────────────────────────────────
    /// Seconds the owner has to cancel after M-of-N approvals are collected.
    /// Bounded: [MIN_TIMELOCK_SECONDS, MAX_TIMELOCK_SECONDS].
    pub timelock_duration: i64,

    // ── Guardian configuration ───────────────────────────────────────────────
    pub guardian_threshold: u8,
    pub guardian_count: u8,

    // ── Beneficiary configuration ────────────────────────────────────────────
    pub beneficiary_count: u8,
    /// Sum of all active beneficiary share_bps. Must equal BPS_DENOMINATOR
    /// (10,000) before distribution can proceed.
    pub total_bps: u16,

    // ── Safety ───────────────────────────────────────────────────────────────
    pub panic_freeze: bool,
    pub frozen_by: Option<Pubkey>,
    pub frozen_at: Option<i64>,

    // ── Document commitment (latest document only; richer history via indexer) ─
    /// SHA-256 of the encrypted document ciphertext (hex encoded, 64 bytes).
    pub doc_hash: [u8; 64],
    /// Off-chain storage URI (Arweave/S3) of the encrypted document.
    pub doc_uri: [u8; 256],
    pub doc_updated_at: i64,

    // ── Optional arbiter ─────────────────────────────────────────────────────
    pub arbiter: Option<Pubkey>,

    // ── Counters ─────────────────────────────────────────────────────────────
    pub unlock_session_count: u32,
    pub distribution_nonce: u32,

    // ── Subscription ─────────────────────────────────────────────────────────
    pub subscription_tier: SubscriptionTier,

    // ── Future expansion padding ─────────────────────────────────────────────
    pub active_beneficiary_count: u16,
    pub _reserved: [u8; 62],
}

impl Vault {
    pub const SIZE: usize = VAULT_SPACE;

    /// Returns the guardian limit for this vault's current subscription tier.
    pub fn max_guardians(&self, global: &GlobalConfig) -> u8 {
        match self.subscription_tier {
            SubscriptionTier::Free       => global.max_guardians_free,
            SubscriptionTier::Pro        => global.max_guardians_pro,
            SubscriptionTier::Enterprise => global.max_guardians_enterprise,
        }
    }

    /// Returns the beneficiary limit for this vault's current subscription tier.
    pub fn max_beneficiaries(&self, global: &GlobalConfig) -> u8 {
        match self.subscription_tier {
            SubscriptionTier::Free       => global.max_beneficiaries_free,
            SubscriptionTier::Pro        => global.max_beneficiaries_pro,
            SubscriptionTier::Enterprise => global.max_beneficiaries_enterprise,
        }
    }

    /// True if the inactivity threshold has been reached relative to `now`.
    pub fn inactivity_threshold_met(&self, now: i64) -> bool {
        now >= self.last_check_in + self.inactivity_threshold
    }
}

// ─────────────────────────────────────────────────────────────────────────────

/// One entry per guardian per vault.
/// PDA seeds: [b"guardian", vault_pubkey, guardian_wallet]
#[account]
#[derive(Debug)]
pub struct GuardianEntry {
    pub vault: Pubkey,
    pub guardian_wallet: Pubkey,
    pub role: GuardianRole,
    pub status: GuardianStatus,
    pub added_at: i64,
    pub accepted_at: Option<i64>,
    pub removed_at: Option<i64>,
    pub bump: u8,
    pub _reserved: [u8; 16],
}

impl GuardianEntry {
    pub const SIZE: usize = GUARDIAN_ENTRY_SPACE;

    /// True if this guardian can approve unlock sessions (not a Delegate).
    pub fn can_approve(&self) -> bool {
        self.status == GuardianStatus::Active
            && self.role != GuardianRole::Delegate
    }

    /// True if this guardian can initiate an unlock session.
    pub fn can_initiate(&self) -> bool {
        self.can_approve()
    }
}

// ─────────────────────────────────────────────────────────────────────────────

/// One entry per beneficiary per vault.
/// PDA seeds: [b"beneficiary", vault_pubkey, beneficiary_wallet]
#[account]
#[derive(Debug)]
pub struct BeneficiaryEntry {
    pub vault: Pubkey,
    pub beneficiary_wallet: Pubkey,
    /// Share in basis points (0–10_000). All active entries must sum to 10_000.
    pub share_bps: u16,
    /// Only active beneficiaries participate in distribution.
    pub active: bool,
    pub added_at: i64,
    pub updated_at: i64,
    pub bump: u8,
    pub _reserved: [u8; 16],
}

impl BeneficiaryEntry {
    pub const SIZE: usize = BENEFICIARY_ENTRY_SPACE;
}

// ─────────────────────────────────────────────────────────────────────────────

/// Per-asset distribution rule for a specific beneficiary and mint.
/// PDA seeds: [b"asset_rule", vault_pubkey, beneficiary_wallet, mint_pubkey]
#[account]
#[derive(Debug)]
pub struct AssetRule {
    pub vault: Pubkey,
    pub beneficiary_wallet: Pubkey,
    /// The SPL token mint this rule applies to.
    pub mint: Pubkey,
    pub mode: AssetRuleMode,
    /// Only used when mode == FixedBps. Must be Some(v) where v > 0 && v <= 10_000.
    pub fixed_bps: Option<u16>,
    pub bump: u8,
    pub _reserved: [u8; 8],
}

impl AssetRule {
    pub const SIZE: usize = ASSET_RULE_SPACE;
}

// ─────────────────────────────────────────────────────────────────────────────

/// Allows a trusted wallet to submit check-ins on behalf of the vault owner.
/// PDA seeds: [b"delegate", vault_pubkey, delegate_wallet]
#[account]
#[derive(Debug)]
pub struct LivenessDelegate {
    pub vault: Pubkey,
    pub delegate_wallet: Pubkey,
    pub added_at: i64,
    pub active: bool,
    pub bump: u8,
}

impl LivenessDelegate {
    pub const SIZE: usize = LIVENESS_DELEGATE_SPACE;
}

// ─────────────────────────────────────────────────────────────────────────────

/// Represents a single unlock attempt. One active session per vault at a time.
/// PDA seeds: [b"unlock_session", vault_pubkey]
#[account]
#[derive(Debug)]
pub struct UnlockSession {
    pub vault: Pubkey,
    /// Guardian who initiated this session.
    pub initiated_by: Pubkey,
    pub status: UnlockSessionStatus,
    pub initiated_at: i64,
    /// Set when approval_count reaches guardian_threshold.
    pub approved_at: Option<i64>,
    pub timelock_started_at: Option<i64>,
    /// timelock_started_at + vault.timelock_duration
    pub timelock_ends_at: Option<i64>,
    pub executed_at: Option<i64>,
    pub cancelled_at: Option<i64>,
    pub approval_count: u8,
    pub bump: u8,
    pub _reserved: [u8; 16],
}

impl UnlockSession {
    pub const SIZE: usize = UNLOCK_SESSION_SPACE;

    /// True if the timelock window has elapsed relative to `now`.
    pub fn timelock_elapsed(&self, now: i64) -> bool {
        match self.timelock_ends_at {
            Some(ends_at) => now >= ends_at,
            None => false,
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────

/// Records a single guardian's approval of a specific unlock session.
/// Uniqueness of (unlock_session, guardian_wallet) prevents double-approvals.
/// PDA seeds: [b"approval", unlock_session_pubkey, guardian_wallet]
#[account]
#[derive(Debug)]
pub struct GuardianApproval {
    pub unlock_session: Pubkey,
    pub guardian_wallet: Pubkey,
    pub approved_at: i64,
    pub bump: u8,
}

impl GuardianApproval {
    pub const SIZE: usize = GUARDIAN_APPROVAL_SPACE;
}

// ─────────────────────────────────────────────────────────────────────────────

/// Tracks progress of SOL distribution across batches.
/// PDA seeds: [b"dist_sol", unlock_session_pubkey]
#[account]
#[derive(Debug)]
pub struct SolDistributionSession {
    pub unlock_session: Pubkey,
    pub vault: Pubkey,
    /// Total number of active beneficiaries at session init (determines total batches).
    pub total_beneficiaries: u8,
    /// Next beneficiary index to process (0-based). Advances by batch_size each call.
    pub cursor: u8,
    /// Vault authority SOL balance at session initialization (minus rent reserve).
    pub total_lamports: u64,
    /// Running total of lamports paid out so far.
    pub distributed_lamports: u64,
    pub initialized_at: i64,
    pub completed_at: Option<i64>,
    pub last_processed_pubkey: Option<Pubkey>,
    pub bump: u8,
    pub _reserved: [u8; 8],
}

impl SolDistributionSession {
    pub const SIZE: usize = SOL_DIST_SESSION_SPACE;

    pub fn is_complete(&self) -> bool {
        self.completed_at.is_some()
    }
}

// ─────────────────────────────────────────────────────────────────────────────

/// Tracks progress of SPL token distribution for a single mint across batches.
/// PDA seeds: [b"dist_spl", unlock_session_pubkey, mint_pubkey]
#[account]
#[derive(Debug)]
pub struct SplDistributionSession {
    pub unlock_session: Pubkey,
    pub vault: Pubkey,
    pub mint: Pubkey,
    pub total_beneficiaries: u8,
    pub cursor: u8,
    /// Vault token account balance at session initialization.
    pub total_amount: u64,
    pub distributed_amount: u64,
    /// If true, instruction creates missing beneficiary ATAs (increases compute + fee).
    pub create_missing_atas: bool,
    pub initialized_at: i64,
    pub completed_at: Option<i64>,
    pub last_processed_pubkey: Option<Pubkey>,
    pub bump: u8,
    pub _reserved: [u8; 8],
}

impl SplDistributionSession {
    pub const SIZE: usize = SPL_DIST_SESSION_SPACE;

    pub fn is_complete(&self) -> bool {
        self.completed_at.is_some()
    }
}

// ─────────────────────────────────────────────────────────────────────────────

/// Optional dispute blocking distribution finalization.
/// PDA seeds: [b"dispute", unlock_session_pubkey]
#[account]
#[derive(Debug)]
pub struct DisputeCase {
    pub unlock_session: Pubkey,
    pub vault: Pubkey,
    pub opened_by: Pubkey,
    pub status: DisputeStatus,
    pub opened_at: i64,
    pub resolved_at: Option<i64>,
    pub resolved_by: Option<Pubkey>,
    /// Hash of an off-chain resolution document.
    pub resolution_note_hash: Option<[u8; 64]>,
    pub bump: u8,
    pub _reserved: [u8; 16],
}

impl DisputeCase {
    pub const SIZE: usize = DISPUTE_CASE_SPACE;

    pub fn is_open(&self) -> bool {
        self.status == DisputeStatus::Open
    }
}

// ─────────────────────────────────────────────────────────────────────────────

/// On-chain subscription state. Controls per-tier hard limits.
/// PDA seeds: [b"subscription", vault_pubkey]
#[account]
#[derive(Debug)]
pub struct SubscriptionState {
    pub vault: Pubkey,
    pub owner: Pubkey,
    pub tier: SubscriptionTier,
    pub started_at: i64,
    pub expires_at: i64,
    pub auto_renew: bool,
    pub bump: u8,
    pub _reserved: [u8; 8],
}

impl SubscriptionState {
    pub const SIZE: usize = SUBSCRIPTION_STATE_SPACE;

    pub fn is_expired(&self, now: i64) -> bool {
        now > self.expires_at
    }
}

// ─────────────────────────────────────────────────────────────────────────────

/// Profile for a professional guardian (one per wallet, not per vault).
/// PDA seeds: [b"pro_guardian", guardian_wallet]
#[account]
#[derive(Debug)]
pub struct ProfessionalGuardianProfile {
    pub guardian_wallet: Pubkey,
    pub kyc_status: KycStatus,
    /// Reputation 0–10_000 (basis-points style; set by admin or future DAO).
    pub reputation_score: u16,
    pub total_vaults_served: u32,
    pub active_vault_count: u16,
    pub registered_at: i64,
    pub kyc_updated_at: Option<i64>,
    /// SHA-256 of the off-chain name string (privacy-preserving).
    pub name_hash: [u8; 64],
    /// URI to off-chain profile metadata JSON.
    pub profile_uri: [u8; 256],
    pub bump: u8,
    pub _reserved: [u8; 16],
}

impl ProfessionalGuardianProfile {
    pub const SIZE: usize = PRO_GUARDIAN_PROFILE_SPACE;

    pub fn is_kyc_verified(&self) -> bool {
        self.kyc_status == KycStatus::Verified
    }
}

// ─────────────────────────────────────────────────────────────────────────────

/// Bond posted by a professional guardian for a specific vault.
/// Slashable by admin on malicious behavior.
/// PDA seeds: [b"pro_bond", vault_pubkey, guardian_wallet]
#[account]
#[derive(Debug)]
pub struct ProfessionalGuardianBond {
    pub vault: Pubkey,
    pub guardian_wallet: Pubkey,
    pub bond_lamports: u64,
    pub bonded_at: i64,
    pub slashed: bool,
    pub slashed_at: Option<i64>,
    pub slash_reason_hash: Option<[u8; 64]>,
    pub bump: u8,
    pub _reserved: [u8; 8],
}

impl ProfessionalGuardianBond {
    pub const SIZE: usize = PRO_GUARDIAN_BOND_SPACE;
}

// ─────────────────────────────────────────────────────────────────────────────

#[account]
#[derive(Debug)]
pub struct MintRuleSet {
    pub vault: Pubkey,
    pub mint: Pubkey,
    pub entire_to: Option<Pubkey>,
    pub fixed_rules: Vec<(Pubkey, u16)>, // Up to 10 elements
    pub bump: u8,
    pub _reserved: [u8; 16],
}

impl MintRuleSet {
    pub const SIZE: usize = MINT_RULE_SET_SPACE;
}

#[account]
#[derive(Debug)]
pub struct OwnerState {
    pub owner: Pubkey,
    pub vault_count: u8,
    pub bump: u8,
    pub _reserved: [u8; 8],
}

impl OwnerState {
    pub const SIZE: usize = OWNER_STATE_SPACE;
}
