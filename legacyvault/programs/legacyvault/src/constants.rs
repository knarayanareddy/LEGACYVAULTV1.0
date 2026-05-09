/// ─── Basis points ────────────────────────────────────────────────────────────
pub const BPS_DENOMINATOR: u16 = 10_000;

/// ─── String / byte field size limits ────────────────────────────────────────
pub const MAX_NAME_LEN: usize  = 64;
pub const MAX_URI_LEN: usize   = 256;
pub const MAX_HASH_LEN: usize  = 64;   // hex-encoded SHA-256 (32 bytes → 64 hex chars)

/// ─── Subscription tier hard limits ──────────────────────────────────────────
pub const MAX_GUARDIANS_FREE:        u8 = 2;
pub const MAX_GUARDIANS_PRO:         u8 = 5;
pub const MAX_GUARDIANS_ENTERPRISE:  u8 = 20;

pub const MAX_BENEFICIARIES_FREE:        u8 = 2;
pub const MAX_BENEFICIARIES_PRO:         u8 = 10;
pub const MAX_BENEFICIARIES_ENTERPRISE:  u8 = 255;

pub const MAX_VAULTS_FREE:        u8 = 1;
pub const MAX_VAULTS_PRO:         u8 = 3;
pub const MAX_VAULTS_ENTERPRISE:  u8 = 255;

/// ─── Distribution batch defaults ─────────────────────────────────────────────
pub const DEFAULT_SOL_BATCH_SIZE:      u8 = 5;
pub const DEFAULT_SPL_BATCH_SIZE:      u8 = 5;
pub const SPL_BATCH_SIZE_WITH_ATA:     u8 = 3;

/// ─── Liveness bounds (seconds) ───────────────────────────────────────────────
pub const MIN_INACTIVITY_SECONDS: i64 = 60 * 60 * 24 * 30;   // 30 days
pub const MAX_INACTIVITY_SECONDS: i64 = 60 * 60 * 24 * 365;  // 365 days

/// ─── Timelock bounds (seconds) ───────────────────────────────────────────────
pub const MIN_TIMELOCK_SECONDS: i64 = 60 * 60 * 24 * 1;   // 1 day
pub const MAX_TIMELOCK_SECONDS: i64 = 60 * 60 * 24 * 90;  // 90 days

/// ─── Anchor account discriminator size ───────────────────────────────────────
const DISC: usize = 8;

/// ─── Primitive sizes ─────────────────────────────────────────────────────────
const PUBKEY:      usize = 32;
const U8:          usize = 1;
const U16:         usize = 2;
const U32:         usize = 4;
const U64:         usize = 8;
const I64:         usize = 8;
const BOOL:        usize = 1;
const ENUM1:       usize = 1; // single-variant enums stored as u8

// Option<T> occupies 1 (discriminant) + size_of(T)
const fn option(inner: usize) -> usize { 1 + inner }

/// ─── Account space constants ─────────────────────────────────────────────────

pub const GLOBAL_CONFIG_SPACE: usize =
    DISC          // anchor discriminator
    + PUBKEY      // admin
    + BOOL        // paused
    + PUBKEY      // fee_receiver
    + U64         // creation_fee_lamports
    + U64         // subscription_fee_pro_lamports
    + U64         // subscription_fee_enterprise_lamports
    + U8          // max_guardians_free
    + U8          // max_guardians_pro
    + U8          // max_guardians_enterprise
    + U8          // max_beneficiaries_free
    + U8          // max_beneficiaries_pro
    + U8          // max_beneficiaries_enterprise
    + U8;         // bump
// = 8 + 32 + 1 + 32 + 8 + 8 + 8 + 1 + 1 + 1 + 1 + 1 + 1 + 1 = 104

pub const VAULT_SPACE: usize =
    DISC
    + PUBKEY      // owner
    + U8          // vault_nonce
    + ENUM1       // status (VaultStatus)
    + U8          // bump
    + U8          // authority_bump
    + I64         // created_at
    + I64         // last_check_in
    + I64         // inactivity_threshold
    + I64         // timelock_duration
    + U8          // guardian_threshold
    + U8          // guardian_count
    + U8          // beneficiary_count
    + U16         // total_bps
    + BOOL        // panic_freeze
    + option(PUBKEY)  // frozen_by: Option<Pubkey>
    + option(I64)     // frozen_at:  Option<i64>
    + MAX_HASH_LEN    // doc_hash:  [u8; 64]
    + MAX_URI_LEN     // doc_uri:   [u8; 256]
    + I64             // doc_updated_at
    + option(PUBKEY)  // arbiter: Option<Pubkey>
    + U32             // unlock_session_count
    + U32             // distribution_nonce
    + ENUM1           // subscription_tier (SubscriptionTier)
    + 64;             // _reserved: [u8; 64]
// = 8+32+1+1+1+1+8+8+8+8+1+1+1+2+1+33+9+64+256+8+33+4+4+1+64 = 558

pub const GUARDIAN_ENTRY_SPACE: usize =
    DISC
    + PUBKEY      // vault
    + PUBKEY      // guardian_wallet
    + ENUM1       // role
    + ENUM1       // status
    + I64         // added_at
    + option(I64) // accepted_at
    + option(I64) // removed_at
    + U8          // bump
    + 16;         // _reserved
// = 8+32+32+1+1+8+9+9+1+16 = 117

pub const BENEFICIARY_ENTRY_SPACE: usize =
    DISC
    + PUBKEY   // vault
    + PUBKEY   // beneficiary_wallet
    + U16      // share_bps
    + BOOL     // active
    + I64      // added_at
    + I64      // updated_at
    + U8       // bump
    + 16;      // _reserved
// = 8+32+32+2+1+8+8+1+16 = 108

pub const ASSET_RULE_SPACE: usize =
    DISC
    + PUBKEY        // vault
    + PUBKEY        // beneficiary_wallet
    + PUBKEY        // mint
    + ENUM1         // mode
    + option(U16)   // fixed_bps: Option<u16>
    + U8            // bump
    + 8;            // _reserved
// = 8+32+32+32+1+3+1+8 = 117

pub const LIVENESS_DELEGATE_SPACE: usize =
    DISC
    + PUBKEY   // vault
    + PUBKEY   // delegate_wallet
    + I64      // added_at
    + BOOL     // active
    + U8;      // bump
// = 8+32+32+8+1+1 = 82

pub const UNLOCK_SESSION_SPACE: usize =
    DISC
    + PUBKEY      // vault
    + PUBKEY      // initiated_by
    + ENUM1       // status
    + I64         // initiated_at
    + option(I64) // approved_at
    + option(I64) // timelock_started_at
    + option(I64) // timelock_ends_at
    + option(I64) // executed_at
    + option(I64) // cancelled_at
    + U8          // approval_count
    + U8          // bump
    + 16;         // _reserved
// = 8+32+32+1+8+9+9+9+9+9+1+1+16 = 144

pub const GUARDIAN_APPROVAL_SPACE: usize =
    DISC
    + PUBKEY   // unlock_session
    + PUBKEY   // guardian_wallet
    + I64      // approved_at
    + U8;      // bump
// = 8+32+32+8+1 = 81

pub const SOL_DIST_SESSION_SPACE: usize =
    DISC
    + PUBKEY      // unlock_session
    + PUBKEY      // vault
    + U8          // total_beneficiaries
    + U8          // cursor
    + U64         // total_lamports
    + U64         // distributed_lamports
    + I64         // initialized_at
    + option(I64) // completed_at
    + option(PUBKEY) // last_processed_pubkey
    + U8          // bump
    + 8;          // _reserved

pub const SPL_DIST_SESSION_SPACE: usize =
    DISC
    + PUBKEY      // unlock_session
    + PUBKEY      // vault
    + PUBKEY      // mint
    + U8          // total_beneficiaries
    + U8          // cursor
    + U64         // total_amount
    + U64         // distributed_amount
    + BOOL        // create_missing_atas
    + I64         // initialized_at
    + option(I64) // completed_at
    + option(PUBKEY) // last_processed_pubkey
    + U8          // bump
    + 8;          // _reserved

pub const MINT_RULE_SET_SPACE: usize =
    DISC
    + PUBKEY        // vault
    + PUBKEY        // mint
    + option(PUBKEY) // entire_to
    + 4 + (PUBKEY + U16) * 10 // fixed_rules Vec with max 10 elements
    + U8            // bump
    + 16;           // reserved

pub const OWNER_STATE_SPACE: usize =
    DISC
    + PUBKEY        // owner
    + U8            // vault_count
    + U8            // bump
    + 8;            // reserved

pub const DISPUTE_CASE_SPACE: usize =
    DISC
    + PUBKEY         // unlock_session
    + PUBKEY         // vault
    + PUBKEY         // opened_by
    + ENUM1          // status
    + I64            // opened_at
    + option(I64)    // resolved_at
    + option(PUBKEY) // resolved_by
    + option(MAX_HASH_LEN) // resolution_note_hash: Option<[u8;64]>
    + U8             // bump
    + 16;            // _reserved
// = 8+32+32+32+1+8+9+33+65+1+16 = 237

pub const SUBSCRIPTION_STATE_SPACE: usize =
    DISC
    + PUBKEY   // vault
    + PUBKEY   // owner
    + ENUM1    // tier
    + I64      // started_at
    + I64      // expires_at
    + BOOL     // auto_renew
    + U8       // bump
    + 8;       // _reserved
// = 8+32+32+1+8+8+1+1+8 = 99

pub const PRO_GUARDIAN_PROFILE_SPACE: usize =
    DISC
    + PUBKEY        // guardian_wallet
    + ENUM1         // kyc_status
    + U16           // reputation_score
    + U32           // total_vaults_served
    + U16           // active_vault_count
    + I64           // registered_at
    + option(I64)   // kyc_updated_at
    + MAX_HASH_LEN  // name_hash: [u8; 64]
    + MAX_URI_LEN   // profile_uri: [u8; 256]
    + U8            // bump
    + 16;           // _reserved
// = 8+32+1+2+4+2+8+9+64+256+1+16 = 403

pub const PRO_GUARDIAN_BOND_SPACE: usize =
    DISC
    + PUBKEY            // vault
    + PUBKEY            // guardian_wallet
    + U64               // bond_lamports
    + I64               // bonded_at
    + BOOL              // slashed
    + option(I64)       // slashed_at
    + option(MAX_HASH_LEN) // slash_reason_hash: Option<[u8;64]>
    + U8                // bump
    + 8;                // _reserved
// = 8+32+32+8+8+1+9+65+1+8 = 172
