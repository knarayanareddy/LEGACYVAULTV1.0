# LegacyVault — masterdesigndoc.md (Single Source of Truth)
**Version:** 1.0 (production-grade end-to-end spec)  
**Date:** 2026-05-04  
**Purpose:** This document is the canonical spec for building LegacyVault as a complete product (protocol + apps + services). It includes: PDAs, Anchor structs, contexts, error codes, events, off-chain architecture, UX, security model, and a full execution plan.

> **Legal/Compliance disclaimer (non-negotiable):** LegacyVault is an automation and custody tool for digital assets. It is **not** legal advice, does not guarantee compliance with any jurisdiction’s estate/probate law, and does not claim to produce legally enforceable wills by itself. Users should consult licensed counsel. Product copy must reflect this.

---

## Table of contents
1. Product summary
2. Product principles & requirements (full build)
3. Actors & trust model
4. End-to-end user experience (Owner / Guardian / Beneficiary / Professional)
5. System architecture (on-chain + off-chain + storage + indexer)
6. On-chain protocol specification (Anchor)
   - Canonical PDAs / seeds
   - Account model (exact structs)
   - Instruction set (complete)
   - Anchor contexts (exact `#[derive(Accounts)]`)
   - Remaining-accounts conventions (distribution batching)
   - Error codes (exact)
   - Events (exact)
   - Invariants & state machines
7. Off-chain services
8. Data storage & schemas
9. Security & threat model (deep)
10. Testing strategy (protocol + backend + UX)
11. Deployment & operations
12. Roadmap / execution plan (phases, not hackathon)

---

# 1) Product summary
LegacyVault is a Solana-native “digital estate executor” that lets a user (Owner) create a programmable inheritance plan for their digital assets, backed by an on-chain vault and a multi-party, time-delayed unlock process.

**Core capabilities (full build):**
- Vault-based custody for:
  - SOL
  - SPL tokens (including Token-2022)
  - NFTs (SPL token accounts with supply=1; optionally Metaplex metadata references)
  - “Position tokens” (LP receipt tokens, liquid staking tokens, yield vault shares) as SPL
- Inheritance plan:
  - Beneficiaries + shares (bps)
  - Per-asset rules (optional overrides)
  - Guardians + threshold (M-of-N)
  - Liveness / heartbeat rules (Owner check-ins)
  - Inactivity threshold + timelock delay
  - Optional disputes / arbitration hooks
- Safety features:
  - Owner override / cancel unlock
  - Mandatory timelock after approvals
  - Panic freeze
  - Guardian approval audit trail
- Product features:
  - Encrypted document storage (letters of intent, legal docs) with on-chain hash anchoring
  - Notifications and monitoring (email/SMS/push/Wallet notifications)
  - Professional guardian network (optional) with bonding + reputation
  - Subscription plans (optional) with on-chain renewal state

---

# 2) Product principles & requirements (full build)

## 2.1 Non-negotiable principles
1. **Safety over convenience**: false positives must be reversible and slow; theft must be hard.
2. **Deterministic execution**: distribution rules must be on-chain verifiable and replayable.
3. **Least trust**: off-chain services can assist UX but must not be required to custody or finalize distribution.
4. **Transparency**: every step emits events; indexers reconstruct full audit trails.
5. **Compute-aware**: distributions must be chunked to avoid compute limits.

## 2.2 Full build requirements
### Vault & assets
- Deposit/withdraw SOL and SPL
- Vault ATA per mint (owned by a PDA)
- Maintain an “asset registry” on-chain and/or via PDA discovery

### Estate plan
- Beneficiary list + total shares = 10,000 bps
- Per-beneficiary metadata label
- Per-asset overrides:
  - pro-rata by shares (default)
  - assign entire asset to a single beneficiary
  - “split by fixed bps” per asset (optional)

### Unlock process
- Inactivity-based initiation
- Guardian approvals (M-of-N)
- Timelock delay
- Owner override/cancellation
- Dispute flow with optional arbitration

### Monitoring / liveness
- Owner check-in
- Optional delegated liveness key(s)
- Optional “multi-channel check-in” (wallet signature + email OTP) off-chain to reduce false positives

### Documents
- Client-side encryption of docs
- Store URI off-chain (Arweave/Shadow Drive/S3)
- Store hash + metadata on-chain
- Optional attestation pointer (external attestation program integration)

### Professional guardian network (optional but in-scope for full build)
- Guardian profiles (KYC status off-chain)
- Guardian bond / stake (on-chain escrow)
- Selection by owners
- Reputation events + slashing hooks (requires dispute mechanism)

### Subscription / billing (optional but in-scope)
- On-chain subscription state controls premium features:
  - number of vaults
  - number of guardians
  - professional guardian access
  - advanced notifications
  - doc storage quotas (off-chain enforced)

---

# 3) Actors & trust model

## 3.1 Actors
- **Owner**: creates vault, deposits assets, configures guardians/beneficiaries, checks in.
- **Guardian**: approves unlock when inactivity threshold passed; may be friend/family/lawyer/professional.
- **Beneficiary**: receives distributed assets.
- **Professional Guardian**: registered, bonded guardian offering services for a fee.
- **Arbiter (optional)**: resolves disputes and triggers slashing/cancellation actions.

## 3.2 Trust assumptions
- The protocol assumes the Owner chooses trustworthy guardians (or uses bonded professionals).
- The protocol assumes off-chain notification services can fail; on-chain execution must still be possible.
- The protocol does not assume any centralized service is online for funds to move after vault setup.

---

# 4) End-to-end UX (full build)

## 4.1 Owner UX — onboarding
1. Connect wallet
2. Create Vault:
   - choose heartbeat interval (e.g., 30 days)
   - choose inactivity threshold (e.g., 90 days)
   - choose timelock (e.g., 30 days)
   - choose security options:
     - allow liveness delegates? (Y/N)
     - enable panic freeze? (Y/N)
3. Add beneficiaries:
   - add wallet addresses + share %
   - validate shares sum to 100%
   - optional labels (e.g., “Spouse”, “Sibling”)
4. Add guardians:
   - add addresses OR invite via email to connect wallet
   - choose threshold (e.g., 2-of-3)
   - optional: choose a professional guardian from marketplace
5. Deposit assets:
   - “asset inventory” view with import from wallet
   - deposits SOL/SPL/NFTs into vault
6. Upload documents:
   - letter of intent
   - optional legal doc PDF
   - encrypt client-side, upload, store hash + URI on-chain
7. Activate monitoring:
   - show next check-in date
   - configure notification channels

## 4.2 Owner UX — routine
- “Check in” button (wallet signature)
- View vault health:
  - last check-in
  - inactivity deadline
  - whether any unlock session exists
- Manage:
  - update guardians/beneficiaries
  - add/remove assets
  - withdraw assets (only when safe)
  - update document versions (hash changes)

## 4.3 Guardian UX
- Guardian dashboard:
  - vaults you guard
  - for each: status, last check-in, eligible date for unlock
- When eligible:
  - “Initiate unlock” (creates unlock session)
  - “Approve unlock” (adds approval)
- Guardian transparency:
  - approvals list
  - timelock countdown
  - immutable event trail

## 4.4 Beneficiary UX
- Beneficiary dashboard:
  - vaults where you are beneficiary
  - expected share ranges (estimates)
  - when distribution executed: assets received + receipts (events)

## 4.5 Professional guardian UX
- Create guardian profile
- Undergo KYC (off-chain)
- Bond stake on-chain
- Receive invitations / requests
- Earn fees (off-chain invoicing or on-chain fee split if implemented)

---

# 5) System architecture

## 5.1 On-chain (Anchor program: `legacyvault`)
Single Anchor program (monorepo) with modules:
- vault creation & settings
- beneficiary registry (per-entry PDAs)
- guardian registry (per-entry PDAs)
- asset rules (per-mint PDAs)
- deposits & withdrawals
- liveness check-ins & delegates
- unlock sessions + approvals
- distribution sessions (chunked execution)
- disputes & slashing hooks (optional)
- subscription state (optional)
- professional guardian profiles + bonds (optional)

## 5.2 Off-chain services
1. **API Gateway**
   - auth/session (wallet-based SIWS: “Sign-in with Solana”)
   - vault metadata
   - notifications configuration
   - document upload orchestration
2. **Indexer**
   - listens to program logs/events
   - populates read models (vault status timelines)
3. **Notifier**
   - email/SMS/push
   - guardian invites
   - check-in reminders
   - unlock initiated alerts
4. **Doc Service**
   - encryption happens client-side
   - service provides pre-signed upload URLs + pinning
5. **KYC Provider Adapter** (optional)
   - for professional guardians / institutional plans
6. **Automation Worker**
   - suggests transactions:
     - when vault becomes unlock-eligible
     - batched distribution execution
   - never holds private keys (runs as “assistant”, not a custodian)

## 5.3 Storage
- Postgres (core app)
- Redis (caches, rate limits)
- Off-chain object storage (Arweave / Shadow Drive / S3)
- Analytics warehouse (optional)

---

# 6) On-chain protocol specification (Anchor)

## 6.1 Canonical PDAs / seed conventions
All seeds are canonical and must be identical across program + SDKs.

```rust
CONFIG_SEED         = b"config"

VAULT_SEED          = b"vault"        + owner_pubkey + vault_id_le_u64
VAULT_AUTH_SEED     = b"vault_auth"   + vault_pubkey

BENEFICIARY_SEED    = b"beneficiary"  + vault_pubkey + beneficiary_pubkey
GUARDIAN_SEED       = b"guardian"     + vault_pubkey + guardian_pubkey

ASSET_RULE_SEED     = b"asset_rule"   + vault_pubkey + mint_pubkey

LIVENESS_DELEGATE_SEED = b"delegate"  + vault_pubkey + delegate_pubkey

UNLOCK_SEED         = b"unlock"       + vault_pubkey + nonce_le_u64
APPROVAL_SEED       = b"approval"     + unlock_pubkey + guardian_pubkey

DIST_SOL_SEED       = b"dist_sol"     + unlock_pubkey
DIST_SPL_SEED       = b"dist_spl"     + unlock_pubkey + mint_pubkey

DISPUTE_SEED        = b"dispute"      + unlock_pubkey

SUBSCRIPTION_SEED   = b"sub"          + vault_pubkey

GUARDIAN_PROFILE_SEED = b"g_profile"  + guardian_pubkey
GUARDIAN_BOND_SEED    = b"g_bond"     + guardian_pubkey
6.2 Program constants
Rust

BPS_DENOMINATOR: u16 = 10_000

MAX_LABEL_LEN: usize = 16
DOC_URI_MAX: usize = 200

// Hard caps to keep accounts bounded.
// NOTE: In full build, we use per-entry PDAs, so these caps are mostly UI-side.
MAX_BENEFICIARIES_HINT: u16 = 100
MAX_GUARDIANS_HINT: u16 = 50
6.3 Exact Anchor state (structs)
These structs are intended to be used verbatim in programs/legacyvault/src/state.rs.

Rust

use anchor_lang::prelude::*;

#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum VaultStatus {
    Active = 0,
    Unlocking = 1,
    Distributed = 2,
    Frozen = 3,
    Closed = 4,
}

#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum UnlockStatus {
    Proposed = 0,
    Approved = 1,
    Cancelled = 2,
    Disputed = 3,
    Executing = 4,
    Executed = 5,
}

#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum AssetRuleMode {
    ProRata = 0,         // default: split by beneficiary shares
    AssignAll = 1,       // send entire balance to one beneficiary
    CustomSplits = 2,    // per-asset split table (optional, v2)
}

#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum GuardianRole {
    Personal = 0,
    Professional = 1,
}

#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum DisputeStatus {
    Open = 0,
    ResolvedCancel = 1,
    ResolvedProceed = 2,
}

#[account]
pub struct GlobalConfig {
    pub admin: Pubkey,
    pub paused: bool,

    pub treasury: Pubkey,          // receives fees (SOL or USDC via ATA elsewhere)
    pub create_fee_lamports: u64,  // anti-spam fee

    // bounds
    pub min_heartbeat_secs: u32,
    pub max_heartbeat_secs: u32,
    pub min_inactivity_secs: u32,
    pub max_inactivity_secs: u32,
    pub min_timelock_secs: u32,
    pub max_timelock_secs: u32,

    // optional: arbiter authority for disputes
    pub arbiter: Pubkey,

    pub version: u16,
}

impl GlobalConfig {
    pub const LEN: usize =
        8 + 32 + 1 + 32 + 8 + (4 * 6) + 32 + 2;
}

#[account]
pub struct Vault {
    pub vault_id: u64,
    pub owner: Pubkey,

    pub created_at_unix: i64,

    // liveness
    pub last_checkin_unix: i64,
    pub heartbeat_interval_secs: u32,
    pub inactivity_threshold_secs: u32,

    // unlock safety
    pub timelock_secs: u32,
    pub status: VaultStatus,

    // guardian policy
    pub guardian_threshold: u8,   // M
    pub guardians_count: u16,     // N (informational; derived off-chain too)

    // beneficiary policy
    pub beneficiaries_count: u16, // informational

    // unlock sessions
    pub current_nonce: u64,       // increments per unlock cycle

    // panic/freeze
    pub panic_enabled: bool,

    // document anchor
    pub doc_hash: [u8; 32],
    pub doc_uri_len: u16,
    pub doc_uri: [u8; 200],

    pub bump: u8,
}

impl Vault {
    pub const DOC_URI_MAX: usize = 200;
    pub const LEN: usize =
        8 +  // disc
        8 +  // vault_id
        32 + // owner
        8 +  // created_at
        8 +  // last_checkin
        4 +  // heartbeat
        4 +  // inactivity
        4 +  // timelock
        1 +  // status
        1 +  // guardian_threshold
        2 +  // guardians_count
        2 +  // beneficiaries_count
        8 +  // current_nonce
        1 +  // panic_enabled
        32 + // doc_hash
        2 +  // doc_uri_len
        200 +// doc_uri
        1;   // bump
}

#[account]
pub struct GuardianEntry {
    pub vault: Pubkey,
    pub guardian: Pubkey,
    pub role: GuardianRole,
    pub added_at_unix: i64,
    pub active: bool,
}

impl GuardianEntry {
    pub const LEN: usize = 8 + 32 + 32 + 1 + 8 + 1;
}

#[account]
pub struct BeneficiaryEntry {
    pub vault: Pubkey,
    pub beneficiary: Pubkey,

    pub share_bps: u16,
    pub label: [u8; 16],

    pub added_at_unix: i64,
    pub active: bool,
}

impl BeneficiaryEntry {
    pub const LEN: usize = 8 + 32 + 32 + 2 + 16 + 8 + 1;
}

#[account]
pub struct AssetRule {
    pub vault: Pubkey,
    pub mint: Pubkey,

    pub mode: AssetRuleMode,

    // AssignAll target
    pub assigned_beneficiary: Pubkey,

    pub updated_at_unix: i64,
}

impl AssetRule {
    pub const LEN: usize = 8 + 32 + 32 + 1 + 32 + 8;
}

#[account]
pub struct LivenessDelegate {
    pub vault: Pubkey,
    pub delegate: Pubkey,
    pub added_at_unix: i64,
    pub active: bool,
}

impl LivenessDelegate {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 1;
}

#[account]
pub struct UnlockSession {
    pub vault: Pubkey,
    pub nonce: u64,

    pub status: UnlockStatus,

    pub initiated_by: Pubkey,
    pub initiated_at_unix: i64,

    pub approvals: u16,
    pub threshold: u8,

    pub approved_at_unix: i64,     // set when approvals reach threshold
    pub executable_at_unix: i64,   // approved_at + timelock

    // distribution flags
    pub sol_done: bool,

    pub bump: u8,
}

impl UnlockSession {
    pub const LEN: usize =
        8 + 32 + 8 + 1 + 32 + 8 + 2 + 1 + 8 + 8 + 1 + 1;
}

#[account]
pub struct GuardianApproval {
    pub unlock: Pubkey,
    pub guardian: Pubkey,
    pub approved_at_unix: i64,
}

impl GuardianApproval {
    pub const LEN: usize = 8 + 32 + 32 + 8;
}

#[account]
pub struct DistributionSplSession {
    pub unlock: Pubkey,
    pub mint: Pubkey,

    // cursor for batching beneficiaries (index in sorted beneficiary list)
    pub cursor: u32,

    // total vault balance snapshot (optional; can recompute from token account)
    pub initialized_at_unix: i64,
    pub done: bool,

    pub bump: u8,
}

impl DistributionSplSession {
    pub const LEN: usize = 8 + 32 + 32 + 4 + 8 + 1 + 1;
}

#[account]
pub struct DisputeCase {
    pub unlock: Pubkey,
    pub opened_by: Pubkey,
    pub opened_at_unix: i64,
    pub status: DisputeStatus,
    pub note_hash: [u8; 32],
}

impl DisputeCase {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 1 + 32;
}

#[account]
pub struct Subscription {
    pub vault: Pubkey,
    pub plan_id: u8,              // 0=free, 1=standard, 2=pro
    pub valid_until_unix: i64,    // 0 means free/none
    pub updated_at_unix: i64,
}

impl Subscription {
    pub const LEN: usize = 8 + 32 + 1 + 8 + 8;
}

#[account]
pub struct GuardianProfile {
    pub guardian: Pubkey,
    pub display_name: [u8; 32],
    pub website_uri: [u8; 100],
    pub kyc_level: u8,            // 0=none,1=basic,2=verified (set off-chain; anchored via admin)
    pub active: bool,
    pub updated_at_unix: i64,
}

impl GuardianProfile {
    pub const LEN: usize = 8 + 32 + 32 + 100 + 1 + 1 + 8;
}

#[account]
pub struct GuardianBond {
    pub guardian: Pubkey,
    pub bond_vault: Pubkey,       // token account or SOL PDA depending on implementation
    pub amount: u64,
    pub locked: bool,
    pub updated_at_unix: i64,
}

impl GuardianBond {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 1 + 8;
}
6.4 Instruction set (complete)
Admin / protocol
initialize_config(...)
set_paused(bool)
set_arbiter(pubkey)
set_fees(create_fee_lamports)
set_bounds(...)
Vault lifecycle
create_vault(vault_id, heartbeat_interval_secs, inactivity_threshold_secs, timelock_secs, panic_enabled)
close_vault() (requires distributed or empty; optional)
Guardians
add_guardian(guardian_pubkey, role)
remove_guardian(guardian_pubkey)
set_guardian_threshold(m: u8)
Beneficiaries
add_beneficiary(beneficiary_pubkey, share_bps, label)
update_beneficiary(beneficiary_pubkey, share_bps, label, active)
remove_beneficiary(beneficiary_pubkey)
assert_beneficiary_total_10k() (optional strict check instruction)
Asset rules
set_asset_rule(mint, mode, assigned_beneficiary)
clear_asset_rule(mint)
Deposits / withdrawals (Owner-only, while safe)
deposit_sol(lamports)
withdraw_sol(lamports) (only if vault Active and no UnlockSession in progress)
deposit_spl(amount) (mint provided in accounts)
withdraw_spl(amount) (only if vault Active and no UnlockSession in progress)
Documents
set_document(doc_hash, doc_uri_bytes)
Liveness
check_in() (Owner)
add_liveness_delegate(delegate_pubkey)
remove_liveness_delegate(delegate_pubkey)
delegate_check_in() (Delegate signer)
Unlock & approvals
initiate_unlock() (Guardian signer; requires inactivity threshold reached)
approve_unlock() (Guardian signer; one approval per guardian)
cancel_unlock() (Owner signer; sets session cancelled and vault Active)
panic_freeze() (Owner signer; sets vault Frozen)
unfreeze() (Owner signer; returns to Active if safe)
Disputes / arbitration (optional but specified)
open_dispute(note_hash) (Owner or Guardian; sets unlock Disputed)
resolve_dispute_cancel() (Arbiter; cancels unlock, vault Active)
resolve_dispute_proceed() (Arbiter; returns unlock Approved state)
Distribution (chunked)
execute_distribution_sol_batch(start_index: u32, batch_size: u16)
init_distribution_spl_session(mint) (creates DistributionSplSession PDA)
execute_distribution_spl_batch(start_index: u32, batch_size: u16) (for a specific mint)
finalize_unlock() (marks UnlockSession Executed; vault Distributed)
Subscription (optional)
set_subscription(plan_id, valid_until_unix) (admin or authorized billing signer)
renew_subscription(plan_id, add_secs) (user pays off-chain; on-chain updates)
Professional guardian network (optional)
register_guardian_profile(display_name, website_uri)
set_guardian_kyc_level(guardian, level) (admin)
create_guardian_bond(amount) (guardian deposits bond)
lock_guardian_bond() / unlock_guardian_bond() (admin or arbiter)
slash_guardian_bond(amount) (arbiter)
6.5 Anchor contexts (exact #[derive(Accounts)])
These contexts are intended to be used verbatim in programs/legacyvault/src/lib.rs. Token account constraints assume SPL Token v1. For Token-2022, add parallel contexts using the Token-2022 program id where needed.

Rust

use anchor_lang::prelude::*;
use anchor_spl::{
  associated_token::AssociatedToken,
  token::{self, Mint, Token, TokenAccount, Transfer},
};

use crate::state::*;
use crate::errors::LegacyVaultError;
use crate::constants::*;

pub const CONFIG_SEED: &[u8] = b"config";
pub const VAULT_SEED: &[u8] = b"vault";
pub const VAULT_AUTH_SEED: &[u8] = b"vault_auth";
pub const BENEFICIARY_SEED: &[u8] = b"beneficiary";
pub const GUARDIAN_SEED: &[u8] = b"guardian";
pub const ASSET_RULE_SEED: &[u8] = b"asset_rule";
pub const LIVENESS_DELEGATE_SEED: &[u8] = b"delegate";
pub const UNLOCK_SEED: &[u8] = b"unlock";
pub const APPROVAL_SEED: &[u8] = b"approval";
pub const DIST_SPL_SEED: &[u8] = b"dist_spl";
pub const DISPUTE_SEED: &[u8] = b"dispute";
pub const SUBSCRIPTION_SEED: &[u8] = b"sub";
pub const GUARDIAN_PROFILE_SEED: &[u8] = b"g_profile";
pub const GUARDIAN_BOND_SEED: &[u8] = b"g_bond";

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
  #[account(
    init,
    payer = admin,
    space = GlobalConfig::LEN,
    seeds = [CONFIG_SEED],
    bump
  )]
  pub config: Account<'info, GlobalConfig>,

  #[account(mut)]
  pub admin: Signer<'info>,

  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetPaused<'info> {
  #[account(mut, seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,
  pub admin: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(vault_id: u64)]
pub struct CreateVault<'info> {
  #[account(seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,

  #[account(
    init,
    payer = owner,
    space = Vault::LEN,
    seeds = [VAULT_SEED, owner.key().as_ref(), &vault_id.to_le_bytes()],
    bump
  )]
  pub vault: Account<'info, Vault>,

  /// CHECK: PDA authority for vault token accounts
  #[account(
    seeds = [VAULT_AUTH_SEED, vault.key().as_ref()],
    bump
  )]
  pub vault_auth: UncheckedAccount<'info>,

  #[account(mut)]
  pub owner: Signer<'info>,

  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetDocument<'info> {
  #[account(seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,

  #[account(mut)]
  pub vault: Account<'info, Vault>,

  pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct AddGuardian<'info> {
  #[account(seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,

  #[account(mut)]
  pub vault: Account<'info, Vault>,

  #[account(
    init,
    payer = owner,
    space = GuardianEntry::LEN,
    seeds = [GUARDIAN_SEED, vault.key().as_ref(), guardian.key().as_ref()],
    bump
  )]
  pub guardian_entry: Account<'info, GuardianEntry>,

  /// CHECK: guardian pubkey (not signer)
  pub guardian: UncheckedAccount<'info>,

  pub owner: Signer<'info>,
  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RemoveGuardian<'info> {
  #[account(seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,

  #[account(mut)]
  pub vault: Account<'info, Vault>,

  #[account(
    mut,
    seeds = [GUARDIAN_SEED, vault.key().as_ref(), guardian.key().as_ref()],
    bump,
    close = owner
  )]
  pub guardian_entry: Account<'info, GuardianEntry>,

  /// CHECK
  pub guardian: UncheckedAccount<'info>,

  pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetGuardianThreshold<'info> {
  #[account(seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,
  #[account(mut)]
  pub vault: Account<'info, Vault>,
  pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct AddBeneficiary<'info> {
  #[account(seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,

  #[account(mut)]
  pub vault: Account<'info, Vault>,

  #[account(
    init,
    payer = owner,
    space = BeneficiaryEntry::LEN,
    seeds = [BENEFICIARY_SEED, vault.key().as_ref(), beneficiary.key().as_ref()],
    bump
  )]
  pub beneficiary_entry: Account<'info, BeneficiaryEntry>,

  /// CHECK: beneficiary pubkey (not signer)
  pub beneficiary: UncheckedAccount<'info>,

  pub owner: Signer<'info>,
  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateBeneficiary<'info> {
  #[account(seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,

  #[account(mut)]
  pub vault: Account<'info, Vault>,

  #[account(
    mut,
    seeds = [BENEFICIARY_SEED, vault.key().as_ref(), beneficiary.key().as_ref()],
    bump
  )]
  pub beneficiary_entry: Account<'info, BeneficiaryEntry>,

  /// CHECK
  pub beneficiary: UncheckedAccount<'info>,

  pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct RemoveBeneficiary<'info> {
  #[account(seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,
  #[account(mut)]
  pub vault: Account<'info, Vault>,

  #[account(
    mut,
    seeds = [BENEFICIARY_SEED, vault.key().as_ref(), beneficiary.key().as_ref()],
    bump,
    close = owner
  )]
  pub beneficiary_entry: Account<'info, BeneficiaryEntry>,

  /// CHECK
  pub beneficiary: UncheckedAccount<'info>,

  pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetAssetRule<'info> {
  #[account(seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,

  #[account(mut)]
  pub vault: Account<'info, Vault>,

  pub mint: Account<'info, Mint>,

  #[account(
    init_if_needed,
    payer = owner,
    space = AssetRule::LEN,
    seeds = [ASSET_RULE_SEED, vault.key().as_ref(), mint.key().as_ref()],
    bump
  )]
  pub asset_rule: Account<'info, AssetRule>,

  /// CHECK: only used if mode AssignAll
  pub assigned_beneficiary: UncheckedAccount<'info>,

  pub owner: Signer<'info>,
  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositSol<'info> {
  #[account(seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,
  #[account(mut)]
  pub vault: Account<'info, Vault>,
  #[account(mut)]
  pub owner: Signer<'info>,
  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawSol<'info> {
  #[account(seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,
  #[account(mut)]
  pub vault: Account<'info, Vault>,
  #[account(mut)]
  pub owner: Signer<'info>,
  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositSpl<'info> {
  #[account(seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,

  #[account(mut)]
  pub vault: Account<'info, Vault>,

  /// CHECK: PDA authority for vault token accounts
  #[account(
    seeds = [VAULT_AUTH_SEED, vault.key().as_ref()],
    bump
  )]
  pub vault_auth: UncheckedAccount<'info>,

  pub mint: Account<'info, Mint>,

  #[account(mut)]
  pub owner: Signer<'info>,

  #[account(
    mut,
    associated_token::mint = mint,
    associated_token::authority = owner
  )]
  pub owner_ata: Account<'info, TokenAccount>,

  #[account(
    init_if_needed,
    payer = owner,
    associated_token::mint = mint,
    associated_token::authority = vault_auth
  )]
  pub vault_ata: Account<'info, TokenAccount>,

  pub token_program: Program<'info, Token>,
  pub associated_token_program: Program<'info, AssociatedToken>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct WithdrawSpl<'info> {
  #[account(seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,

  #[account(mut)]
  pub vault: Account<'info, Vault>,

  /// CHECK: PDA authority for vault token accounts
  #[account(
    seeds = [VAULT_AUTH_SEED, vault.key().as_ref()],
    bump
  )]
  pub vault_auth: UncheckedAccount<'info>,

  pub mint: Account<'info, Mint>,

  #[account(mut)]
  pub owner: Signer<'info>,

  #[account(
    init_if_needed,
    payer = owner,
    associated_token::mint = mint,
    associated_token::authority = owner
  )]
  pub owner_ata: Account<'info, TokenAccount>,

  #[account(
    mut,
    associated_token::mint = mint,
    associated_token::authority = vault_auth
  )]
  pub vault_ata: Account<'info, TokenAccount>,

  pub token_program: Program<'info, Token>,
  pub associated_token_program: Program<'info, AssociatedToken>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CheckIn<'info> {
  #[account(seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,
  #[account(mut)]
  pub vault: Account<'info, Vault>,
  pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct AddLivenessDelegate<'info> {
  #[account(seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,
  #[account(mut)]
  pub vault: Account<'info, Vault>,

  #[account(
    init,
    payer = owner,
    space = LivenessDelegate::LEN,
    seeds = [LIVENESS_DELEGATE_SEED, vault.key().as_ref(), delegate.key().as_ref()],
    bump
  )]
  pub delegate_entry: Account<'info, LivenessDelegate>,

  /// CHECK
  pub delegate: UncheckedAccount<'info>,

  pub owner: Signer<'info>,
  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RemoveLivenessDelegate<'info> {
  #[account(seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,
  #[account(mut)]
  pub vault: Account<'info, Vault>,

  #[account(
    mut,
    seeds = [LIVENESS_DELEGATE_SEED, vault.key().as_ref(), delegate.key().as_ref()],
    bump,
    close = owner
  )]
  pub delegate_entry: Account<'info, LivenessDelegate>,

  /// CHECK
  pub delegate: UncheckedAccount<'info>,

  pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct DelegateCheckIn<'info> {
  #[account(seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,
  #[account(mut)]
  pub vault: Account<'info, Vault>,

  #[account(
    seeds = [LIVENESS_DELEGATE_SEED, vault.key().as_ref(), delegate.key().as_ref()],
    bump
  )]
  pub delegate_entry: Account<'info, LivenessDelegate>,

  pub delegate: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitiateUnlock<'info> {
  #[account(seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,

  #[account(mut)]
  pub vault: Account<'info, Vault>,

  #[account(
    seeds = [GUARDIAN_SEED, vault.key().as_ref(), guardian.key().as_ref()],
    bump
  )]
  pub guardian_entry: Account<'info, GuardianEntry>,

  #[account(
    init,
    payer = guardian,
    space = UnlockSession::LEN,
    seeds = [UNLOCK_SEED, vault.key().as_ref(), &(vault.current_nonce.wrapping_add(1)).to_le_bytes()],
    bump
  )]
  pub unlock: Account<'info, UnlockSession>,

  #[account(mut)]
  pub guardian: Signer<'info>,

  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ApproveUnlock<'info> {
  #[account(seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,

  #[account(mut)]
  pub vault: Account<'info, Vault>,

  #[account(
    seeds = [GUARDIAN_SEED, vault.key().as_ref(), guardian.key().as_ref()],
    bump
  )]
  pub guardian_entry: Account<'info, GuardianEntry>,

  #[account(mut)]
  pub unlock: Account<'info, UnlockSession>,

  #[account(
    init,
    payer = guardian,
    space = GuardianApproval::LEN,
    seeds = [APPROVAL_SEED, unlock.key().as_ref(), guardian.key().as_ref()],
    bump
  )]
  pub approval: Account<'info, GuardianApproval>,

  #[account(mut)]
  pub guardian: Signer<'info>,

  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelUnlock<'info> {
  #[account(seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,
  #[account(mut)]
  pub vault: Account<'info, Vault>,
  #[account(mut)]
  pub unlock: Account<'info, UnlockSession>,
  pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct PanicFreeze<'info> {
  #[account(seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,
  #[account(mut)]
  pub vault: Account<'info, Vault>,
  pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct Unfreeze<'info> {
  #[account(seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,
  #[account(mut)]
  pub vault: Account<'info, Vault>,
  pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct OpenDispute<'info> {
  #[account(seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,

  #[account(mut)]
  pub vault: Account<'info, Vault>,

  #[account(mut)]
  pub unlock: Account<'info, UnlockSession>,

  #[account(
    init_if_needed,
    payer = opener,
    space = DisputeCase::LEN,
    seeds = [DISPUTE_SEED, unlock.key().as_ref()],
    bump
  )]
  pub dispute: Account<'info, DisputeCase>,

  #[account(mut)]
  pub opener: Signer<'info>,

  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
  #[account(seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,

  #[account(mut)]
  pub vault: Account<'info, Vault>,

  #[account(mut)]
  pub unlock: Account<'info, UnlockSession>,

  #[account(mut, seeds = [DISPUTE_SEED, unlock.key().as_ref()], bump)]
  pub dispute: Account<'info, DisputeCase>,

  pub arbiter: Signer<'info>,
}

#[derive(Accounts)]
pub struct ExecuteDistributionSolBatch<'info> {
  #[account(seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,

  #[account(mut)]
  pub vault: Account<'info, Vault>,

  #[account(mut)]
  pub unlock: Account<'info, UnlockSession>,

  // Remaining accounts convention (see section 6.6):
  // [beneficiary_entry_0, beneficiary_wallet_0, beneficiary_entry_1, beneficiary_wallet_1, ...]
  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitDistributionSplSession<'info> {
  #[account(seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,
  #[account(mut)]
  pub vault: Account<'info, Vault>,
  #[account(mut)]
  pub unlock: Account<'info, UnlockSession>,

  pub mint: Account<'info, Mint>,

  #[account(
    init,
    payer = payer,
    space = DistributionSplSession::LEN,
    seeds = [DIST_SPL_SEED, unlock.key().as_ref(), mint.key().as_ref()],
    bump
  )]
  pub dist_spl: Account<'info, DistributionSplSession>,

  #[account(mut)]
  pub payer: Signer<'info>,
  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteDistributionSplBatch<'info> {
  #[account(seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,

  #[account(mut)]
  pub vault: Account<'info, Vault>,

  /// CHECK: PDA authority for vault token accounts
  #[account(
    seeds = [VAULT_AUTH_SEED, vault.key().as_ref()],
    bump
  )]
  pub vault_auth: UncheckedAccount<'info>,

  #[account(mut)]
  pub unlock: Account<'info, UnlockSession>,

  pub mint: Account<'info, Mint>,

  #[account(mut, seeds = [DIST_SPL_SEED, unlock.key().as_ref(), mint.key().as_ref()], bump)]
  pub dist_spl: Account<'info, DistributionSplSession>,

  #[account(
    mut,
    associated_token::mint = mint,
    associated_token::authority = vault_auth
  )]
  pub vault_ata: Account<'info, TokenAccount>,

  pub token_program: Program<'info, Token>,

  // Remaining accounts convention (see 6.6):
  // [beneficiary_entry_0, beneficiary_wallet_0, beneficiary_ata_0, beneficiary_entry_1, beneficiary_wallet_1, beneficiary_ata_1, ...]
}

#[derive(Accounts)]
pub struct FinalizeUnlock<'info> {
  #[account(seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,
  #[account(mut)]
  pub vault: Account<'info, Vault>,
  #[account(mut)]
  pub unlock: Account<'info, UnlockSession>,
}

#[derive(Accounts)]
pub struct SetSubscription<'info> {
  #[account(seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,
  #[account(mut)]
  pub vault: Account<'info, Vault>,

  #[account(
    init_if_needed,
    payer = payer,
    space = Subscription::LEN,
    seeds = [SUBSCRIPTION_SEED, vault.key().as_ref()],
    bump
  )]
  pub subscription: Account<'info, Subscription>,

  #[account(mut)]
  pub payer: Signer<'info>,
  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterGuardianProfile<'info> {
  #[account(seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,

  #[account(
    init_if_needed,
    payer = guardian,
    space = GuardianProfile::LEN,
    seeds = [GUARDIAN_PROFILE_SEED, guardian.key().as_ref()],
    bump
  )]
  pub profile: Account<'info, GuardianProfile>,

  #[account(mut)]
  pub guardian: Signer<'info>,

  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateGuardianBond<'info> {
  #[account(seeds = [CONFIG_SEED], bump)]
  pub config: Account<'info, GlobalConfig>,

  #[account(
    init_if_needed,
    payer = guardian,
    space = GuardianBond::LEN,
    seeds = [GUARDIAN_BOND_SEED, guardian.key().as_ref()],
    bump
  )]
  pub bond: Account<'info, GuardianBond>,

  #[account(mut)]
  pub guardian: Signer<'info>,

  pub system_program: Program<'info, System>,
}
6.6 Remaining-accounts conventions (distribution batching)
Distribution must be compute-safe and therefore batched.

6.6.1 Beneficiary ordering
To avoid ambiguity, beneficiaries are processed in a deterministic sorted order:

Sort by beneficiary_pubkey ascending (bytes) off-chain.
The UI/automation worker must pass accounts in that order for each batch.
6.6.2 SOL distribution batching: execute_distribution_sol_batch(start_index, batch_size)
Remaining accounts list format (2 per beneficiary):

beneficiary_entry_i (PDA account; read-only)
beneficiary_wallet_i (system account; writable)
So remaining accounts length must be 2 * batch_size.

Batch payout computation:

For each beneficiary in batch:
pay_i = floor(distributable_sol * share_bps / 10_000) except last global beneficiary gets remainder.
Because batching makes “remainder to last beneficiary” tricky, we enforce:
SOL distribution can be either:
single-shot (recommended when beneficiaries <= ~20), or
batched with a DistributionSolSession state that tracks paid_total and a finalization step. Full build decision: implement DistributionSolSession for correctness at scale (omitted from structs above for brevity; add if you expect >20 beneficiaries). If you expect low counts, you may keep single-shot.
6.6.3 SPL distribution batching: execute_distribution_spl_batch(start_index, batch_size)
Remaining accounts list format (3 per beneficiary):

beneficiary_entry_i (PDA; read-only)
beneficiary_wallet_i (read-only)
beneficiary_ata_i for the given mint (writable)
So remaining accounts length must be 3 * batch_size.

Validation rules:

beneficiary_entry_i.vault == vault
beneficiary_entry_i.active == true
beneficiary_wallet_i.key == beneficiary_entry_i.beneficiary
beneficiary_ata_i must be the associated token account for (beneficiary_wallet_i, mint) (validate on-chain)
Progress:

DistributionSplSession.cursor advances by batch_size until full beneficiary list is processed.
When cursor reaches total active beneficiaries:
mark dist_spl.done = true
6.6.4 Finalization rule
finalize_unlock can only succeed if:

unlock status is Approved/Executing
unlock.sol_done == true (or SOL dist session finalized)
all required SPL mint sessions are done (off-chain can enforce by requiring list of sessions)
no dispute is open
6.7 Error codes (exact)
Rust

use anchor_lang::prelude::*;

#[error_code]
pub enum LegacyVaultError {
  #[msg("Unauthorized")]
  Unauthorized,

  #[msg("Protocol paused")]
  Paused,

  #[msg("Invalid bounds")]
  InvalidBounds,

  #[msg("Vault not Active")]
  VaultNotActive,

  #[msg("Vault not Unlocking")]
  VaultNotUnlocking,

  #[msg("Vault is Frozen")]
  VaultFrozen,

  #[msg("Invalid guardian threshold")]
  InvalidGuardianThreshold,

  #[msg("Inactivity threshold not reached")]
  UnlockNotEligible,

  #[msg("Unlock session wrong state")]
  UnlockWrongState,

  #[msg("Guardian entry inactive or missing")]
  GuardianNotActive,

  #[msg("Approval already exists")]
  AlreadyApproved,

  #[msg("Threshold not reached")]
  ThresholdNotReached,

  #[msg("Timelock not elapsed")]
  TimelockNotElapsed,

  #[msg("Unlock is disputed")]
  UnlockDisputed,

  #[msg("Invalid beneficiary share")]
  InvalidShare,

  #[msg("Total beneficiary shares must sum to 10,000 bps")]
  SharesNot10k,

  #[msg("Invalid document URI length")]
  InvalidDocUriLen,

  #[msg("Invalid mint / token account")]
  InvalidTokenAccount,

  #[msg("Asset rule invalid for mode")]
  InvalidAssetRule,

  #[msg("Distribution already done")]
  DistributionAlreadyDone,

  #[msg("Batch parameters invalid")]
  InvalidBatch,

  #[msg("Math overflow")]
  MathOverflow,
}
6.8 Events (exact)
Rust

use anchor_lang::prelude::*;
use crate::state::*;

#[event]
pub struct ConfigInitialized {
  pub admin: Pubkey,
  pub treasury: Pubkey,
  pub ts: i64,
}

#[event]
pub struct VaultCreated {
  pub vault: Pubkey,
  pub vault_id: u64,
  pub owner: Pubkey,
  pub ts: i64,
}

#[event]
pub struct DocumentSet {
  pub vault: Pubkey,
  pub doc_hash: [u8; 32],
  pub doc_uri_len: u16,
  pub ts: i64,
}

#[event]
pub struct GuardianAdded {
  pub vault: Pubkey,
  pub guardian: Pubkey,
  pub role: GuardianRole,
  pub ts: i64,
}

#[event]
pub struct GuardianRemoved {
  pub vault: Pubkey,
  pub guardian: Pubkey,
  pub ts: i64,
}

#[event]
pub struct GuardianThresholdSet {
  pub vault: Pubkey,
  pub threshold: u8,
  pub ts: i64,
}

#[event]
pub struct BeneficiaryAdded {
  pub vault: Pubkey,
  pub beneficiary: Pubkey,
  pub share_bps: u16,
  pub ts: i64,
}

#[event]
pub struct BeneficiaryUpdated {
  pub vault: Pubkey,
  pub beneficiary: Pubkey,
  pub share_bps: u16,
  pub active: bool,
  pub ts: i64,
}

#[event]
pub struct BeneficiaryRemoved {
  pub vault: Pubkey,
  pub beneficiary: Pubkey,
  pub ts: i64,
}

#[event]
pub struct AssetRuleSet {
  pub vault: Pubkey,
  pub mint: Pubkey,
  pub mode: AssetRuleMode,
  pub assigned_beneficiary: Pubkey,
  pub ts: i64,
}

#[event]
pub struct SolDeposited {
  pub vault: Pubkey,
  pub owner: Pubkey,
  pub lamports: u64,
  pub ts: i64,
}

#[event]
pub struct SolWithdrawn {
  pub vault: Pubkey,
  pub owner: Pubkey,
  pub lamports: u64,
  pub ts: i64,
}

#[event]
pub struct SplDeposited {
  pub vault: Pubkey,
  pub owner: Pubkey,
  pub mint: Pubkey,
  pub amount: u64,
  pub ts: i64,
}

#[event]
pub struct SplWithdrawn {
  pub vault: Pubkey,
  pub owner: Pubkey,
  pub mint: Pubkey,
  pub amount: u64,
  pub ts: i64,
}

#[event]
pub struct CheckIn {
  pub vault: Pubkey,
  pub by: Pubkey, // owner or delegate
  pub ts: i64,
}

#[event]
pub struct UnlockInitiated {
  pub vault: Pubkey,
  pub unlock: Pubkey,
  pub nonce: u64,
  pub initiated_by: Pubkey,
  pub ts: i64,
}

#[event]
pub struct UnlockApproved {
  pub vault: Pubkey,
  pub unlock: Pubkey,
  pub guardian: Pubkey,
  pub approvals: u16,
  pub threshold: u8,
  pub ts: i64,
}

#[event]
pub struct UnlockCancelled {
  pub vault: Pubkey,
  pub unlock: Pubkey,
  pub ts: i64,
}

#[event]
pub struct PanicFrozen {
  pub vault: Pubkey,
  pub ts: i64,
}

#[event]
pub struct Unfrozen {
  pub vault: Pubkey,
  pub ts: i64,
}

#[event]
pub struct DisputeOpened {
  pub unlock: Pubkey,
  pub opened_by: Pubkey,
  pub note_hash: [u8; 32],
  pub ts: i64,
}

#[event]
pub struct DisputeResolved {
  pub unlock: Pubkey,
  pub status: DisputeStatus,
  pub ts: i64,
}

#[event]
pub struct SolDistributionBatchExecuted {
  pub unlock: Pubkey,
  pub start_index: u32,
  pub batch_size: u16,
  pub ts: i64,
}

#[event]
pub struct SplDistributionBatchExecuted {
  pub unlock: Pubkey,
  pub mint: Pubkey,
  pub start_index: u32,
  pub batch_size: u16,
  pub new_cursor: u32,
  pub done: bool,
  pub ts: i64,
}

#[event]
pub struct UnlockFinalized {
  pub vault: Pubkey,
  pub unlock: Pubkey,
  pub ts: i64,
}

#[event]
pub struct SubscriptionSet {
  pub vault: Pubkey,
  pub plan_id: u8,
  pub valid_until_unix: i64,
  pub ts: i64,
}

#[event]
pub struct GuardianProfileRegistered {
  pub guardian: Pubkey,
  pub ts: i64,
}

#[event]
pub struct GuardianBondUpdated {
  pub guardian: Pubkey,
  pub amount: u64,
  pub locked: bool,
  pub ts: i64,
}
6.9 Invariants & state machines
Vault status transitions
Active:
owner can deposit/withdraw
owner can modify guardians/beneficiaries
owner can check-in
guardians can initiate unlock only if inactivity threshold reached
Unlocking:
no owner withdrawals
guardians can approve
owner can cancel (unless dispute locks it; policy choice)
distribution can execute only after timelock
Distributed:
vault considered completed; optionally allow close
Frozen:
no unlock approvals/distribution; owner can unfreeze
Closed:
terminal state
Unlock session transitions
Proposed → Approved (when approvals reach threshold)
Approved → Disputed (if dispute opened)
Disputed → Approved (arbiter proceed)
Disputed → Cancelled (arbiter cancel)
Approved → Executing (when distribution starts; optional)
Executing → Executed (finalize)
7) Off-chain services (full build)
7.1 API Gateway (Node/Go)
Responsibilities:

SIWS auth sessions (wallet signatures)
Serve vault metadata and “read models” from indexer DB
Manage notification settings and contacts (email/phone)
Provide transaction builders (unsigned) for:
deposit/withdraw
initiate/approve unlock
distribution batches (SOL + SPL)
Professional guardian discovery endpoints
7.2 Indexer
Subscribes to program logs via RPC/WebSocket
Decodes events
Populates normalized tables:
vaults
guardians
beneficiaries
unlock_sessions
approvals
distributions
disputes
Exposes derived state:
“unlock eligible at” timestamps per vault
“timelock ends at”
“next check-in deadline”
“risk alerts” (e.g., threshold too low)
7.3 Notifier service
Scheduled reminders:
upcoming check-in (T-7d, T-1d)
missed check-in
unlock eligible
unlock initiated
approvals requested
timelock ending soon
Channels:
email
SMS
push notifications (mobile)
optional wallet notifications
7.4 Document service
Client-side encryption:
derive symmetric key from user secret or wallet-based key agreement
never send plaintext to servers
Storage:
upload encrypted blob to Arweave/Shadow Drive/S3
On-chain:
store doc_hash (sha256) and doc_uri
Optional:
“signing ceremony” (owner + witnesses sign the hash off-chain; store signatures in doc metadata)
7.5 KYC / professional guardian
KYC results stored off-chain
On-chain GuardianProfile.kyc_level set by admin after verification
Guardian bond deposits held on-chain (bonding mechanism)
8) Data storage & schemas (product DB)
Postgres tables (minimum):

users (wallet, created_at)
vaults (vault_pubkey, owner_wallet, settings snapshot)
guardians (vault_pubkey, guardian_wallet, role, active)
beneficiaries (vault_pubkey, beneficiary_wallet, share_bps, active)
unlock_sessions (unlock_pubkey, vault_pubkey, nonce, status, timestamps)
approvals (unlock_pubkey, guardian_wallet, ts)
asset_rules (vault_pubkey, mint, mode, assigned_beneficiary)
documents (vault_pubkey, doc_hash, uri, version, created_at)
notifications (wallet, channels, schedules)
guardian_profiles (guardian_wallet, kyc_level, display info)
guardian_bonds (guardian_wallet, amount, locked)
9) Security & threat model (deep)
9.1 Threats and mitigations
Guardian collusion theft
Mitigations:
M-of-N threshold + timelock
owner override/cancel
dispute mechanism + arbiter
professional guardian bonding + slashing (optional)
strict event transparency for forensics
False positive unlock (owner alive, missed check-in)
Mitigations:
long inactivity threshold (90–180d typical)
multiple reminders (multi-channel)
timelock after approvals
owner can check-in + cancel during timelock
Phishing / UI compromise
Mitigations:
show transaction simulation and clear “this withdraws funds from vault” warnings
hardware wallet encouraged
allowlist official app origins
publish open-source tx builders
Program exploit / drain
Mitigations:
minimize privileged admin powers
pause switch
strict PDA signer checks
audits + fuzzing + invariants
separate upgrade authority behind multisig
Arbiter abuse (if disputes enabled)
Mitigations:
arbiter optional per vault (owner chooses)
arbiter actions timelocked or multi-sig (future)
transparent events and challenge process
10) Testing strategy
10.1 Protocol tests (Anchor)
PDA derivation tests
guardian/beneficiary add/remove, threshold checks
deposits/withdrawals blocked during unlocking/frozen
unlock initiation eligibility based on clock
approval uniqueness via GuardianApproval PDA
timelock enforcement
distribution batch correctness:
SPL ATA validation
correct pro-rata sums
cursor progression and idempotency
dispute transitions
10.2 Backend tests
indexer correctness: events → read model
notifier scheduling correctness
doc encryption/decryption roundtrip
transaction builder determinism (same inputs produce same tx)
10.3 End-to-end
scenario: create vault, deposit, set plan, check-in
wait simulated time: unlock eligible → approve → timelock → distribute → finalize
11) Deployment & operations
11.1 Environments
localnet (dev)
devnet (staging)
mainnet-beta (prod)
11.2 Key management
Upgrade authority behind multisig
Admin keys for:
pause
arbiter assignment
KYC-level updates (optional) Stored in hardware-backed KMS for production.
11.3 Observability
Index events
Alert on:
spikes in unlock initiations
repeated dispute openings
failed distributions (compute, missing ATAs)
suspicious guardian behavior (many approvals across many vaults)
12) Roadmap / execution plan (full product build)
Phase 0 — Research & spec hardening (2–3 weeks)
finalize state machine and batching design
decide subscription model and whether on-chain enforced
finalize dispute/arbitration approach (optional vs required)
Phase 1 — Protocol core (4–6 weeks)
implement vault creation, guardians, beneficiaries
deposits/withdrawals
liveness check-in + delegates
unlock session + approvals + timelock
SOL + SPL distribution (single-shot first, then batching)
event completeness + indexer schema
internal audit + fix pass
Phase 2 — Product apps (4–8 weeks parallel)
Next.js web app:
owner dashboard
guardian portal
beneficiary portal
transaction builder library (TS SDK)
indexer + read model
notifier (email/SMS)
docs encryption + upload service
Phase 3 — Safety + scale features (6–10 weeks)
full batching sessions for SOL + SPL
per-asset rules (AssignAll + ProRata shipped; custom splits later)
freeze/unfreeze + “panic mode” UX
dispute module (arbiter + resolution events)
Phase 4 — Professional guardians (6–12 weeks)
guardian profile registration
KYC pipeline integration
bonding contract and admin-set KYC levels
marketplace UX:
filtering (jurisdiction, language, fees)
request flow (off-chain contract + on-chain guardian entry)
reputation scoring (off-chain read model + on-chain attestations optional)
Phase 5 — Audits + beta (8–12 weeks)
third-party security audit(s)
bug bounty
staged mainnet rollout:
low limits
progressive feature enabling
wallet partnerships (embedded “Legacy” feature)
Phase 6 — Production scale (ongoing)
formal verification for critical distribution math
multi-program split if needed (marketplace module separated)
compliance posture improvements:
clearer legal doc workflows
jurisdiction-specific templates (off-chain)
enterprise offering:
exchanges/custodians “deceased account handling” integrations




Important implementation refinement (needed for provably-correct batching):
Your master design doc used per-entry PDAs for guardians/beneficiaries. That makes it hard to prove “no beneficiary was omitted” during chunked distribution without an on-chain canonical ordering.
Solution implemented here: add a VaultIndex PDA that stores the sorted list of active guardian pubkeys and beneficiary pubkeys. Distribution batches verify entries against this index, so missing/duplicated beneficiaries are rejected on-chain.
You should add a short note in the master doc under “Remaining-accounts conventions” that VaultIndex is canonical ordering.

0) Repo layout (program + SDK)
text

programs/legacyvault/src/
  lib.rs
  constants.rs
  state.rs
  errors.rs
  events.rs
  utils.rs

sdk/legacyvault/
  pdas.ts
  types.ts
  tx.ts
  distribute.ts
1) Anchor program — legacyvault
1.1 constants.rs
Rust

pub const CONFIG_SEED: &[u8] = b"config";
pub const VAULT_SEED: &[u8] = b"vault";
pub const VAULT_AUTH_SEED: &[u8] = b"vault_auth";
pub const INDEX_SEED: &[u8] = b"index";

pub const GUARDIAN_SEED: &[u8] = b"guardian";
pub const BENEFICIARY_SEED: &[u8] = b"beneficiary";
pub const DELEGATE_SEED: &[u8] = b"delegate";

pub const ASSET_RULE_SEED: &[u8] = b"asset_rule";

pub const UNLOCK_SEED: &[u8] = b"unlock";
pub const APPROVAL_SEED: &[u8] = b"approval";

pub const DIST_SOL_SEED: &[u8] = b"dist_sol";
pub const DIST_SPL_SEED: &[u8] = b"dist_spl";

pub const DISPUTE_SEED: &[u8] = b"dispute";

pub const SUBSCRIPTION_SEED: &[u8] = b"sub";

pub const GUARDIAN_PROFILE_SEED: &[u8] = b"g_profile";
pub const GUARDIAN_BOND_SEED: &[u8] = b"g_bond";

pub const BPS_DENOMINATOR: u16 = 10_000;

pub const MAX_LABEL_LEN: usize = 16;
pub const DOC_URI_MAX: usize = 200;

pub const PROFILE_NAME_MAX: usize = 32;
pub const PROFILE_WEBSITE_MAX: usize = 100;

// Practical caps for on-chain index lists.
// Estate plans usually have small N; these keep account sizes bounded.
pub const MAX_GUARDIANS: usize = 50;
pub const MAX_BENEFICIARIES: usize = 50;
1.2 state.rs
Rust

use anchor_lang::prelude::*;
use crate::constants::*;

#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum VaultStatus {
    Active = 0,
    Unlocking = 1,
    Distributed = 2,
    Frozen = 3,
    Closed = 4,
}

#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum UnlockStatus {
    Proposed = 0,
    Approved = 1,
    Cancelled = 2,
    Disputed = 3,
    Executing = 4,
    Executed = 5,
}

#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum GuardianRole {
    Personal = 0,
    Professional = 1,
}

#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum AssetRuleMode {
    ProRata = 0,
    AssignAll = 1,
}

#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum DisputeStatus {
    Open = 0,
    ResolvedCancel = 1,
    ResolvedProceed = 2,
}

#[account]
pub struct GlobalConfig {
    pub admin: Pubkey,
    pub paused: bool,

    pub treasury: Pubkey,          // SOL treasury receiver
    pub create_fee_lamports: u64,

    pub min_heartbeat_secs: u32,
    pub max_heartbeat_secs: u32,
    pub min_inactivity_secs: u32,
    pub max_inactivity_secs: u32,
    pub min_timelock_secs: u32,
    pub max_timelock_secs: u32,

    pub arbiter: Pubkey,

    // optional billing authority (if you want a separate key)
    pub billing_authority: Pubkey,

    pub version: u16,
}

impl GlobalConfig {
    pub const LEN: usize = 8
        + 32 + 1
        + 32 + 8
        + (4 * 6)
        + 32
        + 32
        + 2;
}

#[account]
pub struct Vault {
    pub vault_id: u64,
    pub owner: Pubkey,

    pub created_at_unix: i64,

    pub last_checkin_unix: i64,
    pub heartbeat_interval_secs: u32,
    pub inactivity_threshold_secs: u32,

    pub timelock_secs: u32,

    pub status: VaultStatus,

    pub guardian_threshold: u8,   // M
    pub guardians_count: u16,     // informational (mirrors index.guardians.len)
    pub beneficiaries_count: u16, // informational (mirrors index.beneficiaries.len)

    pub current_nonce: u64,

    pub panic_enabled: bool,

    pub doc_hash: [u8; 32],
    pub doc_uri_len: u16,
    pub doc_uri: [u8; DOC_URI_MAX],

    pub bump: u8,
}

impl Vault {
    pub const LEN: usize = 8
        + 8 + 32 + 8
        + 8 + 4 + 4
        + 4
        + 1
        + 1 + 2 + 2
        + 8
        + 1
        + 32 + 2 + DOC_URI_MAX
        + 1;
}

#[account]
pub struct VaultIndex {
    pub vault: Pubkey,

    // Sorted list of active guardians
    pub guardians: Vec<Pubkey>,       // <= MAX_GUARDIANS

    // Sorted list of active beneficiaries
    pub beneficiaries: Vec<Pubkey>,   // <= MAX_BENEFICIARIES

    pub updated_at_unix: i64,
}

impl VaultIndex {
    pub const LEN: usize = 8
        + 32
        + (4 + 32 * MAX_GUARDIANS)
        + (4 + 32 * MAX_BENEFICIARIES)
        + 8;
}

#[account]
pub struct GuardianEntry {
    pub vault: Pubkey,
    pub guardian: Pubkey,
    pub role: GuardianRole,
    pub added_at_unix: i64,
    pub active: bool,
}

impl GuardianEntry {
    pub const LEN: usize = 8 + 32 + 32 + 1 + 8 + 1;
}

#[account]
pub struct BeneficiaryEntry {
    pub vault: Pubkey,
    pub beneficiary: Pubkey,
    pub share_bps: u16,
    pub label: [u8; MAX_LABEL_LEN],
    pub added_at_unix: i64,
    pub active: bool,
}

impl BeneficiaryEntry {
    pub const LEN: usize = 8 + 32 + 32 + 2 + MAX_LABEL_LEN + 8 + 1;
}

#[account]
pub struct LivenessDelegate {
    pub vault: Pubkey,
    pub delegate: Pubkey,
    pub added_at_unix: i64,
    pub active: bool,
}

impl LivenessDelegate {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 1;
}

#[account]
pub struct AssetRule {
    pub vault: Pubkey,
    pub mint: Pubkey,
    pub mode: AssetRuleMode,
    pub assigned_beneficiary: Pubkey, // used if AssignAll
    pub updated_at_unix: i64,
}

impl AssetRule {
    pub const LEN: usize = 8 + 32 + 32 + 1 + 32 + 8;
}

#[account]
pub struct UnlockSession {
    pub vault: Pubkey,
    pub nonce: u64,

    pub status: UnlockStatus,

    pub initiated_by: Pubkey,
    pub initiated_at_unix: i64,

    pub approvals: u16,
    pub threshold: u8,

    pub approved_at_unix: i64,
    pub executable_at_unix: i64,

    pub bump: u8,
}

impl UnlockSession {
    pub const LEN: usize = 8
        + 32 + 8
        + 1
        + 32 + 8
        + 2 + 1
        + 8 + 8
        + 1;
}

#[account]
pub struct GuardianApproval {
    pub unlock: Pubkey,
    pub guardian: Pubkey,
    pub approved_at_unix: i64,
}
impl GuardianApproval {
    pub const LEN: usize = 8 + 32 + 32 + 8;
}

#[account]
pub struct DistributionSolSession {
    pub unlock: Pubkey,

    pub total_distributable: u64,
    pub paid_total: u64,

    pub cursor: u32,
    pub done: bool,

    pub initialized_at_unix: i64,

    pub bump: u8,
}
impl DistributionSolSession {
    pub const LEN: usize = 8 + 32 + 8 + 8 + 4 + 1 + 8 + 1;
}

#[account]
pub struct DistributionSplSession {
    pub unlock: Pubkey,
    pub mint: Pubkey,

    pub total_balance: u64,
    pub paid_total: u64,

    pub cursor: u32,
    pub done: bool,

    pub initialized_at_unix: i64,

    pub bump: u8,
}
impl DistributionSplSession {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 4 + 1 + 8 + 1;
}

#[account]
pub struct DisputeCase {
    pub unlock: Pubkey,
    pub opened_by: Pubkey,
    pub opened_at_unix: i64,
    pub status: DisputeStatus,
    pub note_hash: [u8; 32],
}

impl DisputeCase {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 1 + 32;
}

#[account]
pub struct Subscription {
    pub vault: Pubkey,
    pub plan_id: u8,           // 0 free, 1 standard, 2 pro
    pub valid_until_unix: i64, // 0 means none
    pub updated_at_unix: i64,
}
impl Subscription {
    pub const LEN: usize = 8 + 32 + 1 + 8 + 8;
}

#[account]
pub struct GuardianProfile {
    pub guardian: Pubkey,
    pub display_name: [u8; PROFILE_NAME_MAX],
    pub website_uri: [u8; PROFILE_WEBSITE_MAX],
    pub kyc_level: u8,
    pub active: bool,
    pub updated_at_unix: i64,
}
impl GuardianProfile {
    pub const LEN: usize = 8 + 32 + PROFILE_NAME_MAX + PROFILE_WEBSITE_MAX + 1 + 1 + 8;
}

#[account]
pub struct GuardianBond {
    pub guardian: Pubkey,
    pub amount: u64,    // tracked principal (excludes rent)
    pub locked: bool,
    pub updated_at_unix: i64,
}
impl GuardianBond {
    pub const LEN: usize = 8 + 32 + 8 + 1 + 8;
}
1.3 errors.rs
Rust

use anchor_lang::prelude::*;

#[error_code]
pub enum LegacyVaultError {
    #[msg("Unauthorized")]
    Unauthorized,

    #[msg("Protocol paused")]
    Paused,

    #[msg("Invalid bounds")]
    InvalidBounds,

    #[msg("Vault not Active")]
    VaultNotActive,

    #[msg("Vault not Unlocking")]
    VaultNotUnlocking,

    #[msg("Vault is Frozen")]
    VaultFrozen,

    #[msg("Invalid guardian threshold")]
    InvalidGuardianThreshold,

    #[msg("Guardian not active")]
    GuardianNotActive,

    #[msg("Beneficiary not active")]
    BeneficiaryNotActive,

    #[msg("Too many guardians")]
    TooManyGuardians,

    #[msg("Too many beneficiaries")]
    TooManyBeneficiaries,

    #[msg("Invalid beneficiary share")]
    InvalidShare,

    #[msg("Total beneficiary shares must sum to 10,000 bps")]
    SharesNot10k,

    #[msg("Cannot modify plan while unlocking")]
    PlanLocked,

    #[msg("Inactivity threshold not reached")]
    UnlockNotEligible,

    #[msg("Unlock session wrong state")]
    UnlockWrongState,

    #[msg("Approval already exists")]
    AlreadyApproved,

    #[msg("Threshold not reached")]
    ThresholdNotReached,

    #[msg("Timelock not elapsed")]
    TimelockNotElapsed,

    #[msg("Unlock is disputed")]
    UnlockDisputed,

    #[msg("Invalid document URI length")]
    InvalidDocUriLen,

    #[msg("Invalid token account / mint")]
    InvalidTokenAccount,

    #[msg("Invalid asset rule")]
    InvalidAssetRule,

    #[msg("Distribution already done")]
    DistributionAlreadyDone,

    #[msg("Invalid batch parameters")]
    InvalidBatch,

    #[msg("Index mismatch (wrong ordering or missing entries)")]
    IndexMismatch,

    #[msg("Bond is locked")]
    BondLocked,

    #[msg("Insufficient bond balance")]
    BondInsufficient,

    #[msg("Math overflow")]
    MathOverflow,
}
1.4 events.rs
Rust

use anchor_lang::prelude::*;
use crate::state::*;

#[event]
pub struct ConfigInitialized { pub admin: Pubkey, pub treasury: Pubkey, pub ts: i64 }

#[event]
pub struct VaultCreated { pub vault: Pubkey, pub vault_id: u64, pub owner: Pubkey, pub ts: i64 }

#[event]
pub struct DocumentSet { pub vault: Pubkey, pub doc_hash: [u8; 32], pub doc_uri_len: u16, pub ts: i64 }

#[event]
pub struct GuardianAdded { pub vault: Pubkey, pub guardian: Pubkey, pub role: GuardianRole, pub ts: i64 }
#[event]
pub struct GuardianRemoved { pub vault: Pubkey, pub guardian: Pubkey, pub ts: i64 }
#[event]
pub struct GuardianThresholdSet { pub vault: Pubkey, pub threshold: u8, pub ts: i64 }

#[event]
pub struct BeneficiaryAdded { pub vault: Pubkey, pub beneficiary: Pubkey, pub share_bps: u16, pub ts: i64 }
#[event]
pub struct BeneficiaryUpdated { pub vault: Pubkey, pub beneficiary: Pubkey, pub share_bps: u16, pub active: bool, pub ts: i64 }
#[event]
pub struct BeneficiaryRemoved { pub vault: Pubkey, pub beneficiary: Pubkey, pub ts: i64 }

#[event]
pub struct AssetRuleSet { pub vault: Pubkey, pub mint: Pubkey, pub mode: AssetRuleMode, pub assigned_beneficiary: Pubkey, pub ts: i64 }

#[event]
pub struct SolDeposited { pub vault: Pubkey, pub owner: Pubkey, pub lamports: u64, pub ts: i64 }
#[event]
pub struct SolWithdrawn { pub vault: Pubkey, pub owner: Pubkey, pub lamports: u64, pub ts: i64 }
#[event]
pub struct SplDeposited { pub vault: Pubkey, pub owner: Pubkey, pub mint: Pubkey, pub amount: u64, pub ts: i64 }
#[event]
pub struct SplWithdrawn { pub vault: Pubkey, pub owner: Pubkey, pub mint: Pubkey, pub amount: u64, pub ts: i64 }

#[event]
pub struct CheckIn { pub vault: Pubkey, pub by: Pubkey, pub ts: i64 }

#[event]
pub struct UnlockInitiated { pub vault: Pubkey, pub unlock: Pubkey, pub nonce: u64, pub initiated_by: Pubkey, pub ts: i64 }
#[event]
pub struct UnlockApproved { pub vault: Pubkey, pub unlock: Pubkey, pub guardian: Pubkey, pub approvals: u16, pub threshold: u8, pub ts: i64 }
#[event]
pub struct UnlockCancelled { pub vault: Pubkey, pub unlock: Pubkey, pub ts: i64 }

#[event]
pub struct PanicFrozen { pub vault: Pubkey, pub ts: i64 }
#[event]
pub struct Unfrozen { pub vault: Pubkey, pub ts: i64 }

#[event]
pub struct DisputeOpened { pub unlock: Pubkey, pub opened_by: Pubkey, pub note_hash: [u8; 32], pub ts: i64 }
#[event]
pub struct DisputeResolved { pub unlock: Pubkey, pub status: DisputeStatus, pub ts: i64 }

#[event]
pub struct SolDistributionInitialized { pub unlock: Pubkey, pub total_distributable: u64, pub ts: i64 }
#[event]
pub struct SolDistributionBatchExecuted { pub unlock: Pubkey, pub start_index: u32, pub batch_size: u16, pub new_cursor: u32, pub ts: i64 }

#[event]
pub struct SplDistributionInitialized { pub unlock: Pubkey, pub mint: Pubkey, pub total_balance: u64, pub ts: i64 }
#[event]
pub struct SplDistributionBatchExecuted { pub unlock: Pubkey, pub mint: Pubkey, pub start_index: u32, pub batch_size: u16, pub new_cursor: u32, pub done: bool, pub ts: i64 }

#[event]
pub struct UnlockFinalized { pub vault: Pubkey, pub unlock: Pubkey, pub ts: i64 }

#[event]
pub struct SubscriptionSet { pub vault: Pubkey, pub plan_id: u8, pub valid_until_unix: i64, pub ts: i64 }

#[event]
pub struct GuardianProfileRegistered { pub guardian: Pubkey, pub ts: i64 }
#[event]
pub struct GuardianBondUpdated { pub guardian: Pubkey, pub amount: u64, pub locked: bool, pub ts: i64 }
1.5 utils.rs
Rust

use anchor_lang::prelude::*;
use crate::{errors::LegacyVaultError, constants::*};

pub fn now_ts() -> Result<i64> {
    Ok(Clock::get()?.unix_timestamp)
}

pub fn require_not_paused(paused: bool) -> Result<()> {
    require!(!paused, LegacyVaultError::Paused);
    Ok(())
}

pub fn bytes_to_fixed<const N: usize>(src: &[u8]) -> Result<[u8; N]> {
    require!(src.len() <= N, LegacyVaultError::InvalidDocUriLen);
    let mut out = [0u8; N];
    out[..src.len()].copy_from_slice(src);
    Ok(out)
}

pub fn sorted_insert(vec: &mut Vec<Pubkey>, key: Pubkey) {
    match vec.binary_search(&key) {
        Ok(_) => {} // already
        Err(i) => vec.insert(i, key),
    }
}

pub fn sorted_remove(vec: &mut Vec<Pubkey>, key: Pubkey) {
    if let Ok(i) = vec.binary_search(&key) {
        vec.remove(i);
    }
}

pub fn u128_mul_div_floor(a: u64, b: u64, denom: u64) -> Result<u64> {
    require!(denom != 0, LegacyVaultError::MathOverflow);
    let v = (a as u128)
        .checked_mul(b as u128).ok_or(LegacyVaultError::MathOverflow)?
        .checked_div(denom as u128).ok_or(LegacyVaultError::MathOverflow)?;
    Ok(v as u64)
}

pub fn rent_min_for(size: usize) -> Result<u64> {
    Ok(Rent::get()?.minimum_balance(size))
}

pub fn clamp_i64_add(a: i64, b: i64) -> Result<i64> {
    a.checked_add(b).ok_or_else(|| error!(LegacyVaultError::MathOverflow))
}
1.6 lib.rs (handlers + contexts)
This is the full program: all handlers and all contexts. Replace program id.

Rust

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

pub mod constants;
pub mod state;
pub mod errors;
pub mod events;
pub mod utils;

use constants::*;
use state::*;
use errors::*;
use events::*;
use utils::*;

declare_id!("LeGaCyVaULt11111111111111111111111111111"); // replace

#[program]
pub mod legacyvault {
    use super::*;

    // =========================
    // Admin
    // =========================

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        treasury: Pubkey,
        create_fee_lamports: u64,
        min_heartbeat_secs: u32,
        max_heartbeat_secs: u32,
        min_inactivity_secs: u32,
        max_inactivity_secs: u32,
        min_timelock_secs: u32,
        max_timelock_secs: u32,
        arbiter: Pubkey,
        billing_authority: Pubkey,
    ) -> Result<()> {
        let cfg = &mut ctx.accounts.config;
        cfg.admin = ctx.accounts.admin.key();
        cfg.paused = false;
        cfg.treasury = treasury;
        cfg.create_fee_lamports = create_fee_lamports;

        cfg.min_heartbeat_secs = min_heartbeat_secs;
        cfg.max_heartbeat_secs = max_heartbeat_secs;
        cfg.min_inactivity_secs = min_inactivity_secs;
        cfg.max_inactivity_secs = max_inactivity_secs;
        cfg.min_timelock_secs = min_timelock_secs;
        cfg.max_timelock_secs = max_timelock_secs;

        cfg.arbiter = arbiter;
        cfg.billing_authority = billing_authority;

        cfg.version = 1;

        emit!(ConfigInitialized { admin: cfg.admin, treasury, ts: now_ts()? });
        Ok(())
    }

    pub fn set_paused(ctx: Context<SetPaused>, paused: bool) -> Result<()> {
        require_keys_eq!(ctx.accounts.config.admin, ctx.accounts.admin.key(), LegacyVaultError::Unauthorized);
        ctx.accounts.config.paused = paused;
        Ok(())
    }

    pub fn set_arbiter(ctx: Context<SetArbiter>, arbiter: Pubkey) -> Result<()> {
        require_keys_eq!(ctx.accounts.config.admin, ctx.accounts.admin.key(), LegacyVaultError::Unauthorized);
        ctx.accounts.config.arbiter = arbiter;
        Ok(())
    }

    pub fn set_fees(ctx: Context<SetFees>, create_fee_lamports: u64) -> Result<()> {
        require_keys_eq!(ctx.accounts.config.admin, ctx.accounts.admin.key(), LegacyVaultError::Unauthorized);
        ctx.accounts.config.create_fee_lamports = create_fee_lamports;
        Ok(())
    }

    pub fn set_bounds(
        ctx: Context<SetBounds>,
        min_heartbeat_secs: u32,
        max_heartbeat_secs: u32,
        min_inactivity_secs: u32,
        max_inactivity_secs: u32,
        min_timelock_secs: u32,
        max_timelock_secs: u32,
    ) -> Result<()> {
        require_keys_eq!(ctx.accounts.config.admin, ctx.accounts.admin.key(), LegacyVaultError::Unauthorized);
        let cfg = &mut ctx.accounts.config;
        cfg.min_heartbeat_secs = min_heartbeat_secs;
        cfg.max_heartbeat_secs = max_heartbeat_secs;
        cfg.min_inactivity_secs = min_inactivity_secs;
        cfg.max_inactivity_secs = max_inactivity_secs;
        cfg.min_timelock_secs = min_timelock_secs;
        cfg.max_timelock_secs = max_timelock_secs;
        Ok(())
    }

    // =========================
    // Vault lifecycle
    // =========================

    pub fn create_vault(
        ctx: Context<CreateVault>,
        vault_id: u64,
        heartbeat_interval_secs: u32,
        inactivity_threshold_secs: u32,
        timelock_secs: u32,
        panic_enabled: bool,
    ) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;

        require!(
            heartbeat_interval_secs >= cfg.min_heartbeat_secs && heartbeat_interval_secs <= cfg.max_heartbeat_secs,
            LegacyVaultError::InvalidBounds
        );
        require!(
            inactivity_threshold_secs >= cfg.min_inactivity_secs && inactivity_threshold_secs <= cfg.max_inactivity_secs,
            LegacyVaultError::InvalidBounds
        );
        require!(
            timelock_secs >= cfg.min_timelock_secs && timelock_secs <= cfg.max_timelock_secs,
            LegacyVaultError::InvalidBounds
        );

        // Anti-spam fee (SOL) paid to treasury (optional)
        if cfg.create_fee_lamports > 0 {
            let ix = anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.owner.key(),
                &cfg.treasury,
                cfg.create_fee_lamports,
            );
            anchor_lang::solana_program::program::invoke(
                &ix,
                &[
                    ctx.accounts.owner.to_account_info(),
                    ctx.accounts.treasury.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
            )?;
        }

        let now = now_ts()?;

        let v = &mut ctx.accounts.vault;
        v.vault_id = vault_id;
        v.owner = ctx.accounts.owner.key();
        v.created_at_unix = now;
        v.last_checkin_unix = now;
        v.heartbeat_interval_secs = heartbeat_interval_secs;
        v.inactivity_threshold_secs = inactivity_threshold_secs;
        v.timelock_secs = timelock_secs;
        v.status = VaultStatus::Active;
        v.guardian_threshold = 0;
        v.guardians_count = 0;
        v.beneficiaries_count = 0;
        v.current_nonce = 0;
        v.panic_enabled = panic_enabled;
        v.doc_hash = [0u8; 32];
        v.doc_uri_len = 0;
        v.doc_uri = [0u8; DOC_URI_MAX];
        v.bump = ctx.bumps.vault;

        // Initialize index
        let idx = &mut ctx.accounts.index;
        idx.vault = v.key();
        idx.guardians = vec![];
        idx.beneficiaries = vec![];
        idx.updated_at_unix = now;

        emit!(VaultCreated { vault: v.key(), vault_id, owner: v.owner, ts: now });
        Ok(())
    }

    pub fn close_vault(ctx: Context<CloseVault>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;

        let v = &mut ctx.accounts.vault;
        require_keys_eq!(v.owner, ctx.accounts.owner.key(), LegacyVaultError::Unauthorized);

        // Allow close only if Distributed or Active with no funds (best-effort; full balance checks are off-chain)
        require!(
            v.status == VaultStatus::Distributed || v.status == VaultStatus::Active,
            LegacyVaultError::UnlockWrongState
        );

        v.status = VaultStatus::Closed;
        Ok(())
    }

    // =========================
    // Documents
    // =========================

    pub fn set_document(ctx: Context<SetDocument>, doc_hash: [u8; 32], doc_uri: Vec<u8>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;

        let v = &mut ctx.accounts.vault;
        require_keys_eq!(v.owner, ctx.accounts.owner.key(), LegacyVaultError::Unauthorized);
        require!(v.status == VaultStatus::Active, LegacyVaultError::VaultNotActive);

        require!(doc_uri.len() <= DOC_URI_MAX, LegacyVaultError::InvalidDocUriLen);
        v.doc_hash = doc_hash;
        v.doc_uri_len = doc_uri.len() as u16;
        v.doc_uri = [0u8; DOC_URI_MAX];
        v.doc_uri[..doc_uri.len()].copy_from_slice(&doc_uri);

        emit!(DocumentSet { vault: v.key(), doc_hash, doc_uri_len: v.doc_uri_len, ts: now_ts()? });
        Ok(())
    }

    // =========================
    // Guardians
    // =========================

    pub fn add_guardian(ctx: Context<AddGuardian>, role: GuardianRole) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;

        let v = &mut ctx.accounts.vault;
        require_keys_eq!(v.owner, ctx.accounts.owner.key(), LegacyVaultError::Unauthorized);
        require!(v.status == VaultStatus::Active, LegacyVaultError::VaultNotActive);

        // index capacity
        require!(ctx.accounts.index.guardians.len() < MAX_GUARDIANS, LegacyVaultError::TooManyGuardians);

        let now = now_ts()?;
        let entry = &mut ctx.accounts.guardian_entry;
        entry.vault = v.key();
        entry.guardian = ctx.accounts.guardian.key();
        entry.role = role;
        entry.added_at_unix = now;
        entry.active = true;

        // update index
        sorted_insert(&mut ctx.accounts.index.guardians, entry.guardian);
        ctx.accounts.index.updated_at_unix = now;

        v.guardians_count = ctx.accounts.index.guardians.len() as u16;

        emit!(GuardianAdded { vault: v.key(), guardian: entry.guardian, role, ts: now });
        Ok(())
    }

    pub fn remove_guardian(ctx: Context<RemoveGuardian>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;

        let v = &mut ctx.accounts.vault;
        require_keys_eq!(v.owner, ctx.accounts.owner.key(), LegacyVaultError::Unauthorized);
        require!(v.status == VaultStatus::Active, LegacyVaultError::VaultNotActive);

        // mark inactive then close (close in context)
        let entry = &mut ctx.accounts.guardian_entry;
        require!(entry.active, LegacyVaultError::GuardianNotActive);
        entry.active = false;

        let now = now_ts()?;
        sorted_remove(&mut ctx.accounts.index.guardians, entry.guardian);
        ctx.accounts.index.updated_at_unix = now;

        v.guardians_count = ctx.accounts.index.guardians.len() as u16;

        emit!(GuardianRemoved { vault: v.key(), guardian: entry.guardian, ts: now });
        Ok(())
    }

    pub fn set_guardian_threshold(ctx: Context<SetGuardianThreshold>, threshold: u8) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;

        let v = &mut ctx.accounts.vault;
        require_keys_eq!(v.owner, ctx.accounts.owner.key(), LegacyVaultError::Unauthorized);
        require!(v.status == VaultStatus::Active, LegacyVaultError::VaultNotActive);

        // threshold must be <= active guardians count
        let n = ctx.accounts.index.guardians.len();
        require!(n > 0, LegacyVaultError::InvalidGuardianThreshold);
        require!(threshold >= 1 && (threshold as usize) <= n, LegacyVaultError::InvalidGuardianThreshold);

        v.guardian_threshold = threshold;

        emit!(GuardianThresholdSet { vault: v.key(), threshold, ts: now_ts()? });
        Ok(())
    }

    // =========================
    // Beneficiaries
    // =========================

    pub fn add_beneficiary(ctx: Context<AddBeneficiary>, share_bps: u16, label: [u8; MAX_LABEL_LEN]) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;

        let v = &mut ctx.accounts.vault;
        require_keys_eq!(v.owner, ctx.accounts.owner.key(), LegacyVaultError::Unauthorized);
        require!(v.status == VaultStatus::Active, LegacyVaultError::VaultNotActive);

        require!(share_bps > 0 && share_bps <= BPS_DENOMINATOR, LegacyVaultError::InvalidShare);
        require!(ctx.accounts.index.beneficiaries.len() < MAX_BENEFICIARIES, LegacyVaultError::TooManyBeneficiaries);

        let now = now_ts()?;
        let entry = &mut ctx.accounts.beneficiary_entry;
        entry.vault = v.key();
        entry.beneficiary = ctx.accounts.beneficiary.key();
        entry.share_bps = share_bps;
        entry.label = label;
        entry.added_at_unix = now;
        entry.active = true;

        sorted_insert(&mut ctx.accounts.index.beneficiaries, entry.beneficiary);
        ctx.accounts.index.updated_at_unix = now;

        v.beneficiaries_count = ctx.accounts.index.beneficiaries.len() as u16;

        emit!(BeneficiaryAdded { vault: v.key(), beneficiary: entry.beneficiary, share_bps, ts: now });
        Ok(())
    }

    pub fn update_beneficiary(
        ctx: Context<UpdateBeneficiary>,
        share_bps: u16,
        label: [u8; MAX_LABEL_LEN],
        active: bool,
    ) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;

        let v = &mut ctx.accounts.vault;
        require_keys_eq!(v.owner, ctx.accounts.owner.key(), LegacyVaultError::Unauthorized);
        require!(v.status == VaultStatus::Active, LegacyVaultError::VaultNotActive);

        require!(share_bps <= BPS_DENOMINATOR, LegacyVaultError::InvalidShare);

        let now = now_ts()?;
        let e = &mut ctx.accounts.beneficiary_entry;
        e.share_bps = share_bps;
        e.label = label;
        e.active = active;

        // Update index membership based on active
        if active {
            require!(ctx.accounts.index.beneficiaries.len() < MAX_BENEFICIARIES, LegacyVaultError::TooManyBeneficiaries);
            sorted_insert(&mut ctx.accounts.index.beneficiaries, e.beneficiary);
        } else {
            sorted_remove(&mut ctx.accounts.index.beneficiaries, e.beneficiary);
        }
        ctx.accounts.index.updated_at_unix = now;
        v.beneficiaries_count = ctx.accounts.index.beneficiaries.len() as u16;

        emit!(BeneficiaryUpdated { vault: v.key(), beneficiary: e.beneficiary, share_bps, active, ts: now });
        Ok(())
    }

    pub fn remove_beneficiary(ctx: Context<RemoveBeneficiary>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;

        let v = &mut ctx.accounts.vault;
        require_keys_eq!(v.owner, ctx.accounts.owner.key(), LegacyVaultError::Unauthorized);
        require!(v.status == VaultStatus::Active, LegacyVaultError::VaultNotActive);

        let e = &mut ctx.accounts.beneficiary_entry;
        require!(e.active, LegacyVaultError::BeneficiaryNotActive);
        e.active = false;

        let now = now_ts()?;
        sorted_remove(&mut ctx.accounts.index.beneficiaries, e.beneficiary);
        ctx.accounts.index.updated_at_unix = now;
        v.beneficiaries_count = ctx.accounts.index.beneficiaries.len() as u16;

        emit!(BeneficiaryRemoved { vault: v.key(), beneficiary: e.beneficiary, ts: now });
        Ok(())
    }

    /// Strong check: enforce active beneficiaries sum to 10k bps.
    /// Caller must pass ALL active BeneficiaryEntry accounts in remaining_accounts, in index order.
    pub fn assert_beneficiary_total_10k(ctx: Context<AssertBeneficiaryTotal10k>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;
        let v = &ctx.accounts.vault;
        require_keys_eq!(v.owner, ctx.accounts.owner.key(), LegacyVaultError::Unauthorized);
        require!(v.status == VaultStatus::Active, LegacyVaultError::VaultNotActive);

        let idx = &ctx.accounts.index;
        let n = idx.beneficiaries.len();
        require!(ctx.remaining_accounts.len() == n, LegacyVaultError::InvalidBatch);

        let mut total: u32 = 0;
        for i in 0..n {
            let ai = &ctx.remaining_accounts[i];
            let be: Account<BeneficiaryEntry> = Account::try_from(ai)?;
            require_keys_eq!(be.vault, v.key(), LegacyVaultError::IndexMismatch);
            require!(be.active, LegacyVaultError::BeneficiaryNotActive);
            require!(be.beneficiary == idx.beneficiaries[i], LegacyVaultError::IndexMismatch);
            total = total.checked_add(be.share_bps as u32).ok_or(LegacyVaultError::MathOverflow)?;
        }
        require!(total == BPS_DENOMINATOR as u32, LegacyVaultError::SharesNot10k);
        Ok(())
    }

    // =========================
    // Asset rules
    // =========================

    pub fn set_asset_rule(ctx: Context<SetAssetRule>, mode: AssetRuleMode) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;
        let v = &ctx.accounts.vault;
        require_keys_eq!(v.owner, ctx.accounts.owner.key(), LegacyVaultError::Unauthorized);
        require!(v.status == VaultStatus::Active, LegacyVaultError::VaultNotActive);

        // If AssignAll, require assigned_beneficiary exists in index
        if mode == AssetRuleMode::AssignAll {
            require!(
                ctx.accounts.index.beneficiaries.binary_search(&ctx.accounts.assigned_beneficiary.key()).is_ok(),
                LegacyVaultError::InvalidAssetRule
            );
        }

        let now = now_ts()?;
        let r = &mut ctx.accounts.asset_rule;
        r.vault = v.key();
        r.mint = ctx.accounts.mint.key();
        r.mode = mode;
        r.assigned_beneficiary = ctx.accounts.assigned_beneficiary.key();
        r.updated_at_unix = now;

        emit!(AssetRuleSet {
            vault: v.key(),
            mint: r.mint,
            mode,
            assigned_beneficiary: r.assigned_beneficiary,
            ts: now
        });
        Ok(())
    }

    pub fn clear_asset_rule(ctx: Context<ClearAssetRule>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;
        let v = &ctx.accounts.vault;
        require_keys_eq!(v.owner, ctx.accounts.owner.key(), LegacyVaultError::Unauthorized);
        require!(v.status == VaultStatus::Active, LegacyVaultError::VaultNotActive);
        // close handled in context
        Ok(())
    }

    // =========================
    // Deposits / withdrawals
    // =========================

    pub fn deposit_sol(ctx: Context<DepositSol>, lamports: u64) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;
        let v = &ctx.accounts.vault;
        require_keys_eq!(v.owner, ctx.accounts.owner.key(), LegacyVaultError::Unauthorized);
        require!(v.status == VaultStatus::Active, LegacyVaultError::VaultNotActive);

        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.owner.key(),
            &ctx.accounts.vault.key(),
            lamports,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.owner.to_account_info(),
                ctx.accounts.vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        emit!(SolDeposited { vault: v.key(), owner: v.owner, lamports, ts: now_ts()? });
        Ok(())
    }

    pub fn withdraw_sol(ctx: Context<WithdrawSol>, lamports: u64) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;
        let v = &mut ctx.accounts.vault;
        require_keys_eq!(v.owner, ctx.accounts.owner.key(), LegacyVaultError::Unauthorized);
        require!(v.status == VaultStatus::Active, LegacyVaultError::VaultNotActive);

        // Disallow withdrawals if unlocking
        // (status already Active ensures)

        let rent_min = rent_min_for(Vault::LEN)?;
        let vault_lamports = **v.to_account_info().try_borrow_lamports()?;
        require!(vault_lamports.saturating_sub(rent_min) >= lamports, LegacyVaultError::MathOverflow);

        **v.to_account_info().try_borrow_mut_lamports()? -= lamports;
        **ctx.accounts.owner.to_account_info().try_borrow_mut_lamports()? += lamports;

        emit!(SolWithdrawn { vault: v.key(), owner: v.owner, lamports, ts: now_ts()? });
        Ok(())
    }

    pub fn deposit_spl(ctx: Context<DepositSpl>, amount: u64) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;
        let v = &ctx.accounts.vault;
        require_keys_eq!(v.owner, ctx.accounts.owner.key(), LegacyVaultError::Unauthorized);
        require!(v.status == VaultStatus::Active, LegacyVaultError::VaultNotActive);

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.owner_ata.to_account_info(),
                    to: ctx.accounts.vault_ata.to_account_info(),
                    authority: ctx.accounts.owner.to_account_info(),
                }
            ),
            amount
        )?;

        emit!(SplDeposited { vault: v.key(), owner: v.owner, mint: ctx.accounts.mint.key(), amount, ts: now_ts()? });
        Ok(())
    }

    pub fn withdraw_spl(ctx: Context<WithdrawSpl>, amount: u64) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;
        let v = &ctx.accounts.vault;
        require_keys_eq!(v.owner, ctx.accounts.owner.key(), LegacyVaultError::Unauthorized);
        require!(v.status == VaultStatus::Active, LegacyVaultError::VaultNotActive);

        let signer_seeds: &[&[&[u8]]] = &[&[
            VAULT_AUTH_SEED,
            ctx.accounts.vault.key().as_ref(),
            &[ctx.bumps.vault_auth],
        ]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault_ata.to_account_info(),
                    to: ctx.accounts.owner_ata.to_account_info(),
                    authority: ctx.accounts.vault_auth.to_account_info(),
                },
                signer_seeds,
            ),
            amount
        )?;

        emit!(SplWithdrawn { vault: v.key(), owner: v.owner, mint: ctx.accounts.mint.key(), amount, ts: now_ts()? });
        Ok(())
    }

    // =========================
    // Liveness
    // =========================

    pub fn check_in(ctx: Context<CheckIn>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;
        let v = &mut ctx.accounts.vault;
        require_keys_eq!(v.owner, ctx.accounts.owner.key(), LegacyVaultError::Unauthorized);
        require!(v.status == VaultStatus::Active, LegacyVaultError::VaultNotActive);

        v.last_checkin_unix = now_ts()?;
        emit!(CheckIn { vault: v.key(), by: v.owner, ts: v.last_checkin_unix });
        Ok(())
    }

    pub fn add_liveness_delegate(ctx: Context<AddLivenessDelegate>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;
        let v = &ctx.accounts.vault;
        require_keys_eq!(v.owner, ctx.accounts.owner.key(), LegacyVaultError::Unauthorized);
        require!(v.status == VaultStatus::Active, LegacyVaultError::VaultNotActive);

        let now = now_ts()?;
        let d = &mut ctx.accounts.delegate_entry;
        d.vault = v.key();
        d.delegate = ctx.accounts.delegate.key();
        d.added_at_unix = now;
        d.active = true;
        Ok(())
    }

    pub fn remove_liveness_delegate(ctx: Context<RemoveLivenessDelegate>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;
        let v = &ctx.accounts.vault;
        require_keys_eq!(v.owner, ctx.accounts.owner.key(), LegacyVaultError::Unauthorized);
        require!(v.status == VaultStatus::Active, LegacyVaultError::VaultNotActive);

        ctx.accounts.delegate_entry.active = false;
        Ok(())
    }

    pub fn delegate_check_in(ctx: Context<DelegateCheckIn>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;

        let v = &mut ctx.accounts.vault;
        require!(v.status == VaultStatus::Active, LegacyVaultError::VaultNotActive);

        let d = &ctx.accounts.delegate_entry;
        require!(d.active, LegacyVaultError::Unauthorized);
        require_keys_eq!(d.delegate, ctx.accounts.delegate.key(), LegacyVaultError::Unauthorized);

        v.last_checkin_unix = now_ts()?;
        emit!(CheckIn { vault: v.key(), by: ctx.accounts.delegate.key(), ts: v.last_checkin_unix });
        Ok(())
    }

    // =========================
    // Freeze
    // =========================

    pub fn panic_freeze(ctx: Context<PanicFreeze>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;

        let v = &mut ctx.accounts.vault;
        require_keys_eq!(v.owner, ctx.accounts.owner.key(), LegacyVaultError::Unauthorized);
        require!(v.panic_enabled, LegacyVaultError::Unauthorized);

        v.status = VaultStatus::Frozen;
        emit!(PanicFrozen { vault: v.key(), ts: now_ts()? });
        Ok(())
    }

    pub fn unfreeze(ctx: Context<Unfreeze>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;

        let v = &mut ctx.accounts.vault;
        require_keys_eq!(v.owner, ctx.accounts.owner.key(), LegacyVaultError::Unauthorized);
        require!(v.status == VaultStatus::Frozen, LegacyVaultError::VaultFrozen);

        v.status = VaultStatus::Active;
        emit!(Unfrozen { vault: v.key(), ts: now_ts()? });
        Ok(())
    }

    // =========================
    // Unlock lifecycle
    // =========================

    pub fn initiate_unlock(ctx: Context<InitiateUnlock>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;

        let now = now_ts()?;
        let v = &mut ctx.accounts.vault;

        require!(v.status == VaultStatus::Active, LegacyVaultError::VaultNotActive);
        require!(v.guardian_threshold >= 1, LegacyVaultError::InvalidGuardianThreshold);
        require!(v.status != VaultStatus::Frozen, LegacyVaultError::VaultFrozen);

        // check inactivity
        let eligible_at = clamp_i64_add(v.last_checkin_unix, v.inactivity_threshold_secs as i64)?;
        require!(now >= eligible_at, LegacyVaultError::UnlockNotEligible);

        // guardian entry must be active
        require!(ctx.accounts.guardian_entry.active, LegacyVaultError::GuardianNotActive);

        // create unlock session
        v.status = VaultStatus::Unlocking;
        v.current_nonce = v.current_nonce.checked_add(1).ok_or(LegacyVaultError::MathOverflow)?;

        let u = &mut ctx.accounts.unlock;
        u.vault = v.key();
        u.nonce = v.current_nonce;
        u.status = UnlockStatus::Proposed;
        u.initiated_by = ctx.accounts.guardian.key();
        u.initiated_at_unix = now;
        u.approvals = 0;
        u.threshold = v.guardian_threshold;
        u.approved_at_unix = 0;
        u.executable_at_unix = 0;
        u.bump = ctx.bumps.unlock;

        emit!(UnlockInitiated { vault: v.key(), unlock: u.key(), nonce: u.nonce, initiated_by: u.initiated_by, ts: now });
        Ok(())
    }

    pub fn approve_unlock(ctx: Context<ApproveUnlock>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;
        let now = now_ts()?;

        let v = &ctx.accounts.vault;
        require!(v.status == VaultStatus::Unlocking, LegacyVaultError::VaultNotUnlocking);

        let u = &mut ctx.accounts.unlock;
        require!(u.status == UnlockStatus::Proposed || u.status == UnlockStatus::Approved, LegacyVaultError::UnlockWrongState);

        require!(ctx.accounts.guardian_entry.active, LegacyVaultError::GuardianNotActive);

        // approval PDA init ensures uniqueness
        let appr = &mut ctx.accounts.approval;
        appr.unlock = u.key();
        appr.guardian = ctx.accounts.guardian.key();
        appr.approved_at_unix = now;

        u.approvals = u.approvals.checked_add(1).ok_or(LegacyVaultError::MathOverflow)?;

        if u.approvals >= u.threshold as u16 {
            u.status = UnlockStatus::Approved;
            u.approved_at_unix = now;
            u.executable_at_unix = clamp_i64_add(now, v.timelock_secs as i64)?;
        }

        emit!(UnlockApproved { vault: v.key(), unlock: u.key(), guardian: appr.guardian, approvals: u.approvals, threshold: u.threshold, ts: now });
        Ok(())
    }

    pub fn cancel_unlock(ctx: Context<CancelUnlock>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;

        let now = now_ts()?;
        let v = &mut ctx.accounts.vault;
        require_keys_eq!(v.owner, ctx.accounts.owner.key(), LegacyVaultError::Unauthorized);
        require!(v.status == VaultStatus::Unlocking, LegacyVaultError::VaultNotUnlocking);

        let u = &mut ctx.accounts.unlock;
        require!(u.status != UnlockStatus::Executed, LegacyVaultError::UnlockWrongState);

        u.status = UnlockStatus::Cancelled;
        v.status = VaultStatus::Active;

        emit!(UnlockCancelled { vault: v.key(), unlock: u.key(), ts: now });
        Ok(())
    }

    // =========================
    // Disputes
    // =========================

    pub fn open_dispute(ctx: Context<OpenDispute>, note_hash: [u8; 32]) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;
        let now = now_ts()?;

        let v = &ctx.accounts.vault;
        require!(v.status == VaultStatus::Unlocking, LegacyVaultError::VaultNotUnlocking);

        let u = &mut ctx.accounts.unlock;
        require!(u.status == UnlockStatus::Approved || u.status == UnlockStatus::Proposed, LegacyVaultError::UnlockWrongState);

        u.status = UnlockStatus::Disputed;

        let d = &mut ctx.accounts.dispute;
        d.unlock = u.key();
        d.opened_by = ctx.accounts.opener.key();
        d.opened_at_unix = now;
        d.status = DisputeStatus::Open;
        d.note_hash = note_hash;

        emit!(DisputeOpened { unlock: u.key(), opened_by: d.opened_by, note_hash, ts: now });
        Ok(())
    }

    pub fn resolve_dispute_cancel(ctx: Context<ResolveDispute>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;
        require_keys_eq!(cfg.arbiter, ctx.accounts.arbiter.key(), LegacyVaultError::Unauthorized);

        let now = now_ts()?;
        let v = &mut ctx.accounts.vault;
        let u = &mut ctx.accounts.unlock;

        require!(u.status == UnlockStatus::Disputed, LegacyVaultError::UnlockWrongState);

        u.status = UnlockStatus::Cancelled;
        v.status = VaultStatus::Active;

        ctx.accounts.dispute.status = DisputeStatus::ResolvedCancel;

        emit!(DisputeResolved { unlock: u.key(), status: ctx.accounts.dispute.status, ts: now });
        Ok(())
    }

    pub fn resolve_dispute_proceed(ctx: Context<ResolveDispute>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;
        require_keys_eq!(cfg.arbiter, ctx.accounts.arbiter.key(), LegacyVaultError::Unauthorized);

        let now = now_ts()?;
        let u = &mut ctx.accounts.unlock;

        require!(u.status == UnlockStatus::Disputed, LegacyVaultError::UnlockWrongState);

        // return to Approved if approvals already reached; else Proposed
        if u.approvals >= u.threshold as u16 {
            u.status = UnlockStatus::Approved;
        } else {
            u.status = UnlockStatus::Proposed;
        }

        ctx.accounts.dispute.status = DisputeStatus::ResolvedProceed;

        emit!(DisputeResolved { unlock: u.key(), status: ctx.accounts.dispute.status, ts: now });
        Ok(())
    }

    // =========================
    // Distribution (SOL)
    // =========================

    pub fn init_distribution_sol_session(ctx: Context<InitDistributionSolSession>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;
        let now = now_ts()?;

        let v = &ctx.accounts.vault;
        require!(v.status == VaultStatus::Unlocking, LegacyVaultError::VaultNotUnlocking);

        let u = &ctx.accounts.unlock;
        require!(u.status == UnlockStatus::Approved, LegacyVaultError::UnlockWrongState);
        require!(now >= u.executable_at_unix, LegacyVaultError::TimelockNotElapsed);

        // total distributable = vault lamports - rent_min(Vault)
        let rent_min = rent_min_for(Vault::LEN)?;
        let vault_lamports = **ctx.accounts.vault.to_account_info().try_borrow_lamports()?;
        let distributable = vault_lamports.saturating_sub(rent_min);

        let s = &mut ctx.accounts.dist_sol;
        s.unlock = u.key();
        s.total_distributable = distributable;
        s.paid_total = 0;
        s.cursor = 0;
        s.done = distributable == 0;
        s.initialized_at_unix = now;
        s.bump = ctx.bumps.dist_sol;

        emit!(SolDistributionInitialized { unlock: u.key(), total_distributable: distributable, ts: now });
        Ok(())
    }

    /// Remaining accounts per item (2 per beneficiary in batch):
    /// - BeneficiaryEntry PDA (read-only)
    /// - Beneficiary wallet (writable)
    pub fn execute_distribution_sol_batch(ctx: Context<ExecuteDistributionSolBatch>, start_index: u32, batch_size: u16) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;
        let now = now_ts()?;

        let v = &mut ctx.accounts.vault;
        require!(v.status == VaultStatus::Unlocking, LegacyVaultError::VaultNotUnlocking);

        let u = &ctx.accounts.unlock;
        require!(u.status == UnlockStatus::Approved, LegacyVaultError::UnlockWrongState);
        require!(now >= u.executable_at_unix, LegacyVaultError::TimelockNotElapsed);

        let idx = &ctx.accounts.index;
        let total = idx.beneficiaries.len() as u32;
        require!(total > 0, LegacyVaultError::InvalidBatch);

        let s = &mut ctx.accounts.dist_sol;
        require!(!s.done, LegacyVaultError::DistributionAlreadyDone);
        require!(start_index == s.cursor, LegacyVaultError::InvalidBatch);

        let bs = batch_size as u32;
        require!(bs > 0, LegacyVaultError::InvalidBatch);
        require!(start_index < total, LegacyVaultError::InvalidBatch);

        let end = (start_index + bs).min(total);
        let actual = end - start_index;

        // remaining_accounts must be 2*actual
        require!(ctx.remaining_accounts.len() == (2 * actual) as usize, LegacyVaultError::InvalidBatch);

        // Pay out floor amounts, remainder goes to last beneficiary overall (index == total-1)
        for j in 0..actual {
            let global_i = start_index + j;
            let be_ai = &ctx.remaining_accounts[(2 * j) as usize];
            let bw_ai = &ctx.remaining_accounts[(2 * j + 1) as usize];

            let be: Account<BeneficiaryEntry> = Account::try_from(be_ai)?;
            require!(be.active, LegacyVaultError::BeneficiaryNotActive);
            require_keys_eq!(be.vault, v.key(), LegacyVaultError::IndexMismatch);
            require_keys_eq!(be.beneficiary, idx.beneficiaries[global_i as usize], LegacyVaultError::IndexMismatch);
            require_keys_eq!(bw_ai.key(), be.beneficiary, LegacyVaultError::IndexMismatch);
            require!(bw_ai.is_writable, LegacyVaultError::Unauthorized);

            let mut pay = u128_mul_div_floor(
                s.total_distributable,
                be.share_bps as u64,
                BPS_DENOMINATOR as u64
            )?;

            // last beneficiary gets remainder
            if global_i == total - 1 {
                let remainder = s.total_distributable
                    .checked_sub(s.paid_total)
                    .ok_or(LegacyVaultError::MathOverflow)?;
                pay = remainder;
            } else {
                // ensure we don't overpay due to rounding + batch ordering
                // (paid_total tracked ensures remainder correct at end)
            }

            if pay > 0 {
                **v.to_account_info().try_borrow_mut_lamports()? -= pay;
                **bw_ai.try_borrow_mut_lamports()? += pay;
                s.paid_total = s.paid_total.checked_add(pay).ok_or(LegacyVaultError::MathOverflow)?;
            }
        }

        s.cursor = end;
        if s.cursor >= total {
            s.done = true;
        }

        emit!(SolDistributionBatchExecuted {
            unlock: u.key(),
            start_index,
            batch_size: actual as u16,
            new_cursor: s.cursor,
            ts: now
        });

        Ok(())
    }

    // =========================
    // Distribution (SPL)
    // =========================

    pub fn init_distribution_spl_session(ctx: Context<InitDistributionSplSession>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;
        let now = now_ts()?;

        let v = &ctx.accounts.vault;
        require!(v.status == VaultStatus::Unlocking, LegacyVaultError::VaultNotUnlocking);

        let u = &ctx.accounts.unlock;
        require!(u.status == UnlockStatus::Approved, LegacyVaultError::UnlockWrongState);
        require!(now >= u.executable_at_unix, LegacyVaultError::TimelockNotElapsed);

        let bal = ctx.accounts.vault_ata.amount;

        let s = &mut ctx.accounts.dist_spl;
        s.unlock = u.key();
        s.mint = ctx.accounts.mint.key();
        s.total_balance = bal;
        s.paid_total = 0;
        s.cursor = 0;
        s.done = bal == 0;
        s.initialized_at_unix = now;
        s.bump = ctx.bumps.dist_spl;

        emit!(SplDistributionInitialized { unlock: u.key(), mint: s.mint, total_balance: bal, ts: now });
        Ok(())
    }

    /// Remaining accounts per item (3 per beneficiary in batch):
    /// - BeneficiaryEntry PDA (read-only)
    /// - Beneficiary wallet (read-only)
    /// - Beneficiary ATA for mint (writable)
    pub fn execute_distribution_spl_batch(ctx: Context<ExecuteDistributionSplBatch>, start_index: u32, batch_size: u16) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;
        let now = now_ts()?;

        let v = &ctx.accounts.vault;
        require!(v.status == VaultStatus::Unlocking, LegacyVaultError::VaultNotUnlocking);

        let u = &ctx.accounts.unlock;
        require!(u.status == UnlockStatus::Approved, LegacyVaultError::UnlockWrongState);
        require!(now >= u.executable_at_unix, LegacyVaultError::TimelockNotElapsed);

        let idx = &ctx.accounts.index;
        let total = idx.beneficiaries.len() as u32;
        require!(total > 0, LegacyVaultError::InvalidBatch);

        let s = &mut ctx.accounts.dist_spl;
        require!(!s.done, LegacyVaultError::DistributionAlreadyDone);
        require!(start_index == s.cursor, LegacyVaultError::InvalidBatch);

        let bs = batch_size as u32;
        require!(bs > 0, LegacyVaultError::InvalidBatch);
        require!(start_index < total, LegacyVaultError::InvalidBatch);

        let end = (start_index + bs).min(total);
        let actual = end - start_index;

        require!(ctx.remaining_accounts.len() == (3 * actual) as usize, LegacyVaultError::InvalidBatch);

        let signer_seeds: &[&[&[u8]]] = &[&[
            VAULT_AUTH_SEED,
            ctx.accounts.vault.key().as_ref(),
            &[ctx.bumps.vault_auth],
        ]];

        for j in 0..actual {
            let global_i = start_index + j;

            let be_ai = &ctx.remaining_accounts[(3*j) as usize];
            let bw_ai = &ctx.remaining_accounts[(3*j + 1) as usize];
            let ata_ai = &ctx.remaining_accounts[(3*j + 2) as usize];

            let be: Account<BeneficiaryEntry> = Account::try_from(be_ai)?;
            require!(be.active, LegacyVaultError::BeneficiaryNotActive);
            require_keys_eq!(be.vault, v.key(), LegacyVaultError::IndexMismatch);
            require_keys_eq!(be.beneficiary, idx.beneficiaries[global_i as usize], LegacyVaultError::IndexMismatch);
            require_keys_eq!(bw_ai.key(), be.beneficiary, LegacyVaultError::IndexMismatch);

            // Validate ATA fields
            let ata: Account<TokenAccount> = Account::try_from(ata_ai)?;
            require_keys_eq!(ata.owner, be.beneficiary, LegacyVaultError::InvalidTokenAccount);
            require_keys_eq!(ata.mint, ctx.accounts.mint.key(), LegacyVaultError::InvalidTokenAccount);

            let mut pay = u128_mul_div_floor(
                s.total_balance,
                be.share_bps as u64,
                BPS_DENOMINATOR as u64
            )?;

            if global_i == total - 1 {
                let remainder = s.total_balance
                    .checked_sub(s.paid_total)
                    .ok_or(LegacyVaultError::MathOverflow)?;
                pay = remainder;
            }

            if pay > 0 {
                token::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        Transfer {
                            from: ctx.accounts.vault_ata.to_account_info(),
                            to: ata.to_account_info(),
                            authority: ctx.accounts.vault_auth.to_account_info(),
                        },
                        signer_seeds,
                    ),
                    pay
                )?;
                s.paid_total = s.paid_total.checked_add(pay).ok_or(LegacyVaultError::MathOverflow)?;
            }
        }

        s.cursor = end;
        if s.cursor >= total {
            s.done = true;
        }

        emit!(SplDistributionBatchExecuted {
            unlock: u.key(),
            mint: ctx.accounts.mint.key(),
            start_index,
            batch_size: actual as u16,
            new_cursor: s.cursor,
            done: s.done,
            ts: now
        });

        Ok(())
    }

    pub fn finalize_unlock(ctx: Context<FinalizeUnlock>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;
        let now = now_ts()?;

        let v = &mut ctx.accounts.vault;
        require!(v.status == VaultStatus::Unlocking, LegacyVaultError::VaultNotUnlocking);

        let u = &mut ctx.accounts.unlock;
        require!(u.status == UnlockStatus::Approved, LegacyVaultError::UnlockWrongState);

        // Remaining accounts must include:
        // - dist_sol session (already in accounts)
        // - all dist_spl sessions that should be considered complete (as Account<DistributionSplSession>)
        require!(ctx.accounts.dist_sol.done, LegacyVaultError::ThresholdNotReached);

        for ai in ctx.remaining_accounts.iter() {
            let ds: Account<DistributionSplSession> = Account::try_from(ai)?;
            require_keys_eq!(ds.unlock, u.key(), LegacyVaultError::Unauthorized);
            require!(ds.done, LegacyVaultError::ThresholdNotReached);
        }

        u.status = UnlockStatus::Executed;
        v.status = VaultStatus::Distributed;

        emit!(UnlockFinalized { vault: v.key(), unlock: u.key(), ts: now });
        Ok(())
    }

    // =========================
    // Subscription (full build)
    // =========================

    pub fn set_subscription(ctx: Context<SetSubscription>, plan_id: u8, valid_until_unix: i64) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;
        // allow admin OR billing authority
        require!(
            ctx.accounts.authority.key() == cfg.admin || ctx.accounts.authority.key() == cfg.billing_authority,
            LegacyVaultError::Unauthorized
        );

        let now = now_ts()?;
        let sub = &mut ctx.accounts.subscription;
        sub.vault = ctx.accounts.vault.key();
        sub.plan_id = plan_id;
        sub.valid_until_unix = valid_until_unix;
        sub.updated_at_unix = now;

        emit!(SubscriptionSet { vault: ctx.accounts.vault.key(), plan_id, valid_until_unix, ts: now });
        Ok(())
    }

    pub fn renew_subscription(ctx: Context<RenewSubscription>, plan_id: u8, add_secs: i64, fee_lamports: u64) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;
        let now = now_ts()?;

        // Collect fee in SOL to treasury
        if fee_lamports > 0 {
            let ix = anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.payer.key(),
                &cfg.treasury,
                fee_lamports,
            );
            anchor_lang::solana_program::program::invoke(
                &ix,
                &[
                    ctx.accounts.payer.to_account_info(),
                    ctx.accounts.treasury.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
            )?;
        }

        let sub = &mut ctx.accounts.subscription;
        sub.vault = ctx.accounts.vault.key();
        sub.plan_id = plan_id;

        let base = if sub.valid_until_unix > now { sub.valid_until_unix } else { now };
        sub.valid_until_unix = clamp_i64_add(base, add_secs)?;
        sub.updated_at_unix = now;

        emit!(SubscriptionSet { vault: ctx.accounts.vault.key(), plan_id, valid_until_unix: sub.valid_until_unix, ts: now });
        Ok(())
    }

    // =========================
    // Professional guardians
    // =========================

    pub fn register_guardian_profile(
        ctx: Context<RegisterGuardianProfile>,
        display_name: Vec<u8>,
        website_uri: Vec<u8>,
    ) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;
        let now = now_ts()?;

        require!(display_name.len() <= PROFILE_NAME_MAX, LegacyVaultError::InvalidDocUriLen);
        require!(website_uri.len() <= PROFILE_WEBSITE_MAX, LegacyVaultError::InvalidDocUriLen);

        let p = &mut ctx.accounts.profile;
        p.guardian = ctx.accounts.guardian.key();
        p.display_name = bytes_to_fixed::<PROFILE_NAME_MAX>(&display_name)?;
        p.website_uri = bytes_to_fixed::<PROFILE_WEBSITE_MAX>(&website_uri)?;
        // do not set kyc_level here (admin does)
        if p.updated_at_unix == 0 {
            p.kyc_level = 0;
            p.active = true;
        }
        p.updated_at_unix = now;

        emit!(GuardianProfileRegistered { guardian: p.guardian, ts: now });
        Ok(())
    }

    pub fn set_guardian_kyc_level(ctx: Context<SetGuardianKycLevel>, level: u8, active: bool) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;
        require_keys_eq!(cfg.admin, ctx.accounts.admin.key(), LegacyVaultError::Unauthorized);

        let now = now_ts()?;
        let p = &mut ctx.accounts.profile;
        p.kyc_level = level;
        p.active = active;
        p.updated_at_unix = now;
        Ok(())
    }

    // =========================
    // Bonds (SOL-based)
    // =========================

    pub fn create_or_topup_guardian_bond(ctx: Context<CreateOrTopupGuardianBond>, lamports: u64) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;
        let now = now_ts()?;

        // Transfer lamports into bond account (PDA)
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.guardian.key(),
            &ctx.accounts.bond.key(),
            lamports,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.guardian.to_account_info(),
                ctx.accounts.bond.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        let b = &mut ctx.accounts.bond;
        b.guardian = ctx.accounts.guardian.key();
        b.amount = b.amount.checked_add(lamports).ok_or(LegacyVaultError::MathOverflow)?;
        b.updated_at_unix = now;

        emit!(GuardianBondUpdated { guardian: b.guardian, amount: b.amount, locked: b.locked, ts: now });
        Ok(())
    }

    pub fn set_bond_locked(ctx: Context<SetBondLocked>, locked: bool) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;
        require!(
            ctx.accounts.admin.key() == cfg.admin || ctx.accounts.admin.key() == cfg.arbiter,
            LegacyVaultError::Unauthorized
        );

        let now = now_ts()?;
        let b = &mut ctx.accounts.bond;
        b.locked = locked;
        b.updated_at_unix = now;
        emit!(GuardianBondUpdated { guardian: b.guardian, amount: b.amount, locked: b.locked, ts: now });
        Ok(())
    }

    pub fn withdraw_guardian_bond(ctx: Context<WithdrawGuardianBond>, lamports: u64) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;
        let now = now_ts()?;

        let b = &mut ctx.accounts.bond;
        require_keys_eq!(b.guardian, ctx.accounts.guardian.key(), LegacyVaultError::Unauthorized);
        require!(!b.locked, LegacyVaultError::BondLocked);

        // ensure bond PDA retains rent min
        let rent_min = rent_min_for(GuardianBond::LEN)?;
        let bal = **ctx.accounts.bond.to_account_info().try_borrow_lamports()?;
        require!(bal.saturating_sub(rent_min) >= lamports, LegacyVaultError::BondInsufficient);
        require!(b.amount >= lamports, LegacyVaultError::BondInsufficient);

        **ctx.accounts.bond.to_account_info().try_borrow_mut_lamports()? -= lamports;
        **ctx.accounts.guardian.to_account_info().try_borrow_mut_lamports()? += lamports;

        b.amount = b.amount.checked_sub(lamports).ok_or(LegacyVaultError::MathOverflow)?;
        b.updated_at_unix = now;

        emit!(GuardianBondUpdated { guardian: b.guardian, amount: b.amount, locked: b.locked, ts: now });
        Ok(())
    }

    pub fn slash_guardian_bond(ctx: Context<SlashGuardianBond>, lamports: u64) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_not_paused(cfg.paused)?;
        require_keys_eq!(cfg.arbiter, ctx.accounts.arbiter.key(), LegacyVaultError::Unauthorized);

        let now = now_ts()?;
        let b = &mut ctx.accounts.bond;

        let rent_min = rent_min_for(GuardianBond::LEN)?;
        let bal = **ctx.accounts.bond.to_account_info().try_borrow_lamports()?;
        require!(bal.saturating_sub(rent_min) >= lamports, LegacyVaultError::BondInsufficient);
        require!(b.amount >= lamports, LegacyVaultError::BondInsufficient);

        **ctx.accounts.bond.to_account_info().try_borrow_mut_lamports()? -= lamports;
        **ctx.accounts.treasury.to_account_info().try_borrow_mut_lamports()? += lamports;

        b.amount = b.amount.checked_sub(lamports).ok_or(LegacyVaultError::MathOverflow)?;
        b.updated_at_unix = now;

        emit!(GuardianBondUpdated { guardian: b.guardian, amount: b.amount, locked: b.locked, ts: now });
        Ok(())
    }
}

// ============================================================
// Contexts
// ============================================================

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(init, payer = admin, space = GlobalConfig::LEN, seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    #[account(mut)]
    pub admin: Signer<'info>,
    /// CHECK: treasury system account
    #[account(mut)]
    pub treasury: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetPaused<'info> {
    #[account(mut, seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    pub admin: Signer<'info>,
}
#[derive(Accounts)]
pub struct SetArbiter<'info> {
    #[account(mut, seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    pub admin: Signer<'info>,
}
#[derive(Accounts)]
pub struct SetFees<'info> {
    #[account(mut, seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    pub admin: Signer<'info>,
}
#[derive(Accounts)]
pub struct SetBounds<'info> {
    #[account(mut, seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(vault_id: u64)]
pub struct CreateVault<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,

    #[account(
        init,
        payer = owner,
        space = Vault::LEN,
        seeds = [VAULT_SEED, owner.key().as_ref(), &vault_id.to_le_bytes()],
        bump
    )]
    pub vault: Account<'info, Vault>,

    /// CHECK: PDA authority for token accounts
    #[account(seeds = [VAULT_AUTH_SEED, vault.key().as_ref()], bump)]
    pub vault_auth: UncheckedAccount<'info>,

    #[account(
        init,
        payer = owner,
        space = VaultIndex::LEN,
        seeds = [INDEX_SEED, vault.key().as_ref()],
        bump
    )]
    pub index: Account<'info, VaultIndex>,

    #[account(mut)]
    pub owner: Signer<'info>,

    /// CHECK
    #[account(mut, address = config.treasury)]
    pub treasury: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CloseVault<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetDocument<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct AddGuardian<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(mut, seeds = [INDEX_SEED, vault.key().as_ref()], bump)]
    pub index: Account<'info, VaultIndex>,

    #[account(
        init,
        payer = owner,
        space = GuardianEntry::LEN,
        seeds = [GUARDIAN_SEED, vault.key().as_ref(), guardian.key().as_ref()],
        bump
    )]
    pub guardian_entry: Account<'info, GuardianEntry>,

    /// CHECK
    pub guardian: UncheckedAccount<'info>,

    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RemoveGuardian<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(mut, seeds = [INDEX_SEED, vault.key().as_ref()], bump)]
    pub index: Account<'info, VaultIndex>,

    #[account(
        mut,
        seeds = [GUARDIAN_SEED, vault.key().as_ref(), guardian.key().as_ref()],
        bump,
        close = owner
    )]
    pub guardian_entry: Account<'info, GuardianEntry>,

    /// CHECK
    pub guardian: UncheckedAccount<'info>,

    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetGuardianThreshold<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(seeds = [INDEX_SEED, vault.key().as_ref()], bump)]
    pub index: Account<'info, VaultIndex>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct AddBeneficiary<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(mut, seeds = [INDEX_SEED, vault.key().as_ref()], bump)]
    pub index: Account<'info, VaultIndex>,

    #[account(
        init,
        payer = owner,
        space = BeneficiaryEntry::LEN,
        seeds = [BENEFICIARY_SEED, vault.key().as_ref(), beneficiary.key().as_ref()],
        bump
    )]
    pub beneficiary_entry: Account<'info, BeneficiaryEntry>,

    /// CHECK
    pub beneficiary: UncheckedAccount<'info>,

    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateBeneficiary<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(mut, seeds = [INDEX_SEED, vault.key().as_ref()], bump)]
    pub index: Account<'info, VaultIndex>,

    #[account(
        mut,
        seeds = [BENEFICIARY_SEED, vault.key().as_ref(), beneficiary.key().as_ref()],
        bump
    )]
    pub beneficiary_entry: Account<'info, BeneficiaryEntry>,

    /// CHECK
    pub beneficiary: UncheckedAccount<'info>,

    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct RemoveBeneficiary<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(mut, seeds = [INDEX_SEED, vault.key().as_ref()], bump)]
    pub index: Account<'info, VaultIndex>,

    #[account(
        mut,
        seeds = [BENEFICIARY_SEED, vault.key().as_ref(), beneficiary.key().as_ref()],
        bump,
        close = owner
    )]
    pub beneficiary_entry: Account<'info, BeneficiaryEntry>,

    /// CHECK
    pub beneficiary: UncheckedAccount<'info>,

    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct AssertBeneficiaryTotal10k<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    pub vault: Account<'info, Vault>,
    #[account(seeds = [INDEX_SEED, vault.key().as_ref()], bump)]
    pub index: Account<'info, VaultIndex>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetAssetRule<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    pub vault: Account<'info, Vault>,
    #[account(seeds = [INDEX_SEED, vault.key().as_ref()], bump)]
    pub index: Account<'info, VaultIndex>,
    pub mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = owner,
        space = AssetRule::LEN,
        seeds = [ASSET_RULE_SEED, vault.key().as_ref(), mint.key().as_ref()],
        bump
    )]
    pub asset_rule: Account<'info, AssetRule>,

    /// CHECK
    pub assigned_beneficiary: UncheckedAccount<'info>,

    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClearAssetRule<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    pub vault: Account<'info, Vault>,
    pub mint: Account<'info, Mint>,
    #[account(
        mut,
        seeds = [ASSET_RULE_SEED, vault.key().as_ref(), mint.key().as_ref()],
        bump,
        close = owner
    )]
    pub asset_rule: Account<'info, AssetRule>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct DepositSol<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct WithdrawSol<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositSpl<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    pub vault: Account<'info, Vault>,

    /// CHECK
    #[account(seeds = [VAULT_AUTH_SEED, vault.key().as_ref()], bump)]
    pub vault_auth: UncheckedAccount<'info>,

    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut, associated_token::mint = mint, associated_token::authority = owner)]
    pub owner_ata: Account<'info, TokenAccount>,

    #[account(init_if_needed, payer = owner, associated_token::mint = mint, associated_token::authority = vault_auth)]
    pub vault_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct WithdrawSpl<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    pub vault: Account<'info, Vault>,

    /// CHECK
    #[account(seeds = [VAULT_AUTH_SEED, vault.key().as_ref()], bump)]
    pub vault_auth: UncheckedAccount<'info>,

    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(init_if_needed, payer = owner, associated_token::mint = mint, associated_token::authority = owner)]
    pub owner_ata: Account<'info, TokenAccount>,

    #[account(mut, associated_token::mint = mint, associated_token::authority = vault_auth)]
    pub vault_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CheckIn<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct AddLivenessDelegate<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    pub vault: Account<'info, Vault>,

    #[account(
        init,
        payer = owner,
        space = LivenessDelegate::LEN,
        seeds = [DELEGATE_SEED, vault.key().as_ref(), delegate.key().as_ref()],
        bump
    )]
    pub delegate_entry: Account<'info, LivenessDelegate>,

    /// CHECK
    pub delegate: UncheckedAccount<'info>,

    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RemoveLivenessDelegate<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    pub vault: Account<'info, Vault>,
    #[account(
        mut,
        seeds = [DELEGATE_SEED, vault.key().as_ref(), delegate.key().as_ref()],
        bump,
        close = owner
    )]
    pub delegate_entry: Account<'info, LivenessDelegate>,
    /// CHECK
    pub delegate: UncheckedAccount<'info>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct DelegateCheckIn<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(seeds = [DELEGATE_SEED, vault.key().as_ref(), delegate.key().as_ref()], bump)]
    pub delegate_entry: Account<'info, LivenessDelegate>,
    pub delegate: Signer<'info>,
}

#[derive(Accounts)]
pub struct PanicFreeze<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    pub owner: Signer<'info>,
}
#[derive(Accounts)]
pub struct Unfreeze<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitiateUnlock<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    #[account(mut)]
    pub vault: Account<'info, Vault>,

    #[account(
        seeds = [GUARDIAN_SEED, vault.key().as_ref(), guardian.key().as_ref()],
        bump
    )]
    pub guardian_entry: Account<'info, GuardianEntry>,

    #[account(
        init,
        payer = guardian,
        space = UnlockSession::LEN,
        seeds = [UNLOCK_SEED, vault.key().as_ref(), &(vault.current_nonce.wrapping_add(1)).to_le_bytes()],
        bump
    )]
    pub unlock: Account<'info, UnlockSession>,

    #[account(mut)]
    pub guardian: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ApproveUnlock<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    pub vault: Account<'info, Vault>,

    #[account(
        seeds = [GUARDIAN_SEED, vault.key().as_ref(), guardian.key().as_ref()],
        bump
    )]
    pub guardian_entry: Account<'info, GuardianEntry>,

    #[account(mut)]
    pub unlock: Account<'info, UnlockSession>,

    #[account(
        init,
        payer = guardian,
        space = GuardianApproval::LEN,
        seeds = [APPROVAL_SEED, unlock.key().as_ref(), guardian.key().as_ref()],
        bump
    )]
    pub approval: Account<'info, GuardianApproval>,

    #[account(mut)]
    pub guardian: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelUnlock<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub unlock: Account<'info, UnlockSession>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct OpenDispute<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub unlock: Account<'info, UnlockSession>,
    #[account(
        init_if_needed,
        payer = opener,
        space = DisputeCase::LEN,
        seeds = [DISPUTE_SEED, unlock.key().as_ref()],
        bump
    )]
    pub dispute: Account<'info, DisputeCase>,
    #[account(mut)]
    pub opener: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub unlock: Account<'info, UnlockSession>,
    #[account(mut, seeds = [DISPUTE_SEED, unlock.key().as_ref()], bump)]
    pub dispute: Account<'info, DisputeCase>,
    pub arbiter: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitDistributionSolSession<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    pub unlock: Account<'info, UnlockSession>,
    #[account(
        init,
        payer = payer,
        space = DistributionSolSession::LEN,
        seeds = [DIST_SOL_SEED, unlock.key().as_ref()],
        bump
    )]
    pub dist_sol: Account<'info, DistributionSolSession>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteDistributionSolBatch<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    pub unlock: Account<'info, UnlockSession>,
    pub index: Account<'info, VaultIndex>,
    #[account(mut, seeds = [DIST_SOL_SEED, unlock.key().as_ref()], bump)]
    pub dist_sol: Account<'info, DistributionSolSession>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitDistributionSplSession<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    pub vault: Account<'info, Vault>,
    pub unlock: Account<'info, UnlockSession>,

    /// CHECK
    #[account(seeds = [VAULT_AUTH_SEED, vault.key().as_ref()], bump)]
    pub vault_auth: UncheckedAccount<'info>,

    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = payer,
        space = DistributionSplSession::LEN,
        seeds = [DIST_SPL_SEED, unlock.key().as_ref(), mint.key().as_ref()],
        bump
    )]
    pub dist_spl: Account<'info, DistributionSplSession>,

    #[account(
        associated_token::mint = mint,
        associated_token::authority = vault_auth
    )]
    pub vault_ata: Account<'info, TokenAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteDistributionSplBatch<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,

    pub vault: Account<'info, Vault>,

    /// CHECK
    #[account(seeds = [VAULT_AUTH_SEED, vault.key().as_ref()], bump)]
    pub vault_auth: UncheckedAccount<'info>,

    pub unlock: Account<'info, UnlockSession>,
    pub index: Account<'info, VaultIndex>,

    pub mint: Account<'info, Mint>,

    #[account(mut, seeds = [DIST_SPL_SEED, unlock.key().as_ref(), mint.key().as_ref()], bump)]
    pub dist_spl: Account<'info, DistributionSplSession>,

    #[account(mut, associated_token::mint = mint, associated_token::authority = vault_auth)]
    pub vault_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct FinalizeUnlock<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub unlock: Account<'info, UnlockSession>,
    pub dist_sol: Account<'info, DistributionSolSession>,
    // remaining accounts: DistributionSplSession accounts
}

#[derive(Accounts)]
pub struct SetSubscription<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    pub vault: Account<'info, Vault>,
    #[account(
        init_if_needed,
        payer = payer,
        space = Subscription::LEN,
        seeds = [SUBSCRIPTION_SEED, vault.key().as_ref()],
        bump
    )]
    pub subscription: Account<'info, Subscription>,
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RenewSubscription<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    pub vault: Account<'info, Vault>,
    #[account(
        init_if_needed,
        payer = payer,
        space = Subscription::LEN,
        seeds = [SUBSCRIPTION_SEED, vault.key().as_ref()],
        bump
    )]
    pub subscription: Account<'info, Subscription>,
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK
    #[account(mut, address = config.treasury)]
    pub treasury: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterGuardianProfile<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    #[account(
        init_if_needed,
        payer = guardian,
        space = GuardianProfile::LEN,
        seeds = [GUARDIAN_PROFILE_SEED, guardian.key().as_ref()],
        bump
    )]
    pub profile: Account<'info, GuardianProfile>,
    #[account(mut)]
    pub guardian: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetGuardianKycLevel<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    pub admin: Signer<'info>,
    #[account(mut)]
    pub profile: Account<'info, GuardianProfile>,
}

#[derive(Accounts)]
pub struct CreateOrTopupGuardianBond<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    #[account(
        init_if_needed,
        payer = guardian,
        space = GuardianBond::LEN,
        seeds = [GUARDIAN_BOND_SEED, guardian.key().as_ref()],
        bump
    )]
    pub bond: Account<'info, GuardianBond>,
    #[account(mut)]
    pub guardian: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetBondLocked<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    pub admin: Signer<'info>,
    #[account(mut)]
    pub bond: Account<'info, GuardianBond>,
}

#[derive(Accounts)]
pub struct WithdrawGuardianBond<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    #[account(mut)]
    pub bond: Account<'info, GuardianBond>,
    #[account(mut)]
    pub guardian: Signer<'info>,
}

#[derive(Accounts)]
pub struct SlashGuardianBond<'info> {
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GlobalConfig>,
    pub arbiter: Signer<'info>,
    #[account(mut)]
    pub bond: Account<'info, GuardianBond>,
    /// CHECK
    #[account(mut, address = config.treasury)]
    pub treasury: UncheckedAccount<'info>,
}
2) TypeScript SDK (transaction builders + distribution batching)
This SDK assumes you have an Anchor Program instance for LegacyVault (IDL generated).

2.1 sdk/legacyvault/pdas.ts
TypeScript

import { PublicKey } from "@solana/web3.js";

export const SEEDS = {
  CONFIG: Buffer.from("config"),
  VAULT: Buffer.from("vault"),
  VAULT_AUTH: Buffer.from("vault_auth"),
  INDEX: Buffer.from("index"),

  GUARDIAN: Buffer.from("guardian"),
  BENEFICIARY: Buffer.from("beneficiary"),
  DELEGATE: Buffer.from("delegate"),

  ASSET_RULE: Buffer.from("asset_rule"),

  UNLOCK: Buffer.from("unlock"),
  APPROVAL: Buffer.from("approval"),

  DIST_SOL: Buffer.from("dist_sol"),
  DIST_SPL: Buffer.from("dist_spl"),

  DISPUTE: Buffer.from("dispute"),

  SUB: Buffer.from("sub"),

  G_PROFILE: Buffer.from("g_profile"),
  G_BOND: Buffer.from("g_bond"),
};

export function u64LE(x: bigint) {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(x);
  return b;
}

export function configPda(programId: PublicKey) {
  return PublicKey.findProgramAddressSync([SEEDS.CONFIG], programId);
}

export function vaultPda(programId: PublicKey, owner: PublicKey, vaultId: bigint) {
  return PublicKey.findProgramAddressSync([SEEDS.VAULT, owner.toBuffer(), u64LE(vaultId)], programId);
}

export function vaultAuthPda(programId: PublicKey, vault: PublicKey) {
  return PublicKey.findProgramAddressSync([SEEDS.VAULT_AUTH, vault.toBuffer()], programId);
}

export function indexPda(programId: PublicKey, vault: PublicKey) {
  return PublicKey.findProgramAddressSync([SEEDS.INDEX, vault.toBuffer()], programId);
}

export function guardianEntryPda(programId: PublicKey, vault: PublicKey, guardian: PublicKey) {
  return PublicKey.findProgramAddressSync([SEEDS.GUARDIAN, vault.toBuffer(), guardian.toBuffer()], programId);
}

export function beneficiaryEntryPda(programId: PublicKey, vault: PublicKey, beneficiary: PublicKey) {
  return PublicKey.findProgramAddressSync([SEEDS.BENEFICIARY, vault.toBuffer(), beneficiary.toBuffer()], programId);
}

export function delegateEntryPda(programId: PublicKey, vault: PublicKey, delegate: PublicKey) {
  return PublicKey.findProgramAddressSync([SEEDS.DELEGATE, vault.toBuffer(), delegate.toBuffer()], programId);
}

export function assetRulePda(programId: PublicKey, vault: PublicKey, mint: PublicKey) {
  return PublicKey.findProgramAddressSync([SEEDS.ASSET_RULE, vault.toBuffer(), mint.toBuffer()], programId);
}

export function unlockPda(programId: PublicKey, vault: PublicKey, nonce: bigint) {
  return PublicKey.findProgramAddressSync([SEEDS.UNLOCK, vault.toBuffer(), u64LE(nonce)], programId);
}

export function approvalPda(programId: PublicKey, unlock: PublicKey, guardian: PublicKey) {
  return PublicKey.findProgramAddressSync([SEEDS.APPROVAL, unlock.toBuffer(), guardian.toBuffer()], programId);
}

export function distSolPda(programId: PublicKey, unlock: PublicKey) {
  return PublicKey.findProgramAddressSync([SEEDS.DIST_SOL, unlock.toBuffer()], programId);
}

export function distSplPda(programId: PublicKey, unlock: PublicKey, mint: PublicKey) {
  return PublicKey.findProgramAddressSync([SEEDS.DIST_SPL, unlock.toBuffer(), mint.toBuffer()], programId);
}

export function disputePda(programId: PublicKey, unlock: PublicKey) {
  return PublicKey.findProgramAddressSync([SEEDS.DISPUTE, unlock.toBuffer()], programId);
}

export function subscriptionPda(programId: PublicKey, vault: PublicKey) {
  return PublicKey.findProgramAddressSync([SEEDS.SUB, vault.toBuffer()], programId);
}

export function guardianProfilePda(programId: PublicKey, guardian: PublicKey) {
  return PublicKey.findProgramAddressSync([SEEDS.G_PROFILE, guardian.toBuffer()], programId);
}

export function guardianBondPda(programId: PublicKey, guardian: PublicKey) {
  return PublicKey.findProgramAddressSync([SEEDS.G_BOND, guardian.toBuffer()], programId);
}
2.2 sdk/legacyvault/types.ts
TypeScript

import { PublicKey } from "@solana/web3.js";

export type BeneficiaryEntry = {
  pubkey: PublicKey;
  beneficiary: PublicKey;
  shareBps: number;
  active: boolean;
};

export type VaultIndex = {
  guardians: PublicKey[];
  beneficiaries: PublicKey[];
};

export function sortPubkeysAsc(keys: PublicKey[]): PublicKey[] {
  return [...keys].sort((a, b) => Buffer.compare(a.toBuffer(), b.toBuffer()));
}
2.3 sdk/legacyvault/tx.ts (core tx builders)
TypeScript

import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import BN from "bn.js";
import {
  approvalPda, assetRulePda, beneficiaryEntryPda, configPda, delegateEntryPda,
  distSolPda, distSplPda, guardianBondPda, guardianEntryPda, guardianProfilePda,
  indexPda, subscriptionPda, unlockPda, vaultAuthPda, vaultPda,
} from "./pdas";

export async function ixCreateVault(args: {
  program: Program;
  owner: PublicKey;
  vaultId: bigint;
  heartbeatSecs: number;
  inactivitySecs: number;
  timelockSecs: number;
  panicEnabled: boolean;
}) {
  const { program, owner, vaultId } = args;
  const [cfg] = configPda(program.programId);
  const [vault] = vaultPda(program.programId, owner, vaultId);
  const [vaultAuth] = vaultAuthPda(program.programId, vault);
  const [index] = indexPda(program.programId, vault);

  // treasury is read from config on-chain, but the context expects it; easiest is fetch config
  const cfgAcc: any = await program.account.globalConfig.fetch(cfg);
  const treasury = cfgAcc.treasury as PublicKey;

  return program.methods
    .createVault(
      new BN(vaultId.toString()),
      args.heartbeatSecs,
      args.inactivitySecs,
      args.timelockSecs,
      args.panicEnabled
    )
    .accounts({
      config: cfg,
      vault,
      vaultAuth,
      index,
      owner,
      treasury,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

export async function ixAddBeneficiary(args: {
  program: Program;
  owner: PublicKey;
  vault: PublicKey;
  beneficiary: PublicKey;
  shareBps: number;
  label16: number[]; // length 16
}) {
  const [cfg] = configPda(args.program.programId);
  const [index] = indexPda(args.program.programId, args.vault);
  const [be] = beneficiaryEntryPda(args.program.programId, args.vault, args.beneficiary);

  return args.program.methods
    .addBeneficiary(args.shareBps, args.label16)
    .accounts({
      config: cfg,
      vault: args.vault,
      index,
      beneficiaryEntry: be,
      beneficiary: args.beneficiary,
      owner: args.owner,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

export async function ixUpdateBeneficiary(args: {
  program: Program;
  owner: PublicKey;
  vault: PublicKey;
  beneficiary: PublicKey;
  shareBps: number;
  label16: number[];
  active: boolean;
}) {
  const [cfg] = configPda(args.program.programId);
  const [index] = indexPda(args.program.programId, args.vault);
  const [be] = beneficiaryEntryPda(args.program.programId, args.vault, args.beneficiary);

  return args.program.methods
    .updateBeneficiary(args.shareBps, args.label16, args.active)
    .accounts({
      config: cfg,
      vault: args.vault,
      index,
      beneficiaryEntry: be,
      beneficiary: args.beneficiary,
      owner: args.owner,
    })
    .instruction();
}

export async function ixAddGuardian(args: {
  program: Program;
  owner: PublicKey;
  vault: PublicKey;
  guardian: PublicKey;
  role: number; // enum
}) {
  const [cfg] = configPda(args.program.programId);
  const [index] = indexPda(args.program.programId, args.vault);
  const [ge] = guardianEntryPda(args.program.programId, args.vault, args.guardian);

  return args.program.methods
    .addGuardian(args.role)
    .accounts({
      config: cfg,
      vault: args.vault,
      index,
      guardianEntry: ge,
      guardian: args.guardian,
      owner: args.owner,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

export async function ixSetGuardianThreshold(args: {
  program: Program;
  owner: PublicKey;
  vault: PublicKey;
  threshold: number;
}) {
  const [cfg] = configPda(args.program.programId);
  const [index] = indexPda(args.program.programId, args.vault);

  return args.program.methods
    .setGuardianThreshold(args.threshold)
    .accounts({
      config: cfg,
      vault: args.vault,
      index,
      owner: args.owner,
    })
    .instruction();
}

export async function ixDepositSpl(args: {
  program: Program;
  owner: PublicKey;
  vault: PublicKey;
  mint: PublicKey;
  amount: BN;
}) {
  const [cfg] = configPda(args.program.programId);
  const [vaultAuth] = vaultAuthPda(args.program.programId, args.vault);

  const ownerAta = getAssociatedTokenAddressSync(args.mint, args.owner);
  const vaultAta = getAssociatedTokenAddressSync(args.mint, vaultAuth, true);

  return args.program.methods
    .depositSpl(args.amount)
    .accounts({
      config: cfg,
      vault: args.vault,
      vaultAuth,
      mint: args.mint,
      owner: args.owner,
      ownerAta,
      vaultAta,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
      systemProgram: SystemProgram.programId,
      rent: PublicKey.default,
    })
    .instruction();
}

export async function ixInitiateUnlock(args: {
  program: Program;
  vault: PublicKey;
  guardian: PublicKey;
  nonce: bigint; // caller usually fetches vault.currentNonce and adds 1
}) {
  const [cfg] = configPda(args.program.programId);
  const [ge] = guardianEntryPda(args.program.programId, args.vault, args.guardian);
  const [unlock] = unlockPda(args.program.programId, args.vault, args.nonce);

  return args.program.methods
    .initiateUnlock()
    .accounts({
      config: cfg,
      vault: args.vault,
      guardianEntry: ge,
      unlock,
      guardian: args.guardian,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

export async function ixApproveUnlock(args: {
  program: Program;
  vault: PublicKey;
  unlock: PublicKey;
  guardian: PublicKey;
}) {
  const [cfg] = configPda(args.program.programId);
  const [ge] = guardianEntryPda(args.program.programId, args.vault, args.guardian);
  const [approval] = approvalPda(args.program.programId, args.unlock, args.guardian);

  return args.program.methods
    .approveUnlock()
    .accounts({
      config: cfg,
      vault: args.vault,
      guardianEntry: ge,
      unlock: args.unlock,
      approval,
      guardian: args.guardian,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

export async function ixInitDistSol(args: {
  program: Program;
  vault: PublicKey;
  unlock: PublicKey;
  payer: PublicKey;
}) {
  const [cfg] = configPda(args.program.programId);
  const [distSol] = distSolPda(args.program.programId, args.unlock);

  return args.program.methods
    .initDistributionSolSession()
    .accounts({
      config: cfg,
      vault: args.vault,
      unlock: args.unlock,
      distSol,
      payer: args.payer,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

export async function ixInitDistSpl(args: {
  program: Program;
  vault: PublicKey;
  unlock: PublicKey;
  mint: PublicKey;
  payer: PublicKey;
}) {
  const [cfg] = configPda(args.program.programId);
  const [vaultAuth] = vaultAuthPda(args.program.programId, args.vault);
  const [distSpl] = distSplPda(args.program.programId, args.unlock, args.mint);
  const vaultAta = getAssociatedTokenAddressSync(args.mint, vaultAuth, true);

  return args.program.methods
    .initDistributionSplSession()
    .accounts({
      config: cfg,
      vault: args.vault,
      unlock: args.unlock,
      vaultAuth,
      mint: args.mint,
      distSpl,
      vaultAta,
      payer: args.payer,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}
2.4 sdk/legacyvault/distribute.ts (batch builders)
This is the part that actually builds the remaining accounts lists correctly using VaultIndex ordering.

TypeScript

import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import BN from "bn.js";
import { beneficiaryEntryPda, configPda, distSolPda, distSplPda, indexPda, vaultAuthPda } from "./pdas";

export async function buildSolDistributionBatches(args: {
  program: Program;
  vault: PublicKey;
  unlock: PublicKey;
  batchSize: number; // e.g., 10
}): Promise<TransactionInstruction[]> {
  const { program, vault, unlock, batchSize } = args;

  const [cfg] = configPda(program.programId);
  const [indexAddr] = indexPda(program.programId, vault);
  const [distSol] = distSolPda(program.programId, unlock);

  const index: any = await program.account.vaultIndex.fetch(indexAddr);
  const beneficiaries: PublicKey[] = index.beneficiaries;

  const ixs: TransactionInstruction[] = [];

  for (let start = 0; start < beneficiaries.length; start += batchSize) {
    const end = Math.min(start + batchSize, beneficiaries.length);
    const slice = beneficiaries.slice(start, end);

    const remaining = [];
    for (const b of slice) {
      const [be] = beneficiaryEntryPda(program.programId, vault, b);
      remaining.push({ pubkey: be, isSigner: false, isWritable: false });
      remaining.push({ pubkey: b, isSigner: false, isWritable: true });
    }

    const ix = await program.methods
      .executeDistributionSolBatch(start, end - start)
      .accounts({
        config: cfg,
        vault,
        unlock,
        index: indexAddr,
        distSol,
        systemProgram: SystemProgram.programId,
      })
      .remainingAccounts(remaining)
      .instruction();

    ixs.push(ix);
  }

  return ixs;
}

export async function buildSplDistributionBatches(args: {
  program: Program;
  vault: PublicKey;
  unlock: PublicKey;
  mint: PublicKey;
  batchSize: number;
}): Promise<TransactionInstruction[]> {
  const { program, vault, unlock, mint, batchSize } = args;

  const [cfg] = configPda(program.programId);
  const [indexAddr] = indexPda(program.programId, vault);
  const [vaultAuth] = vaultAuthPda(program.programId, vault);
  const [distSpl] = distSplPda(program.programId, unlock, mint);
  const vaultAta = getAssociatedTokenAddressSync(mint, vaultAuth, true);

  const index: any = await program.account.vaultIndex.fetch(indexAddr);
  const beneficiaries: PublicKey[] = index.beneficiaries;

  const ixs: TransactionInstruction[] = [];

  for (let start = 0; start < beneficiaries.length; start += batchSize) {
    const end = Math.min(start + batchSize, beneficiaries.length);
    const slice = beneficiaries.slice(start, end);

    const remaining = [];
    for (const b of slice) {
      const [be] = beneficiaryEntryPda(program.programId, vault, b);
      const ata = getAssociatedTokenAddressSync(mint, b);
      remaining.push({ pubkey: be, isSigner: false, isWritable: false });
      remaining.push({ pubkey: b, isSigner: false, isWritable: false });
      remaining.push({ pubkey: ata, isSigner: false, isWritable: true });
    }

    const ix = await program.methods
      .executeDistributionSplBatch(start, end - start)
      .accounts({
        config: cfg,
        vault,
        vaultAuth,
        unlock,
        index: indexAddr,
        mint,
        distSpl,
        vaultAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .remainingAccounts(remaining)
      .instruction();

    ixs.push(ix);
  }

  return ixs;
}





Below is a complete monorepo scaffold (code) for:

indexer/ (TypeScript; RPC WS logs + optional Helius webhook ingestion; Anchor event decoding)
api/ (TypeScript; SIWS auth + tx-builder endpoints)
notifier/ (TypeScript; cron + email/SMS templates; Postgres/Redis-backed queues)
web/ (Next.js App Router; wallet adapter; SIWS sign-in; core flows)
docker-compose.yml (Postgres + Redis; plus services so docker compose up brings up the stack)
I’m basing:

the webhook receiver on Helius’ webhook payload model + auth header support. 
1
SIWS message format on Phantom’s “Sign-In-With standards” docs. 
2
the Anchor event decoding approach on Anchor’s TS EventCoder/event decoding interface. 
3
the Next.js Solana integration skeleton on Solana’s Next.js frontend docs. 
4
Assumption: your Anchor program is already deployed and you have an IDL JSON for legacyvault available at ./idl/legacyvault.json in the repo root (or you can generate it from Anchor and copy it there).

0) Repository layout
text

.
├─ docker-compose.yml
├─ .env.example
├─ package.json
├─ pnpm-workspace.yaml
├─ tsconfig.base.json
├─ idl/
│  └─ legacyvault.json
├─ db/
│  ├─ package.json
│  ├─ prisma/
│  │  └─ schema.prisma
│  └─ src/
│     └─ client.ts
├─ sdk/
│  ├─ package.json
│  ├─ tsconfig.json
│  └─ src/
│     ├─ index.ts
│     └─ legacyvault/
│        ├─ pdas.ts
│        ├─ distribute.ts
│        └─ tx.ts
├─ api/
│  ├─ Dockerfile
│  ├─ package.json
│  ├─ tsconfig.json
│  └─ src/
│     ├─ main.ts
│     ├─ env.ts
│     ├─ db.ts
│     ├─ siws.ts
│     ├─ auth.ts
│     ├─ anchor.ts
│     ├─ txbuild.ts
│     └─ routes/
│        ├─ health.ts
│        ├─ auth.ts
│        ├─ vaults.ts
│        └─ tx.ts
├─ indexer/
│  ├─ Dockerfile
│  ├─ package.json
│  ├─ tsconfig.json
│  └─ src/
│     ├─ main.ts
│     ├─ env.ts
│     ├─ db.ts
│     ├─ anchor.ts
│     ├─ decode.ts
│     ├─ ingestors/
│     │  ├─ wsLogs.ts
│     │  └─ heliusWebhook.ts
│     └─ handlers/
│        └─ eventsToDb.ts
├─ notifier/
│  ├─ Dockerfile
│  ├─ package.json
│  ├─ tsconfig.json
│  └─ src/
│     ├─ main.ts
│     ├─ env.ts
│     ├─ db.ts
│     ├─ queue.ts
│     ├─ scheduler.ts
│     ├─ workers/
│     │  ├─ emailWorker.ts
│     │  └─ smsWorker.ts
│     └─ templates/
│        ├─ email.ts
│        └─ sms.ts
└─ web/
   ├─ Dockerfile
   ├─ package.json
   ├─ next.config.mjs
   ├─ tsconfig.json
   └─ src/
      ├─ app/
      │  ├─ layout.tsx
      │  ├─ page.tsx
      │  ├─ signin/page.tsx
      │  ├─ dashboard/page.tsx
      │  └─ vault/[vault]/page.tsx
      ├─ components/
      │  ├─ WalletProviders.tsx
      │  ├─ Navbar.tsx
      │  └─ RequireAuth.tsx
      └─ lib/
         ├─ env.ts
         ├─ api.ts
         ├─ auth.ts
         └─ solana.ts
1) Root config
package.json
JSON

{
  "name": "legacyvault-monorepo",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "workspaces": [
    "db",
    "sdk",
    "api",
    "indexer",
    "notifier",
    "web"
  ],
  "scripts": {
    "db:generate": "pnpm -C db prisma generate",
    "db:migrate": "pnpm -C db prisma migrate dev",
    "dev:api": "pnpm -C api dev",
    "dev:indexer": "pnpm -C indexer dev",
    "dev:notifier": "pnpm -C notifier dev",
    "dev:web": "pnpm -C web dev",
    "dev": "pnpm -r --parallel dev"
  }
}
pnpm-workspace.yaml
YAML

packages:
  - "db"
  - "sdk"
  - "api"
  - "indexer"
  - "notifier"
  - "web"
tsconfig.base.json
JSON

{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  }
}
.env.example
Bash

# --- shared ---
NODE_ENV=development

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/legacyvault?schema=public
REDIS_URL=redis://localhost:6379

SOLANA_CLUSTER=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
LEGACYVAULT_PROGRAM_ID=LeGaCyVaULt11111111111111111111111111111

# --- indexer ---
INDEXER_HTTP_PORT=8787
INDEXER_WS_COMMITMENT=confirmed
INDEXER_ENABLE_WS_LOGS=true
INDEXER_ENABLE_HELIUS_WEBHOOK=false
HELIUS_WEBHOOK_AUTH=replace-me-secret

# --- api ---
API_HTTP_PORT=8788
API_JWT_SECRET=replace-me-jwt-secret
API_DOMAIN=localhost:3000
API_ORIGIN=http://localhost:3000
API_SESSION_TTL_SECS=604800

# optional: used for tx builder convenience
API_DEFAULT_VAULT_ID_START=1

# --- notifier ---
NOTIFIER_HTTP_PORT=8789
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=demo
SMTP_PASS=demo
EMAIL_FROM="LegacyVault <noreply@legacyvault.example>"

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=

# --- web ---
NEXT_PUBLIC_API_BASE=http://localhost:8788
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_LEGACYVAULT_PROGRAM_ID=LeGaCyVaULt11111111111111111111111111111
NEXT_PUBLIC_DOMAIN=localhost:3000
2) docker-compose (Postgres + Redis + services)
docker-compose.yml
YAML

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_USER: postgres
      POSTGRES_DB: legacyvault
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  api:
    build: ./api
    env_file: .env
    depends_on:
      - postgres
      - redis
    ports:
      - "8788:8788"

  indexer:
    build: ./indexer
    env_file: .env
    depends_on:
      - postgres
      - redis
    ports:
      - "8787:8787"

  notifier:
    build: ./notifier
    env_file: .env
    depends_on:
      - postgres
      - redis
    ports:
      - "8789:8789"

  web:
    build: ./web
    env_file: .env
    depends_on:
      - api
    ports:
      - "3000:3000"

volumes:
  pgdata:
Put your real environment in a local .env file (copy from .env.example).

3) Database package (db/) — Prisma schema + client
db/package.json
JSON

{
  "name": "@legacyvault/db",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "prisma": "prisma",
    "generate": "prisma generate",
    "migrate": "prisma migrate dev"
  },
  "dependencies": {
    "@prisma/client": "^5.22.0"
  },
  "devDependencies": {
    "prisma": "^5.22.0",
    "typescript": "^5.6.3"
  }
}
db/prisma/schema.prisma
prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  wallet    String   @unique
  createdAt DateTime @default(now())
  sessions  Session[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  jti       String   @unique
  createdAt DateTime @default(now())
  expiresAt DateTime
}

model Vault {
  id              String   @id @default(cuid())
  vaultPubkey     String   @unique
  ownerWallet     String
  vaultIdU64      String?  // stored as string for safety
  status          String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  guardians       Guardian[]
  beneficiaries   Beneficiary[]
  unlockSessions  UnlockSession[]
  subscriptions   Subscription[]
}

model Guardian {
  id          String   @id @default(cuid())
  vaultId     String
  vault       Vault    @relation(fields: [vaultId], references: [id])
  guardian    String
  role        String
  active      Boolean  @default(true)
  addedAt     DateTime @default(now())

  @@unique([vaultId, guardian])
}

model Beneficiary {
  id          String   @id @default(cuid())
  vaultId     String
  vault       Vault    @relation(fields: [vaultId], references: [id])
  beneficiary String
  shareBps    Int
  label       String?
  active      Boolean  @default(true)
  addedAt     DateTime @default(now())

  @@unique([vaultId, beneficiary])
}

model UnlockSession {
  id              String   @id @default(cuid())
  unlockPubkey     String   @unique
  vaultId          String
  vault            Vault    @relation(fields: [vaultId], references: [id])

  nonceU64         String
  status           String
  initiatedBy      String
  initiatedAtUnix  BigInt
  approvals        Int
  threshold        Int
  approvedAtUnix   BigInt?
  executableAtUnix BigInt?

  approvalsRows    Approval[]
  distSol          DistributionSolSession?
  distSpl          DistributionSplSession[]
  dispute          DisputeCase?

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

model Approval {
  id             String   @id @default(cuid())
  unlockId        String
  unlock          UnlockSession @relation(fields: [unlockId], references: [id])
  guardian        String
  approvedAtUnix  BigInt

  @@unique([unlockId, guardian])
}

model DistributionSolSession {
  id                String   @id @default(cuid())
  unlockId           String   @unique
  unlock             UnlockSession @relation(fields: [unlockId], references: [id])

  totalDistributable BigInt
  paidTotal          BigInt
  cursor             Int
  done               Boolean

  updatedAt          DateTime @updatedAt
}

model DistributionSplSession {
  id           String   @id @default(cuid())
  unlockId      String
  unlock        UnlockSession @relation(fields: [unlockId], references: [id])

  mint         String
  totalBalance BigInt
  paidTotal    BigInt
  cursor       Int
  done         Boolean

  @@unique([unlockId, mint])
}

model DisputeCase {
  id            String   @id @default(cuid())
  unlockId       String   @unique
  unlock         UnlockSession @relation(fields: [unlockId], references: [id])

  status        String
  openedBy      String
  openedAtUnix  BigInt
  noteHashHex   String

  resolvedAt    DateTime?
}

model Subscription {
  id            String   @id @default(cuid())
  vaultId       String
  vault         Vault    @relation(fields: [vaultId], references: [id])
  planId        Int
  validUntilUnix BigInt
  updatedAt     DateTime @updatedAt

  @@unique([vaultId, planId])
}

model GuardianProfile {
  id           String   @id @default(cuid())
  guardian     String   @unique
  displayName  String?
  websiteUri   String?
  kycLevel     Int      @default(0)
  active       Boolean  @default(true)
  updatedAt    DateTime @updatedAt
}

model GuardianBond {
  id        String   @id @default(cuid())
  guardian  String   @unique
  amount    BigInt
  locked    Boolean
  updatedAt DateTime @updatedAt
}

model EventLog {
  id         String   @id @default(cuid())
  signature  String   @unique
  slot       BigInt
  programId  String
  eventName  String
  dataJson   Json
  blockTime  BigInt?
  createdAt  DateTime @default(now())
}
db/src/client.ts
TypeScript

import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
4) SDK package (sdk/) — reuse tx builders/distribution builders
sdk/package.json
JSON

{
  "name": "@legacyvault/sdk",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "@coral-xyz/anchor": "^0.30.1",
    "@solana/web3.js": "^1.95.4",
    "@solana/spl-token": "^0.4.9",
    "bn.js": "^5.2.1"
  },
  "devDependencies": {
    "typescript": "^5.6.3"
  }
}
sdk/tsconfig.json
JSON

{
  "extends": "../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist" },
  "include": ["src"]
}
sdk/src/index.ts
TypeScript

export * as legacyvault from "./legacyvault/tx";
export * as legacyvaultPdas from "./legacyvault/pdas";
export * as legacyvaultDistribute from "./legacyvault/distribute";
sdk/src/legacyvault/pdas.ts
TypeScript

// (same as earlier; included here as-is)
import { PublicKey } from "@solana/web3.js";

export const SEEDS = {
  CONFIG: Buffer.from("config"),
  VAULT: Buffer.from("vault"),
  VAULT_AUTH: Buffer.from("vault_auth"),
  INDEX: Buffer.from("index"),
  GUARDIAN: Buffer.from("guardian"),
  BENEFICIARY: Buffer.from("beneficiary"),
  DELEGATE: Buffer.from("delegate"),
  ASSET_RULE: Buffer.from("asset_rule"),
  UNLOCK: Buffer.from("unlock"),
  APPROVAL: Buffer.from("approval"),
  DIST_SOL: Buffer.from("dist_sol"),
  DIST_SPL: Buffer.from("dist_spl"),
  DISPUTE: Buffer.from("dispute"),
  SUB: Buffer.from("sub"),
  G_PROFILE: Buffer.from("g_profile"),
  G_BOND: Buffer.from("g_bond")
};

export function u64LE(x: bigint) {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(x);
  return b;
}

export function configPda(programId: PublicKey) {
  return PublicKey.findProgramAddressSync([SEEDS.CONFIG], programId);
}
export function vaultPda(programId: PublicKey, owner: PublicKey, vaultId: bigint) {
  return PublicKey.findProgramAddressSync([SEEDS.VAULT, owner.toBuffer(), u64LE(vaultId)], programId);
}
export function vaultAuthPda(programId: PublicKey, vault: PublicKey) {
  return PublicKey.findProgramAddressSync([SEEDS.VAULT_AUTH, vault.toBuffer()], programId);
}
export function indexPda(programId: PublicKey, vault: PublicKey) {
  return PublicKey.findProgramAddressSync([SEEDS.INDEX, vault.toBuffer()], programId);
}
export function guardianEntryPda(programId: PublicKey, vault: PublicKey, guardian: PublicKey) {
  return PublicKey.findProgramAddressSync([SEEDS.GUARDIAN, vault.toBuffer(), guardian.toBuffer()], programId);
}
export function beneficiaryEntryPda(programId: PublicKey, vault: PublicKey, beneficiary: PublicKey) {
  return PublicKey.findProgramAddressSync([SEEDS.BENEFICIARY, vault.toBuffer(), beneficiary.toBuffer()], programId);
}
export function unlockPda(programId: PublicKey, vault: PublicKey, nonce: bigint) {
  return PublicKey.findProgramAddressSync([SEEDS.UNLOCK, vault.toBuffer(), u64LE(nonce)], programId);
}
export function approvalPda(programId: PublicKey, unlock: PublicKey, guardian: PublicKey) {
  return PublicKey.findProgramAddressSync([SEEDS.APPROVAL, unlock.toBuffer(), guardian.toBuffer()], programId);
}
export function distSolPda(programId: PublicKey, unlock: PublicKey) {
  return PublicKey.findProgramAddressSync([SEEDS.DIST_SOL, unlock.toBuffer()], programId);
}
export function distSplPda(programId: PublicKey, unlock: PublicKey, mint: PublicKey) {
  return PublicKey.findProgramAddressSync([SEEDS.DIST_SPL, unlock.toBuffer(), mint.toBuffer()], programId);
}
sdk/src/legacyvault/tx.ts
TypeScript

import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import BN from "bn.js";
import {
  approvalPda, beneficiaryEntryPda, configPda, distSolPda, distSplPda,
  guardianEntryPda, indexPda, unlockPda, vaultAuthPda, vaultPda
} from "./pdas";

export async function ixCreateVault(args: {
  program: Program;
  owner: PublicKey;
  vaultId: bigint;
  heartbeatSecs: number;
  inactivitySecs: number;
  timelockSecs: number;
  panicEnabled: boolean;
}) {
  const [cfg] = configPda(args.program.programId);
  const [vault] = vaultPda(args.program.programId, args.owner, args.vaultId);
  const [vaultAuth] = vaultAuthPda(args.program.programId, vault);
  const [index] = indexPda(args.program.programId, vault);

  const cfgAcc: any = await args.program.account.globalConfig.fetch(cfg);
  const treasury = cfgAcc.treasury as PublicKey;

  return args.program.methods
    .createVault(
      new BN(args.vaultId.toString()),
      args.heartbeatSecs,
      args.inactivitySecs,
      args.timelockSecs,
      args.panicEnabled
    )
    .accounts({
      config: cfg,
      vault,
      vaultAuth,
      index,
      owner: args.owner,
      treasury,
      systemProgram: SystemProgram.programId
    })
    .instruction();
}

export async function ixAddGuardian(args: {
  program: Program;
  owner: PublicKey;
  vault: PublicKey;
  guardian: PublicKey;
  role: number;
}) {
  const [cfg] = configPda(args.program.programId);
  const [index] = indexPda(args.program.programId, args.vault);
  const [ge] = guardianEntryPda(args.program.programId, args.vault, args.guardian);

  return args.program.methods
    .addGuardian(args.role)
    .accounts({
      config: cfg,
      vault: args.vault,
      index,
      guardianEntry: ge,
      guardian: args.guardian,
      owner: args.owner,
      systemProgram: SystemProgram.programId
    })
    .instruction();
}

export async function ixAddBeneficiary(args: {
  program: Program;
  owner: PublicKey;
  vault: PublicKey;
  beneficiary: PublicKey;
  shareBps: number;
  label16: number[];
}) {
  const [cfg] = configPda(args.program.programId);
  const [index] = indexPda(args.program.programId, args.vault);
  const [be] = beneficiaryEntryPda(args.program.programId, args.vault, args.beneficiary);

  return args.program.methods
    .addBeneficiary(args.shareBps, args.label16)
    .accounts({
      config: cfg,
      vault: args.vault,
      index,
      beneficiaryEntry: be,
      beneficiary: args.beneficiary,
      owner: args.owner,
      systemProgram: SystemProgram.programId
    })
    .instruction();
}

export async function ixSetGuardianThreshold(args: {
  program: Program;
  owner: PublicKey;
  vault: PublicKey;
  threshold: number;
}) {
  const [cfg] = configPda(args.program.programId);
  const [index] = indexPda(args.program.programId, args.vault);

  return args.program.methods
    .setGuardianThreshold(args.threshold)
    .accounts({
      config: cfg,
      vault: args.vault,
      index,
      owner: args.owner
    })
    .instruction();
}

export async function ixDepositSpl(args: {
  program: Program;
  owner: PublicKey;
  vault: PublicKey;
  mint: PublicKey;
  amount: BN;
}) {
  const [cfg] = configPda(args.program.programId);
  const [vaultAuth] = vaultAuthPda(args.program.programId, args.vault);

  const ownerAta = getAssociatedTokenAddressSync(args.mint, args.owner);
  const vaultAta = getAssociatedTokenAddressSync(args.mint, vaultAuth, true);

  return args.program.methods
    .depositSpl(args.amount)
    .accounts({
      config: cfg,
      vault: args.vault,
      vaultAuth,
      mint: args.mint,
      owner: args.owner,
      ownerAta,
      vaultAta,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
      systemProgram: SystemProgram.programId,
      rent: PublicKey.default
    })
    .instruction();
}

export async function ixInitiateUnlock(args: {
  program: Program;
  vault: PublicKey;
  guardian: PublicKey;
  nonce: bigint;
}) {
  const [cfg] = configPda(args.program.programId);
  const [ge] = guardianEntryPda(args.program.programId, args.vault, args.guardian);
  const [unlock] = unlockPda(args.program.programId, args.vault, args.nonce);

  return args.program.methods
    .initiateUnlock()
    .accounts({
      config: cfg,
      vault: args.vault,
      guardianEntry: ge,
      unlock,
      guardian: args.guardian,
      systemProgram: SystemProgram.programId
    })
    .instruction();
}

export async function ixApproveUnlock(args: {
  program: Program;
  vault: PublicKey;
  unlock: PublicKey;
  guardian: PublicKey;
}) {
  const [cfg] = configPda(args.program.programId);
  const [ge] = guardianEntryPda(args.program.programId, args.vault, args.guardian);
  const [approval] = approvalPda(args.program.programId, args.unlock, args.guardian);

  return args.program.methods
    .approveUnlock()
    .accounts({
      config: cfg,
      vault: args.vault,
      guardianEntry: ge,
      unlock: args.unlock,
      approval,
      guardian: args.guardian,
      systemProgram: SystemProgram.programId
    })
    .instruction();
}

export async function ixInitDistSol(args: {
  program: Program;
  vault: PublicKey;
  unlock: PublicKey;
  payer: PublicKey;
}) {
  const [cfg] = configPda(args.program.programId);
  const [distSol] = distSolPda(args.program.programId, args.unlock);

  return args.program.methods
    .initDistributionSolSession()
    .accounts({
      config: cfg,
      vault: args.vault,
      unlock: args.unlock,
      distSol,
      payer: args.payer,
      systemProgram: SystemProgram.programId
    })
    .instruction();
}

export async function ixInitDistSpl(args: {
  program: Program;
  vault: PublicKey;
  unlock: PublicKey;
  mint: PublicKey;
  payer: PublicKey;
}) {
  const [cfg] = configPda(args.program.programId);
  const [vaultAuth] = vaultAuthPda(args.program.programId, args.vault);
  const [distSpl] = distSplPda(args.program.programId, args.unlock, args.mint);
  const vaultAta = getAssociatedTokenAddressSync(args.mint, vaultAuth, true);

  return args.program.methods
    .initDistributionSplSession()
    .accounts({
      config: cfg,
      vault: args.vault,
      unlock: args.unlock,
      vaultAuth,
      mint: args.mint,
      distSpl,
      vaultAta,
      payer: args.payer,
      systemProgram: SystemProgram.programId
    })
    .instruction();
}
sdk/src/legacyvault/distribute.ts
TypeScript

import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { beneficiaryEntryPda, configPda, distSolPda, distSplPda, indexPda, vaultAuthPda } from "./pdas";

export async function buildSolDistributionBatches(args: {
  program: Program;
  vault: PublicKey;
  unlock: PublicKey;
  batchSize: number;
}): Promise<TransactionInstruction[]> {
  const [cfg] = configPda(args.program.programId);
  const [indexAddr] = indexPda(args.program.programId, args.vault);
  const [distSol] = distSolPda(args.program.programId, args.unlock);

  const index: any = await args.program.account.vaultIndex.fetch(indexAddr);
  const beneficiaries: PublicKey[] = index.beneficiaries;

  const ixs: TransactionInstruction[] = [];

  for (let start = 0; start < beneficiaries.length; start += args.batchSize) {
    const end = Math.min(start + args.batchSize, beneficiaries.length);
    const slice = beneficiaries.slice(start, end);

    const remaining = [];
    for (const b of slice) {
      const [be] = beneficiaryEntryPda(args.program.programId, args.vault, b);
      remaining.push({ pubkey: be, isSigner: false, isWritable: false });
      remaining.push({ pubkey: b, isSigner: false, isWritable: true });
    }

    const ix = await args.program.methods
      .executeDistributionSolBatch(start, end - start)
      .accounts({
        config: cfg,
        vault: args.vault,
        unlock: args.unlock,
        index: indexAddr,
        distSol,
        systemProgram: SystemProgram.programId
      })
      .remainingAccounts(remaining)
      .instruction();

    ixs.push(ix);
  }

  return ixs;
}

export async function buildSplDistributionBatches(args: {
  program: Program;
  vault: PublicKey;
  unlock: PublicKey;
  mint: PublicKey;
  batchSize: number;
}): Promise<TransactionInstruction[]> {
  const [cfg] = configPda(args.program.programId);
  const [indexAddr] = indexPda(args.program.programId, args.vault);
  const [vaultAuth] = vaultAuthPda(args.program.programId, args.vault);
  const [distSpl] = distSplPda(args.program.programId, args.unlock, args.mint);
  const vaultAta = getAssociatedTokenAddressSync(args.mint, vaultAuth, true);

  const index: any = await args.program.account.vaultIndex.fetch(indexAddr);
  const beneficiaries: PublicKey[] = index.beneficiaries;

  const ixs: TransactionInstruction[] = [];

  for (let start = 0; start < beneficiaries.length; start += args.batchSize) {
    const end = Math.min(start + args.batchSize, beneficiaries.length);
    const slice = beneficiaries.slice(start, end);

    const remaining = [];
    for (const b of slice) {
      const [be] = beneficiaryEntryPda(args.program.programId, args.vault, b);
      const ata = getAssociatedTokenAddressSync(args.mint, b);
      remaining.push({ pubkey: be, isSigner: false, isWritable: false });
      remaining.push({ pubkey: b, isSigner: false, isWritable: false });
      remaining.push({ pubkey: ata, isSigner: false, isWritable: true });
    }

    const ix = await args.program.methods
      .executeDistributionSplBatch(start, end - start)
      .accounts({
        config: cfg,
        vault: args.vault,
        vaultAuth,
        unlock: args.unlock,
        index: indexAddr,
        mint: args.mint,
        distSpl,
        vaultAta,
        tokenProgram: TOKEN_PROGRAM_ID
      })
      .remainingAccounts(remaining)
      .instruction();

    ixs.push(ix);
  }

  return ixs;
}
5) Indexer service (indexer/)
Helius webhook basics + auth header pattern are from Helius docs. 
1

Anchor TS event decoding interface reference is from Anchor docs. 
3

indexer/Dockerfile
Dockerfile

FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm install --prod
COPY . .
CMD ["pnpm", "start"]
indexer/package.json
JSON

{
  "name": "indexer",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --watch --loader ts-node/esm src/main.ts",
    "start": "node --loader ts-node/esm src/main.ts"
  },
  "dependencies": {
    "@coral-xyz/anchor": "^0.30.1",
    "@legacyvault/db": "workspace:*",
    "@solana/web3.js": "^1.95.4",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "ts-node": "^10.9.2",
    "typescript": "^5.6.3"
  }
}
indexer/tsconfig.json
JSON

{
  "extends": "../tsconfig.base.json",
  "include": ["src"]
}
indexer/src/env.ts
TypeScript

import "dotenv/config";
import { z } from "zod";

const Env = z.object({
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  SOLANA_RPC_URL: z.string(),
  LEGACYVAULT_PROGRAM_ID: z.string(),

  INDEXER_HTTP_PORT: z.string().default("8787"),
  INDEXER_ENABLE_WS_LOGS: z.string().default("true"),
  INDEXER_ENABLE_HELIUS_WEBHOOK: z.string().default("false"),
  HELIUS_WEBHOOK_AUTH: z.string().optional()
});

export const env = Env.parse(process.env);
indexer/src/db.ts
TypeScript

export { prisma } from "@legacyvault/db";
indexer/src/anchor.ts
TypeScript

import { AnchorProvider, BorshCoder, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "../../idl/legacyvault.json" assert { type: "json" };
import { env } from "./env";

export const connection = new Connection(env.SOLANA_RPC_URL, "confirmed");
export const programId = new PublicKey(env.LEGACYVAULT_PROGRAM_ID);

// provider wallet is never used for signing here; indexer only decodes
export const provider = new AnchorProvider(connection, {} as any, { commitment: "confirmed" });

export const coder = new BorshCoder(idl as any);
export const program = new Program(idl as any, programId, provider);
indexer/src/decode.ts
TypeScript

import { EventParser } from "@coral-xyz/anchor";
import { programId, program } from "./anchor";

export function decodeAnchorEvents(logs: string[]) {
  const parser = new EventParser(programId, program.coder);
  const events: Array<{ name: string; data: any }> = [];
  parser.parseLogs(logs, (evt) => {
    events.push({ name: evt.name, data: evt.data });
  });
  return events;
}
indexer/src/handlers/eventsToDb.ts
TypeScript

import { prisma } from "../db";

export async function persistEvents(args: {
  signature: string;
  slot: bigint;
  programId: string;
  blockTime?: bigint | null;
  events: Array<{ name: string; data: any }>;
}) {
  // Store one row per tx signature (simple); or split per event if preferred.
  await prisma.eventLog.upsert({
    where: { signature: args.signature },
    create: {
      signature: args.signature,
      slot: args.slot,
      programId: args.programId,
      eventName: args.events.map(e => e.name).join(","),
      dataJson: args.events as any,
      blockTime: args.blockTime ?? null
    },
    update: {
      slot: args.slot,
      eventName: args.events.map(e => e.name).join(","),
      dataJson: args.events as any,
      blockTime: args.blockTime ?? null
    }
  });

  // Optional: build derived state (Vaults/UnlockSessions) here.
  // In production, you’d map each event type -> upserts.
}
indexer/src/ingestors/wsLogs.ts
TypeScript

import { connection, programId } from "../anchor";
import { decodeAnchorEvents } from "../decode";
import { persistEvents } from "../handlers/eventsToDb";

export async function startWsLogsIngestor() {
  console.log("[indexer] starting WS logs subscription");

  connection.onLogs(programId, async (logInfo, ctx) => {
    try {
      const events = decodeAnchorEvents(logInfo.logs);
      if (events.length === 0) return;

      await persistEvents({
        signature: logInfo.signature,
        slot: BigInt(ctx.slot),
        programId: programId.toBase58(),
        blockTime: null,
        events
      });
    } catch (e) {
      console.error("[indexer][wsLogs] error", e);
    }
  }, "confirmed");
}
indexer/src/ingestors/heliusWebhook.ts
TypeScript

import express from "express";
import { env } from "../env";
import { decodeAnchorEvents } from "../decode";
import { persistEvents } from "../handlers/eventsToDb";
import { programId } from "../anchor";

/**
 * Helius webhooks can be configured with an authHeader that Helius includes
 * in deliveries; validate it here. <!--citation:5-->
 */
export function heliusWebhookRouter() {
  const router = express.Router();

  router.post("/helius", express.json({ limit: "2mb" }), async (req, res) => {
    try {
      const auth = req.headers["authorization"];
      if (env.HELIUS_WEBHOOK_AUTH && auth !== env.HELIUS_WEBHOOK_AUTH) {
        return res.status(401).json({ ok: false });
      }

      // Enhanced webhook payload is typically an array of tx objects
      const payload = req.body;
      const txs = Array.isArray(payload) ? payload : [payload];

      for (const tx of txs) {
        const signature = tx?.signature ?? tx?.transaction?.signatures?.[0];
        const logs: string[] = tx?.transaction?.meta?.logMessages ?? tx?.meta?.logMessages ?? [];
        if (!signature || logs.length === 0) continue;

        // only keep txs that actually mention the program id in logs (cheap filter)
        if (!logs.some(l => l.includes(programId.toBase58()))) continue;

        const events = decodeAnchorEvents(logs);
        if (events.length === 0) continue;

        await persistEvents({
          signature,
          slot: BigInt(tx?.slot ?? 0),
          programId: programId.toBase58(),
          blockTime: tx?.blockTime ? BigInt(tx.blockTime) : null,
          events
        });
      }

      res.json({ ok: true });
    } catch (e) {
      console.error("[indexer][heliusWebhook] error", e);
      res.status(500).json({ ok: false });
    }
  });

  return router;
}
indexer/src/main.ts
TypeScript

import express from "express";
import { env } from "./env";
import { startWsLogsIngestor } from "./ingestors/wsLogs";
import { heliusWebhookRouter } from "./ingestors/heliusWebhook";

async function main() {
  const app = express();

  app.get("/health", (_, res) => res.json({ ok: true }));

  if (env.INDEXER_ENABLE_HELIUS_WEBHOOK === "true") {
    app.use("/webhooks", heliusWebhookRouter());
  }

  app.listen(Number(env.INDEXER_HTTP_PORT), () => {
    console.log(`[indexer] http listening on :${env.INDEXER_HTTP_PORT}`);
  });

  if (env.INDEXER_ENABLE_WS_LOGS === "true") {
    await startWsLogsIngestor();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
6) API service (api/) — SIWS + tx-builder
SIWS message format details are taken from Phantom’s SIW docs. 
2

api/Dockerfile
Dockerfile

FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm install --prod
COPY . .
CMD ["pnpm", "start"]
api/package.json
JSON

{
  "name": "api",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --watch --loader ts-node/esm src/main.ts",
    "start": "node --loader ts-node/esm src/main.ts"
  },
  "dependencies": {
    "@coral-xyz/anchor": "^0.30.1",
    "@legacyvault/db": "workspace:*",
    "@legacyvault/sdk": "workspace:*",
    "@solana/web3.js": "^1.95.4",
    "bs58": "^5.0.0",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "tweetnacl": "^1.0.3",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "ts-node": "^10.9.2",
    "typescript": "^5.6.3"
  }
}
api/src/env.ts
TypeScript

import "dotenv/config";
import { z } from "zod";

const Env = z.object({
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  SOLANA_RPC_URL: z.string(),
  LEGACYVAULT_PROGRAM_ID: z.string(),

  API_HTTP_PORT: z.string().default("8788"),
  API_JWT_SECRET: z.string(),
  API_DOMAIN: z.string(),
  API_ORIGIN: z.string(),
  API_SESSION_TTL_SECS: z.string().default("604800")
});

export const env = Env.parse(process.env);
api/src/db.ts
TypeScript

export { prisma } from "@legacyvault/db";
api/src/siws.ts
TypeScript

import { env } from "./env";

/**
 * Minimal SIWS-style message builder.
 * Phantom documents the canonical “domain wants you to sign in…” pattern and fields
 * like uri, nonce, issued-at. <!--citation:2-->
 */
export function buildSiwsMessage(args: {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;      // "1"
  chainId: string;      // e.g., "solana:devnet"
  nonce: string;
  issuedAt: string;     // ISO string
  expirationTime?: string;
}): string {
  const lines: string[] = [];

  lines.push(`${args.domain} wants you to sign in with your Solana account:`);
  lines.push(`${args.address}`);
  lines.push("");
  lines.push(args.statement);
  lines.push("");
  lines.push(`URI: ${args.uri}`);
  lines.push(`Version: ${args.version}`);
  lines.push(`Chain ID: ${args.chainId}`);
  lines.push(`Nonce: ${args.nonce}`);
  lines.push(`Issued At: ${args.issuedAt}`);
  if (args.expirationTime) lines.push(`Expiration Time: ${args.expirationTime}`);

  return lines.join("\n");
}

export function defaultStatement() {
  return "Sign in to LegacyVault to manage your vaults and build transactions.";
}
api/src/auth.ts
TypeScript

import jwt from "jsonwebtoken";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { PublicKey } from "@solana/web3.js";
import { env } from "./env";
import { prisma } from "./db";

export function createJwt(args: { wallet: string; jti: string; expSec: number }) {
  return jwt.sign(
    { sub: args.wallet, jti: args.jti },
    env.API_JWT_SECRET,
    { expiresIn: args.expSec }
  );
}

export function verifyJwt(token: string): { wallet: string; jti: string } {
  const decoded = jwt.verify(token, env.API_JWT_SECRET) as any;
  return { wallet: decoded.sub, jti: decoded.jti };
}

export async function verifySignature(args: { message: string; signatureBase58: string; publicKey: string }) {
  const sig = bs58.decode(args.signatureBase58);
  const pub = new PublicKey(args.publicKey);
  const ok = nacl.sign.detached.verify(
    new TextEncoder().encode(args.message),
    sig,
    pub.toBytes()
  );
  return ok;
}

export async function getOrCreateUser(wallet: string) {
  return prisma.user.upsert({
    where: { wallet },
    create: { wallet },
    update: {}
  });
}

export async function createSession(wallet: string, ttlSecs: number) {
  const user = await getOrCreateUser(wallet);
  const jti = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + ttlSecs * 1000);

  await prisma.session.create({
    data: { userId: user.id, jti, expiresAt }
  });

  return { jti, expiresAt };
}

export async function requireAuth(req: any, res: any, next: any) {
  try {
    const h = req.headers["authorization"];
    if (!h?.startsWith("Bearer ")) return res.status(401).json({ ok: false });
    const token = h.slice("Bearer ".length);
    const { wallet, jti } = verifyJwt(token);

    const session = await prisma.session.findUnique({ where: { jti } });
    if (!session || session.expiresAt < new Date()) return res.status(401).json({ ok: false });

    req.user = { wallet, jti };
    next();
  } catch {
    res.status(401).json({ ok: false });
  }
}
api/src/anchor.ts
TypeScript

import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "../../idl/legacyvault.json" assert { type: "json" };
import { env } from "./env";

export const connection = new Connection(env.SOLANA_RPC_URL, "confirmed");
export const programId = new PublicKey(env.LEGACYVAULT_PROGRAM_ID);

// API never signs; wallet is a dummy
export const provider = new AnchorProvider(connection, {} as any, { commitment: "confirmed" });
export const program = new Program(idl as any, programId, provider);
api/src/txbuild.ts
TypeScript

import { Connection, PublicKey, Transaction } from "@solana/web3.js";

export async function buildUnsignedTxBase64(args: {
  connection: Connection;
  feePayer: PublicKey;
  ixs: any[];
}) {
  const { blockhash, lastValidBlockHeight } = await args.connection.getLatestBlockhash("confirmed");

  const tx = new Transaction();
  tx.feePayer = args.feePayer;
  tx.recentBlockhash = blockhash;
  tx.add(...args.ixs);

  const b64 = tx.serialize({ requireAllSignatures: false }).toString("base64");
  return { txBase64: b64, blockhash, lastValidBlockHeight };
}
api/src/routes/auth.ts
TypeScript

import express from "express";
import { z } from "zod";
import { buildSiwsMessage, defaultStatement } from "../siws";
import { createSession, createJwt, verifySignature } from "../auth";
import { env } from "../env";

export const authRouter = express.Router();

const NonceResp = z.object({ nonce: z.string(), issuedAt: z.string(), message: z.string() });

authRouter.post("/nonce", express.json(), async (req, res) => {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const issuedAt = new Date().toISOString();

  // client will rebuild message too; server returns canonical message to reduce mismatch
  const message = buildSiwsMessage({
    domain: env.API_DOMAIN,
    address: "WALLET_ADDRESS_PLACEHOLDER",
    statement: defaultStatement(),
    uri: env.API_ORIGIN,
    version: "1",
    chainId: "solana:devnet",
    nonce,
    issuedAt
  });

  res.json(NonceResp.parse({ nonce, issuedAt, message }));
});

authRouter.post("/verify", express.json(), async (req, res) => {
  const Body = z.object({
    wallet: z.string(),
    message: z.string(),
    signatureBase58: z.string(),
    nonce: z.string(),
    issuedAt: z.string()
  });
  const body = Body.parse(req.body);

  // verify signature
  const ok = await verifySignature({
    message: body.message,
    signatureBase58: body.signatureBase58,
    publicKey: body.wallet
  });
  if (!ok) return res.status(401).json({ ok: false });

  // create session
  const ttl = Number(env.API_SESSION_TTL_SECS);
  const { jti, expiresAt } = await createSession(body.wallet, ttl);
  const token = createJwt({ wallet: body.wallet, jti, expSec: ttl });

  res.json({ ok: true, token, expiresAt: expiresAt.toISOString() });
});
api/src/routes/vaults.ts
TypeScript

import express from "express";
import { prisma } from "../db";
import { requireAuth } from "../auth";

export const vaultsRouter = express.Router();

vaultsRouter.get("/", requireAuth, async (req: any, res) => {
  const wallet = req.user.wallet;
  const vaults = await prisma.vault.findMany({ where: { ownerWallet: wallet }, orderBy: { createdAt: "desc" } });
  res.json({ ok: true, vaults });
});

vaultsRouter.get("/:vaultPubkey", requireAuth, async (req: any, res) => {
  const v = await prisma.vault.findUnique({ where: { vaultPubkey: req.params.vaultPubkey } });
  if (!v) return res.status(404).json({ ok: false });
  if (v.ownerWallet !== req.user.wallet) return res.status(403).json({ ok: false });
  res.json({ ok: true, vault: v });
});
api/src/routes/tx.ts
TypeScript

import express from "express";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { requireAuth } from "../auth";
import { program, connection } from "../anchor";
import { buildUnsignedTxBase64 } from "../txbuild";
import { legacyvault as sdkTx } from "@legacyvault/sdk";
import { env } from "../env";

export const txRouter = express.Router();

// Build a createVault tx
txRouter.post("/create-vault", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({
    vaultId: z.string(), // bigint string
    heartbeatSecs: z.number(),
    inactivitySecs: z.number(),
    timelockSecs: z.number(),
    panicEnabled: z.boolean()
  });
  const body = Body.parse(req.body);

  const owner = new PublicKey(req.user.wallet);
  const ix = await sdkTx.ixCreateVault({
    program,
    owner,
    vaultId: BigInt(body.vaultId),
    heartbeatSecs: body.heartbeatSecs,
    inactivitySecs: body.inactivitySecs,
    timelockSecs: body.timelockSecs,
    panicEnabled: body.panicEnabled
  });

  const built = await buildUnsignedTxBase64({ connection, feePayer: owner, ixs: [ix] });
  res.json({ ok: true, ...built });
});

// Build addBeneficiary tx
txRouter.post("/add-beneficiary", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({
    vault: z.string(),
    beneficiary: z.string(),
    shareBps: z.number(),
    label: z.string().max(16).default("")
  });
  const body = Body.parse(req.body);

  const owner = new PublicKey(req.user.wallet);
  const vault = new PublicKey(body.vault);
  const beneficiary = new PublicKey(body.beneficiary);
  const label16 = Array.from(Buffer.from(body.label.padEnd(16, "\0")).slice(0, 16));

  const ix = await sdkTx.ixAddBeneficiary({
    program,
    owner,
    vault,
    beneficiary,
    shareBps: body.shareBps,
    label16
  });

  const built = await buildUnsignedTxBase64({ connection, feePayer: owner, ixs: [ix] });
  res.json({ ok: true, ...built });
});

// Build approveUnlock tx
txRouter.post("/approve-unlock", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({ vault: z.string(), unlock: z.string() });
  const body = Body.parse(req.body);

  const guardian = new PublicKey(req.user.wallet);
  const vault = new PublicKey(body.vault);
  const unlock = new PublicKey(body.unlock);

  const ix = await sdkTx.ixApproveUnlock({ program, vault, unlock, guardian });
  const built = await buildUnsignedTxBase64({ connection, feePayer: guardian, ixs: [ix] });
  res.json({ ok: true, ...built });
});
api/src/routes/health.ts
TypeScript

import express from "express";
export const healthRouter = express.Router();
healthRouter.get("/", (_, res) => res.json({ ok: true }));
api/src/main.ts
TypeScript

import express from "express";
import { env } from "./env";
import { healthRouter } from "./routes/health";
import { authRouter } from "./routes/auth";
import { vaultsRouter } from "./routes/vaults";
import { txRouter } from "./routes/tx";

async function main() {
  const app = express();

  app.use("/health", healthRouter);
  app.use("/v1/auth", authRouter);
  app.use("/v1/vaults", vaultsRouter);
  app.use("/v1/tx", txRouter);

  app.listen(Number(env.API_HTTP_PORT), () => {
    console.log(`[api] listening on :${env.API_HTTP_PORT}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
7) Notifier service (notifier/) — queues + cron + templates
Helius docs mention webhook retries/duplicates; in practice you’ll want idempotent notification dedupe keys, but the notifier here uses DB state. 
1

notifier/Dockerfile
Dockerfile

FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm install --prod
COPY . .
CMD ["pnpm", "start"]
notifier/package.json
JSON

{
  "name": "notifier",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --watch --loader ts-node/esm src/main.ts",
    "start": "node --loader ts-node/esm src/main.ts"
  },
  "dependencies": {
    "@legacyvault/db": "workspace:*",
    "bullmq": "^5.13.0",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "nodemailer": "^6.9.15",
    "twilio": "^5.3.4",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "ts-node": "^10.9.2",
    "typescript": "^5.6.3"
  }
}
notifier/src/env.ts
TypeScript

import "dotenv/config";
import { z } from "zod";

const Env = z.object({
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  NOTIFIER_HTTP_PORT: z.string().default("8789"),

  SMTP_HOST: z.string(),
  SMTP_PORT: z.string(),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  EMAIL_FROM: z.string(),

  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional()
});

export const env = Env.parse(process.env);
notifier/src/db.ts
TypeScript

export { prisma } from "@legacyvault/db";
notifier/src/queue.ts
TypeScript

import { Queue } from "bullmq";
import { env } from "./env";

export const emailQueue = new Queue("email", { connection: { url: env.REDIS_URL } });
export const smsQueue = new Queue("sms", { connection: { url: env.REDIS_URL } });
notifier/src/templates/email.ts
TypeScript

export function checkInReminderEmail(args: { wallet: string; vaultPubkey: string; dueIso: string }) {
  return {
    subject: "LegacyVault check-in reminder",
    text:
      `Wallet ${args.wallet}\n` +
      `Vault ${args.vaultPubkey}\n` +
      `Check-in due by: ${args.dueIso}\n\n` +
      `If you are active, open LegacyVault and check in.`
  };
}

export function unlockEligibleEmail(args: { vaultPubkey: string; eligibleIso: string }) {
  return {
    subject: "LegacyVault unlock eligible",
    text:
      `Vault ${args.vaultPubkey} is now eligible for unlock.\n` +
      `Eligible at: ${args.eligibleIso}\n\n` +
      `Guardians should review and follow the on-chain process.`
  };
}
notifier/src/templates/sms.ts
TypeScript

export function checkInReminderSms(args: { vaultPubkey: string; dueIso: string }) {
  return `LegacyVault: check-in due for vault ${args.vaultPubkey} by ${args.dueIso}.`;
}
notifier/src/workers/emailWorker.ts
TypeScript

import nodemailer from "nodemailer";
import { Worker } from "bullmq";
import { env } from "../env";

const transport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT),
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS }
});

export function startEmailWorker() {
  return new Worker("email", async (job) => {
    const { to, subject, text } = job.data;
    await transport.sendMail({ from: env.EMAIL_FROM, to, subject, text });
  }, { connection: { url: env.REDIS_URL } });
}
notifier/src/workers/smsWorker.ts
TypeScript

import { Worker } from "bullmq";
import { env } from "../env";

export function startSmsWorker() {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_NUMBER) {
    console.log("[notifier] Twilio not configured; smsWorker disabled");
    return null;
  }

  const twilio = (await import("twilio")).default(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

  return new Worker("sms", async (job) => {
    const { to, body } = job.data;
    await twilio.messages.create({ from: env.TWILIO_FROM_NUMBER, to, body });
  }, { connection: { url: env.REDIS_URL } });
}
notifier/src/scheduler.ts
TypeScript

import { prisma } from "./db";
import { emailQueue } from "./queue";
import { checkInReminderEmail } from "./templates/email";

/**
 * Minimal scheduler:
 * - once per hour: find vaults whose last check-in is older than heartbeat interval
 * In production, compute exact due dates from on-chain state (indexed) and user preferences.
 */
export async function runHourlyScheduler() {
  // You’d store user notification contacts in DB; for now, placeholder:
  const demoEmail = process.env.DEMO_NOTIFY_EMAIL;
  if (!demoEmail) return;

  const vaults = await prisma.vault.findMany({ take: 50, orderBy: { updatedAt: "desc" } });

  for (const v of vaults) {
    const dueIso = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const email = checkInReminderEmail({ wallet: v.ownerWallet, vaultPubkey: v.vaultPubkey, dueIso });

    await emailQueue.add("checkin", { to: demoEmail, ...email }, { removeOnComplete: true });
  }
}
notifier/src/main.ts
TypeScript

import express from "express";
import { env } from "./env";
import { runHourlyScheduler } from "./scheduler";
import { startEmailWorker } from "./workers/emailWorker";

async function main() {
  const app = express();
  app.get("/health", (_, res) => res.json({ ok: true }));

  app.listen(Number(env.NOTIFIER_HTTP_PORT), () => {
    console.log(`[notifier] listening on :${env.NOTIFIER_HTTP_PORT}`);
  });

  startEmailWorker();

  // naive cron loop
  setInterval(() => {
    runHourlyScheduler().catch(console.error);
  }, 60 * 60 * 1000);

  // run once at boot
  await runHourlyScheduler();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
8) Web app (web/) — Next.js + wallet adapter + SIWS flow
Solana’s Next.js integration guide provides the baseline wallet integration approach. 
4

SIWS message format guidance is from Phantom docs. 
2

web/Dockerfile
Dockerfile

FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm install
COPY . .
RUN pnpm build
CMD ["pnpm", "start"]
web/package.json
JSON

{
  "name": "web",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000"
  },
  "dependencies": {
    "bs58": "^5.0.0",
    "next": "^14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@solana/web3.js": "^1.95.4",
    "@solana/wallet-adapter-base": "^0.9.24",
    "@solana/wallet-adapter-react": "^0.15.35",
    "@solana/wallet-adapter-react-ui": "^0.9.35",
    "@solana/wallet-adapter-wallets": "^0.19.25"
  }
}
web/next.config.mjs
JavaScript

export default {
  reactStrictMode: true
};
web/src/lib/env.ts
TypeScript

export const WEB = {
  apiBase: process.env.NEXT_PUBLIC_API_BASE!,
  solanaRpc: process.env.NEXT_PUBLIC_SOLANA_RPC_URL!,
  domain: process.env.NEXT_PUBLIC_DOMAIN!
};
web/src/lib/api.ts
TypeScript

import { WEB } from "./env";

export async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("lv_token") : null;
  const headers = new Headers(opts.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${WEB.apiBase}${path}`, { ...opts, headers });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "API error");
  return json;
}
web/src/lib/auth.ts
TypeScript

import bs58 from "bs58";
import { apiFetch } from "./api";
import { WEB } from "./env";

export function buildSiwsMessageClient(args: {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: string;
  nonce: string;
  issuedAt: string;
}) {
  return [
    `${args.domain} wants you to sign in with your Solana account:`,
    `${args.address}`,
    "",
    args.statement,
    "",
    `URI: ${args.uri}`,
    `Version: ${args.version}`,
    `Chain ID: ${args.chainId}`,
    `Nonce: ${args.nonce}`,
    `Issued At: ${args.issuedAt}`
  ].join("\n");
}

export async function siwsSignIn(args: {
  wallet: { publicKey: any; signMessage: (msg: Uint8Array) => Promise<Uint8Array> };
}) {
  const nonceResp = await apiFetch("/v1/auth/nonce", { method: "POST", body: JSON.stringify({}) });

  const walletStr = args.wallet.publicKey.toBase58();
  const statement = "Sign in to LegacyVault to manage your vaults and build transactions.";

  const message = buildSiwsMessageClient({
    domain: WEB.domain,
    address: walletStr,
    statement,
    uri: `http://${WEB.domain}`,
    version: "1",
    chainId: "solana:devnet",
    nonce: nonceResp.nonce,
    issuedAt: nonceResp.issuedAt
  });

  const sigBytes = await args.wallet.signMessage(new TextEncoder().encode(message));
  const signatureBase58 = bs58.encode(sigBytes);

  const verify = await apiFetch("/v1/auth/verify", {
    method: "POST",
    body: JSON.stringify({
      wallet: walletStr,
      message,
      signatureBase58,
      nonce: nonceResp.nonce,
      issuedAt: nonceResp.issuedAt
    })
  });

  localStorage.setItem("lv_token", verify.token);
  return verify;
}
web/src/lib/solana.ts
TypeScript

import { Connection } from "@solana/web3.js";
import { WEB } from "./env";
export const connection = new Connection(WEB.solanaRpc, "confirmed");
web/src/components/WalletProviders.tsx
React

"use client";

import { ReactNode, useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WEB } from "../lib/env";

import "@solana/wallet-adapter-react-ui/styles.css";

export function WalletProviders({ children }: { children: ReactNode }) {
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  return (
    <ConnectionProvider endpoint={WEB.solanaRpc}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
web/src/components/Navbar.tsx
React

"use client";

import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function Navbar() {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: 12, borderBottom: "1px solid #eee" }}>
      <div style={{ display: "flex", gap: 12 }}>
        <Link href="/">Home</Link>
        <Link href="/signin">Sign in</Link>
        <Link href="/dashboard">Dashboard</Link>
      </div>
      <WalletMultiButton />
    </div>
  );
}
web/src/app/layout.tsx
React

import { ReactNode } from "react";
import { WalletProviders } from "../components/WalletProviders";
import { Navbar } from "../components/Navbar";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WalletProviders>
          <Navbar />
          <div style={{ padding: 16 }}>{children}</div>
        </WalletProviders>
      </body>
    </html>
  );
}
web/src/app/page.tsx
React

export default function HomePage() {
  return (
    <div>
      <h1>LegacyVault</h1>
      <p>Digital estate vaults on Solana (alpha scaffold).</p>
    </div>
  );
}
web/src/app/signin/page.tsx
React

"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { siwsSignIn } from "../../lib/auth";

export default function SignInPage() {
  const wallet = useWallet();

  return (
    <div>
      <h2>Sign in</h2>
      <p>This uses SIWS-style message signing.</p>

      <button
        disabled={!wallet.connected || !wallet.signMessage}
        onClick={async () => {
          const res = await siwsSignIn({ wallet: wallet as any });
          alert(`Signed in. Expires: ${res.expiresAt}`);
        }}
      >
        Sign in with wallet
      </button>

      {!wallet.signMessage && <p>Your wallet does not support signMessage.</p>}
    </div>
  );
}
web/src/app/dashboard/page.tsx
React

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../lib/api";

export default function DashboardPage() {
  const [vaults, setVaults] = useState<any[]>([]);

  useEffect(() => {
    apiFetch("/v1/vaults")
      .then((r) => setVaults(r.vaults))
      .catch(() => setVaults([]));
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>
      <ul>
        {vaults.map(v => (
          <li key={v.vaultPubkey}>
            <Link href={`/vault/${v.vaultPubkey}`}>{v.vaultPubkey}</Link> — {v.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
web/src/app/vault/[vault]/page.tsx
React

"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";

export default function VaultPage() {
  const params = useParams();
  const vault = params.vault as string;

  const [data, setData] = useState<any>(null);

  useEffect(() => {
    apiFetch(`/v1/vaults/${vault}`).then(setData).catch(() => setData(null));
  }, [vault]);

  return (
    <div>
      <h2>Vault</h2>
      <pre style={{ background: "#f7f7f7", padding: 12 }}>
        {JSON.stringify(data, null, 2)}
      </pre>
      <p>Next: add tx builder UI (create vault, add beneficiaries, guardian approval, distribution batches).</p>
    </div>
  );
}
9) “One command boot” steps
Create .env from .env.example
Install dependencies:
Bash

pnpm i
Run migrations:
Bash

pnpm db:migrate
Start stack:
Bash

docker compose up --build


indexer/src/handlers/derivedState.ts — fully implemented mapping all Anchor events → Prisma derived state
api/src/routes/tx.ts — expanded to cover the entire protocol surface (vault/plan/liveness/unlock/dispute/distribution/subscription/pro-guardian/bonds)
web/src/app/vault/[vault]/page.tsx — a complete guided flow UI: setup plan → unlock → distribute
I’m also including two tiny integration patches that are required for these to actually run:

a patch to indexer/src/handlers/eventsToDb.ts so it calls applyDerivedStateFromEvents
a patch to api/src/routes/vaults.ts to add a /full endpoint (UI uses it)
1) indexer/src/handlers/derivedState.ts
This file assumes your Prisma schema includes Document and AssetRule models (recommended for a full build).
If you don’t have them yet, add them (schema snippet at top of file).

TypeScript

// indexer/src/handlers/derivedState.ts
import { PublicKey } from "@solana/web3.js";
import { prisma } from "../db";

/**
 * REQUIRED Prisma additions (if not present yet):
 *
 * model Document {
 *   id          String   @id @default(cuid())
 *   vaultId     String
 *   vault       Vault    @relation(fields: [vaultId], references: [id])
 *   docHashHex  String
 *   uri         String?
 *   uriLen      Int
 *   tsUnix      BigInt
 *   createdAt   DateTime @default(now())
 *   @@unique([vaultId, docHashHex])
 * }
 *
 * model AssetRule {
 *   id                 String   @id @default(cuid())
 *   vaultId            String
 *   vault              Vault    @relation(fields: [vaultId], references: [id])
 *   mint               String
 *   mode               String
 *   assignedBeneficiary String
 *   tsUnix             BigInt
 *   updatedAt          DateTime @updatedAt
 *   @@unique([vaultId, mint])
 * }
 */

type AnchorEvent = { name: string; data: any };

function pkToStr(x: any): string {
  if (!x) return "";
  if (typeof x === "string") return x;
  // Anchor often returns PublicKey objects
  if (x instanceof PublicKey) return x.toBase58();
  if (typeof x?.toBase58 === "function") return x.toBase58();
  return String(x);
}

function toBigInt(x: any): bigint {
  if (x === null || x === undefined) return 0n;
  if (typeof x === "bigint") return x;
  if (typeof x === "number") return BigInt(Math.trunc(x));
  if (typeof x === "string") return BigInt(x);
  // Anchor BN
  if (typeof x?.toString === "function") return BigInt(x.toString());
  return 0n;
}

function toNumber(x: any): number {
  if (x === null || x === undefined) return 0;
  if (typeof x === "number") return x;
  if (typeof x === "bigint") return Number(x);
  if (typeof x === "string") return Number(x);
  if (typeof x?.toString === "function") return Number(x.toString());
  return 0;
}

function field<T = any>(obj: any, ...names: string[]): T | undefined {
  for (const n of names) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, n)) return obj[n];
  }
  return undefined;
}

async function ensureVaultByPubkey(vaultPubkey: string, ownerWallet?: string, vaultIdU64?: string) {
  const status = "Unknown";
  return prisma.vault.upsert({
    where: { vaultPubkey },
    create: {
      vaultPubkey,
      ownerWallet: ownerWallet ?? "unknown",
      vaultIdU64: vaultIdU64 ?? null,
      status
    },
    update: {
      ownerWallet: ownerWallet ?? undefined,
      vaultIdU64: vaultIdU64 ?? undefined
    }
  });
}

async function ensureUnlockByPubkey(unlockPubkey: string, vaultId: string, nonceU64?: string) {
  return prisma.unlockSession.upsert({
    where: { unlockPubkey },
    create: {
      unlockPubkey,
      vaultId,
      nonceU64: nonceU64 ?? "0",
      status: "Unknown",
      initiatedBy: "unknown",
      initiatedAtUnix: 0n,
      approvals: 0,
      threshold: 0,
      approvedAtUnix: null,
      executableAtUnix: null
    },
    update: {
      nonceU64: nonceU64 ?? undefined
    }
  });
}

export async function applyDerivedStateFromEvents(args: {
  signature: string;
  slot: bigint;
  blockTime?: bigint | null;
  programId: string;
  events: AnchorEvent[];
}) {
  // Run in a single DB transaction for consistency
  await prisma.$transaction(async (tx) => {
    for (const evt of args.events) {
      const d = evt.data ?? {};
      const tsUnix = toBigInt(field(d, "ts", "timestamp", "tsUnix") ?? 0);

      switch (evt.name) {
        // --------------------
        // Vault lifecycle / config
        // --------------------
        case "VaultCreated": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          const owner = pkToStr(field(d, "owner"));
          const vaultId = toBigInt(field(d, "vaultId", "vault_id") ?? 0).toString();

          await tx.vault.upsert({
            where: { vaultPubkey },
            create: {
              vaultPubkey,
              ownerWallet: owner,
              vaultIdU64: vaultId,
              status: "Active"
            },
            update: {
              ownerWallet: owner,
              vaultIdU64: vaultId,
              status: "Active"
            }
          });
          break;
        }

        case "PanicFrozen": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          await tx.vault.updateMany({ where: { vaultPubkey }, data: { status: "Frozen" } });
          break;
        }

        case "Unfrozen": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          await tx.vault.updateMany({ where: { vaultPubkey }, data: { status: "Active" } });
          break;
        }

        case "DocumentSet": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          const vault = await ensureVaultByPubkey(vaultPubkey);

          const docHash = field(d, "docHash", "doc_hash") as number[] | Uint8Array | undefined;
          const docHashHex = docHash ? Buffer.from(docHash as any).toString("hex") : "";

          const uriLen = toNumber(field(d, "docUriLen", "doc_uri_len") ?? 0);
          // actual URI string isn’t in event; stored on-chain in vault state; optional
          await (tx as any).document?.upsert?.({
            where: { vaultId_docHashHex: { vaultId: vault.id, docHashHex } },
            create: { vaultId: vault.id, docHashHex, uri: null, uriLen, tsUnix },
            update: { uriLen, tsUnix }
          });
          break;
        }

        // --------------------
        // Guardians
        // --------------------
        case "GuardianAdded": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          const guardian = pkToStr(field(d, "guardian"));
          const role = String(field(d, "role") ?? "Personal");

          const vault = await ensureVaultByPubkey(vaultPubkey);

          await tx.guardian.upsert({
            where: { vaultId_guardian: { vaultId: vault.id, guardian } },
            create: { vaultId: vault.id, guardian, role, active: true },
            update: { role, active: true }
          });

          break;
        }

        case "GuardianRemoved": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          const guardian = pkToStr(field(d, "guardian"));
          const vault = await ensureVaultByPubkey(vaultPubkey);

          await tx.guardian.updateMany({
            where: { vaultId: vault.id, guardian },
            data: { active: false }
          });
          break;
        }

        case "GuardianThresholdSet": {
          // You may persist this in a VaultSettings table; current schema stores only Vault.status.
          // We still touch updatedAt via a no-op update so UI refreshes.
          const vaultPubkey = pkToStr(field(d, "vault"));
          await tx.vault.updateMany({ where: { vaultPubkey }, data: {} });
          break;
        }

        // --------------------
        // Beneficiaries
        // --------------------
        case "BeneficiaryAdded": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          const beneficiary = pkToStr(field(d, "beneficiary"));
          const shareBps = toNumber(field(d, "shareBps", "share_bps") ?? 0);

          const vault = await ensureVaultByPubkey(vaultPubkey);

          await tx.beneficiary.upsert({
            where: { vaultId_beneficiary: { vaultId: vault.id, beneficiary } },
            create: {
              vaultId: vault.id,
              beneficiary,
              shareBps,
              label: null,
              active: true
            },
            update: { shareBps, active: true }
          });
          break;
        }

        case "BeneficiaryUpdated": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          const beneficiary = pkToStr(field(d, "beneficiary"));
          const shareBps = toNumber(field(d, "shareBps", "share_bps") ?? 0);
          const active = Boolean(field(d, "active") ?? true);

          const vault = await ensureVaultByPubkey(vaultPubkey);

          await tx.beneficiary.upsert({
            where: { vaultId_beneficiary: { vaultId: vault.id, beneficiary } },
            create: { vaultId: vault.id, beneficiary, shareBps, label: null, active },
            update: { shareBps, active }
          });
          break;
        }

        case "BeneficiaryRemoved": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          const beneficiary = pkToStr(field(d, "beneficiary"));

          const vault = await ensureVaultByPubkey(vaultPubkey);
          await tx.beneficiary.updateMany({
            where: { vaultId: vault.id, beneficiary },
            data: { active: false }
          });
          break;
        }

        // --------------------
        // Asset rules
        // --------------------
        case "AssetRuleSet": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          const mint = pkToStr(field(d, "mint"));
          const mode = String(field(d, "mode") ?? "ProRata");
          const assignedBeneficiary = pkToStr(field(d, "assignedBeneficiary", "assigned_beneficiary"));

          const vault = await ensureVaultByPubkey(vaultPubkey);

          await (tx as any).assetRule?.upsert?.({
            where: { vaultId_mint: { vaultId: vault.id, mint } },
            create: { vaultId: vault.id, mint, mode, assignedBeneficiary, tsUnix },
            update: { mode, assignedBeneficiary, tsUnix }
          });
          break;
        }

        // --------------------
        // Check-in
        // --------------------
        case "CheckIn": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          // For richer UX, persist lastCheckinUnix as a Vault column.
          await tx.vault.updateMany({ where: { vaultPubkey }, data: {} });
          break;
        }

        // --------------------
        // Unlock lifecycle
        // --------------------
        case "UnlockInitiated": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          const unlockPubkey = pkToStr(field(d, "unlock"));
          const nonce = toBigInt(field(d, "nonce") ?? 0).toString();
          const initiatedBy = pkToStr(field(d, "initiatedBy", "initiated_by"));

          const vault = await ensureVaultByPubkey(vaultPubkey);
          await tx.vault.update({ where: { id: vault.id }, data: { status: "Unlocking" } });

          await tx.unlockSession.upsert({
            where: { unlockPubkey },
            create: {
              unlockPubkey,
              vaultId: vault.id,
              nonceU64: nonce,
              status: "Proposed",
              initiatedBy,
              initiatedAtUnix: tsUnix,
              approvals: 0,
              threshold: 0,
              approvedAtUnix: null,
              executableAtUnix: null
            },
            update: {
              vaultId: vault.id,
              nonceU64: nonce,
              status: "Proposed",
              initiatedBy,
              initiatedAtUnix: tsUnix
            }
          });
          break;
        }

        case "UnlockApproved": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          const unlockPubkey = pkToStr(field(d, "unlock"));
          const guardian = pkToStr(field(d, "guardian"));
          const approvals = toNumber(field(d, "approvals") ?? 0);
          const threshold = toNumber(field(d, "threshold") ?? 0);

          const vault = await ensureVaultByPubkey(vaultPubkey);
          const unlock = await ensureUnlockByPubkey(unlockPubkey, vault.id);

          await tx.unlockSession.update({
            where: { id: unlock.id },
            data: {
              approvals,
              threshold,
              status: approvals >= threshold && threshold > 0 ? "Approved" : "Proposed"
            }
          });

          await tx.approval.upsert({
            where: { unlockId_guardian: { unlockId: unlock.id, guardian } },
            create: { unlockId: unlock.id, guardian, approvedAtUnix: tsUnix },
            update: { approvedAtUnix: tsUnix }
          });

          break;
        }

        case "UnlockCancelled": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          const unlockPubkey = pkToStr(field(d, "unlock"));

          const vault = await ensureVaultByPubkey(vaultPubkey);
          await tx.vault.update({ where: { id: vault.id }, data: { status: "Active" } });

          await tx.unlockSession.updateMany({
            where: { unlockPubkey },
            data: { status: "Cancelled" }
          });
          break;
        }

        case "DisputeOpened": {
          const unlockPubkey = pkToStr(field(d, "unlock"));
          const openedBy = pkToStr(field(d, "openedBy", "opened_by"));
          const noteHash = field(d, "noteHash", "note_hash") as number[] | Uint8Array | undefined;
          const noteHashHex = noteHash ? Buffer.from(noteHash as any).toString("hex") : "";

          const unlock = await tx.unlockSession.findUnique({ where: { unlockPubkey } });
          if (unlock) {
            await tx.unlockSession.update({ where: { id: unlock.id }, data: { status: "Disputed" } });

            await tx.disputeCase.upsert({
              where: { unlockId: unlock.id },
              create: {
                unlockId: unlock.id,
                status: "Open",
                openedBy,
                openedAtUnix: tsUnix,
                noteHashHex
              },
              update: {
                status: "Open",
                openedBy,
                openedAtUnix: tsUnix,
                noteHashHex
              }
            });
          }
          break;
        }

        case "DisputeResolved": {
          const unlockPubkey = pkToStr(field(d, "unlock"));
          const status = String(field(d, "status") ?? "ResolvedProceed");

          const unlock = await tx.unlockSession.findUnique({ where: { unlockPubkey } });
          if (unlock) {
            await tx.disputeCase.updateMany({
              where: { unlockId: unlock.id },
              data: {
                status,
                resolvedAt: new Date()
              }
            });

            // unlock status update is program-specific; approximate:
            await tx.unlockSession.update({
              where: { id: unlock.id },
              data: {
                status: status.includes("Cancel") ? "Cancelled" : unlock.status
              }
            });
          }
          break;
        }

        // --------------------
        // Distributions
        // --------------------
        case "SolDistributionInitialized": {
          const unlockPubkey = pkToStr(field(d, "unlock"));
          const totalDistributable = toBigInt(field(d, "totalDistributable", "total_distributable") ?? 0);

          const unlock = await tx.unlockSession.findUnique({ where: { unlockPubkey } });
          if (unlock) {
            await tx.distributionSolSession.upsert({
              where: { unlockId: unlock.id },
              create: {
                unlockId: unlock.id,
                totalDistributable,
                paidTotal: 0n,
                cursor: 0,
                done: totalDistributable === 0n
              },
              update: { totalDistributable }
            });
          }
          break;
        }

        case "SolDistributionBatchExecuted": {
          const unlockPubkey = pkToStr(field(d, "unlock"));
          const newCursor = toNumber(field(d, "newCursor", "new_cursor") ?? 0);

          const unlock = await tx.unlockSession.findUnique({ where: { unlockPubkey } });
          if (unlock) {
            await tx.distributionSolSession.updateMany({
              where: { unlockId: unlock.id },
              data: {
                cursor: newCursor
              }
            });
          }
          break;
        }

        case "SplDistributionInitialized": {
          const unlockPubkey = pkToStr(field(d, "unlock"));
          const mint = pkToStr(field(d, "mint"));
          const totalBalance = toBigInt(field(d, "totalBalance", "total_balance") ?? 0);

          const unlock = await tx.unlockSession.findUnique({ where: { unlockPubkey } });
          if (unlock) {
            await tx.distributionSplSession.upsert({
              where: { unlockId_mint: { unlockId: unlock.id, mint } },
              create: { unlockId: unlock.id, mint, totalBalance, paidTotal: 0n, cursor: 0, done: totalBalance === 0n },
              update: { totalBalance }
            });
          }
          break;
        }

        case "SplDistributionBatchExecuted": {
          const unlockPubkey = pkToStr(field(d, "unlock"));
          const mint = pkToStr(field(d, "mint"));
          const newCursor = toNumber(field(d, "newCursor", "new_cursor") ?? 0);
          const done = Boolean(field(d, "done") ?? false);

          const unlock = await tx.unlockSession.findUnique({ where: { unlockPubkey } });
          if (unlock) {
            await tx.distributionSplSession.updateMany({
              where: { unlockId: unlock.id, mint },
              data: { cursor: newCursor, done }
            });
          }
          break;
        }

        case "UnlockFinalized": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          const unlockPubkey = pkToStr(field(d, "unlock"));

          await tx.vault.updateMany({ where: { vaultPubkey }, data: { status: "Distributed" } });
          await tx.unlockSession.updateMany({ where: { unlockPubkey }, data: { status: "Executed" } });
          break;
        }

        // --------------------
        // Subscription & professional guardians
        // --------------------
        case "SubscriptionSet": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          const planId = toNumber(field(d, "planId", "plan_id") ?? 0);
          const validUntilUnix = toBigInt(field(d, "validUntilUnix", "valid_until_unix") ?? 0);

          const vault = await ensureVaultByPubkey(vaultPubkey);

          await tx.subscription.upsert({
            where: { vaultId_planId: { vaultId: vault.id, planId } },
            create: { vaultId: vault.id, planId, validUntilUnix },
            update: { validUntilUnix }
          });
          break;
        }

        case "GuardianProfileRegistered": {
          const guardian = pkToStr(field(d, "guardian"));
          await tx.guardianProfile.upsert({
            where: { guardian },
            create: { guardian, displayName: null, websiteUri: null, kycLevel: 0, active: true },
            update: {}
          });
          break;
        }

        case "GuardianBondUpdated": {
          const guardian = pkToStr(field(d, "guardian"));
          const amount = toBigInt(field(d, "amount") ?? 0);
          const locked = Boolean(field(d, "locked") ?? false);

          await tx.guardianBond.upsert({
            where: { guardian },
            create: { guardian, amount, locked },
            update: { amount, locked }
          });
          break;
        }

        // --------------------
        // Events we intentionally ignore in derived state (still captured in EventLog)
        // --------------------
        case "ConfigInitialized":
        case "PoolCreated":
        case "SolDeposited":
        case "SolWithdrawn":
        case "SplDeposited":
        case "SplWithdrawn":
        default:
          break;
      }
    }
  });
}
Patch: call derived state from eventsToDb.ts
TypeScript

// indexer/src/handlers/eventsToDb.ts
import { prisma } from "../db";
import { applyDerivedStateFromEvents } from "./derivedState";

export async function persistEvents(args: {
  signature: string;
  slot: bigint;
  programId: string;
  blockTime?: bigint | null;
  events: Array<{ name: string; data: any }>;
}) {
  await prisma.eventLog.upsert({
    where: { signature: args.signature },
    create: {
      signature: args.signature,
      slot: args.slot,
      programId: args.programId,
      eventName: args.events.map(e => e.name).join(","),
      dataJson: args.events as any,
      blockTime: args.blockTime ?? null
    },
    update: {
      slot: args.slot,
      eventName: args.events.map(e => e.name).join(","),
      dataJson: args.events as any,
      blockTime: args.blockTime ?? null
    }
  });

  // NEW:
  await applyDerivedStateFromEvents({
    signature: args.signature,
    slot: args.slot,
    blockTime: args.blockTime ?? null,
    programId: args.programId,
    events: args.events
  });
}
2) api/src/routes/tx.ts — expanded to cover entire protocol surface
This is a single file replacement. It:

validates input with zod
fetches on-chain state when needed (e.g., next unlock nonce, beneficiaries list)
builds unsigned tx base64 (sometimes with pre-instructions like ATA creation)
returns { txBase64, blockhash, lastValidBlockHeight, meta }
TypeScript

// api/src/routes/tx.ts
import express from "express";
import { z } from "zod";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  SYSVAR_RENT_PUBKEY
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction
} from "@solana/spl-token";
import BN from "bn.js";

import { requireAuth } from "../auth";
import { program, connection } from "../anchor";
import { buildUnsignedTxBase64 } from "../txbuild";

// PDAs from sdk (workspace)
import { legacyvaultPdas as pdas } from "@legacyvault/sdk";

export const txRouter = express.Router();

const PubkeyStr = z.string().refine((s) => {
  try { new PublicKey(s); return true; } catch { return false; }
}, "Invalid pubkey");

function pk(s: string) { return new PublicKey(s); }

async function buildTx(res: any, feePayer: PublicKey, ixs: TransactionInstruction[], meta: any = {}) {
  const built = await buildUnsignedTxBase64({ connection, feePayer, ixs });
  res.json({ ok: true, ...built, meta });
}

async function getConfig() {
  const [cfg] = pdas.configPda(program.programId);
  return program.account.globalConfig.fetch(cfg) as any;
}

async function getVaultAcc(vault: PublicKey) {
  return program.account.vault.fetch(vault) as any;
}

async function getIndexAcc(vault: PublicKey) {
  const [index] = pdas.indexPda(program.programId, vault);
  return { index, acc: await program.account.vaultIndex.fetch(index) as any };
}

async function maybeCreateAtaIx(payer: PublicKey, owner: PublicKey, mint: PublicKey) {
  const ata = getAssociatedTokenAddressSync(mint, owner, true, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
  const info = await connection.getAccountInfo(ata, "confirmed");
  if (info) return { ata, ix: null as any };
  const ix = createAssociatedTokenAccountInstruction(
    payer, ata, owner, mint, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID
  );
  return { ata, ix };
}

/**
 * NOTE: label16 and fixed byte arrays:
 * - beneficiary label: 16 bytes (numbers 0..255)
 * In JS we create it using: Buffer.from(str.padEnd(16,"\0")).slice(0,16)
 */

txRouter.post("/create-vault", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({
    vaultId: z.string(),
    heartbeatSecs: z.number().int().positive(),
    inactivitySecs: z.number().int().positive(),
    timelockSecs: z.number().int().positive(),
    panicEnabled: z.boolean()
  });
  const body = Body.parse(req.body);
  const owner = pk(req.user.wallet);

  const [cfg] = pdas.configPda(program.programId);
  const cfgAcc: any = await program.account.globalConfig.fetch(cfg);
  const treasury = cfgAcc.treasury as PublicKey;

  const [vault] = pdas.vaultPda(program.programId, owner, BigInt(body.vaultId));
  const [vaultAuth] = pdas.vaultAuthPda(program.programId, vault);
  const [index] = pdas.indexPda(program.programId, vault);

  const ix = await program.methods
    .createVault(
      new BN(body.vaultId),
      body.heartbeatSecs,
      body.inactivitySecs,
      body.timelockSecs,
      body.panicEnabled
    )
    .accounts({
      config: cfg,
      vault,
      vaultAuth,
      index,
      owner,
      treasury,
      systemProgram: SystemProgram.programId
    })
    .instruction();

  await buildTx(res, owner, [ix], { vault: vault.toBase58() });
});

// ---------------------
// Documents
// ---------------------
txRouter.post("/set-document", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({
    vault: PubkeyStr,
    docHashHex: z.string().length(64),
    docUri: z.string().max(200)
  });
  const body = Body.parse(req.body);

  const owner = pk(req.user.wallet);
  const vault = pk(body.vault);
  const [cfg] = pdas.configPda(program.programId);

  const docHash = Uint8Array.from(Buffer.from(body.docHashHex, "hex"));
  const docUriBytes = Array.from(Buffer.from(body.docUri, "utf8"));

  const ix = await program.methods
    .setDocument(Array.from(docHash) as any, docUriBytes)
    .accounts({ config: cfg, vault, owner })
    .instruction();

  await buildTx(res, owner, [ix]);
});

// ---------------------
// Guardians
// ---------------------
txRouter.post("/add-guardian", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({
    vault: PubkeyStr,
    guardian: PubkeyStr,
    role: z.number().int().min(0).max(1) // 0 personal, 1 professional
  });
  const body = Body.parse(req.body);

  const owner = pk(req.user.wallet);
  const vault = pk(body.vault);
  const guardian = pk(body.guardian);

  const [cfg] = pdas.configPda(program.programId);
  const [index] = pdas.indexPda(program.programId, vault);
  const [ge] = pdas.guardianEntryPda(program.programId, vault, guardian);

  const ix = await program.methods
    .addGuardian(body.role)
    .accounts({
      config: cfg, vault, index,
      guardianEntry: ge,
      guardian,
      owner,
      systemProgram: SystemProgram.programId
    })
    .instruction();

  await buildTx(res, owner, [ix]);
});

txRouter.post("/remove-guardian", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({ vault: PubkeyStr, guardian: PubkeyStr });
  const body = Body.parse(req.body);

  const owner = pk(req.user.wallet);
  const vault = pk(body.vault);
  const guardian = pk(body.guardian);

  const [cfg] = pdas.configPda(program.programId);
  const [index] = pdas.indexPda(program.programId, vault);
  const [ge] = pdas.guardianEntryPda(program.programId, vault, guardian);

  const ix = await program.methods
    .removeGuardian()
    .accounts({
      config: cfg, vault, index,
      guardianEntry: ge,
      guardian,
      owner
    })
    .instruction();

  await buildTx(res, owner, [ix]);
});

txRouter.post("/set-guardian-threshold", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({ vault: PubkeyStr, threshold: z.number().int().min(1).max(255) });
  const body = Body.parse(req.body);

  const owner = pk(req.user.wallet);
  const vault = pk(body.vault);

  const [cfg] = pdas.configPda(program.programId);
  const [index] = pdas.indexPda(program.programId, vault);

  const ix = await program.methods
    .setGuardianThreshold(body.threshold)
    .accounts({ config: cfg, vault, index, owner })
    .instruction();

  await buildTx(res, owner, [ix]);
});

// ---------------------
// Beneficiaries
// ---------------------
txRouter.post("/add-beneficiary", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({
    vault: PubkeyStr,
    beneficiary: PubkeyStr,
    shareBps: z.number().int().min(1).max(10_000),
    label: z.string().max(16).default("")
  });
  const body = Body.parse(req.body);

  const owner = pk(req.user.wallet);
  const vault = pk(body.vault);
  const beneficiary = pk(body.beneficiary);

  const label16 = Array.from(Buffer.from(body.label.padEnd(16, "\0")).slice(0, 16));
  const [cfg] = pdas.configPda(program.programId);
  const [index] = pdas.indexPda(program.programId, vault);
  const [be] = pdas.beneficiaryEntryPda(program.programId, vault, beneficiary);

  const ix = await program.methods
    .addBeneficiary(body.shareBps, label16)
    .accounts({
      config: cfg, vault, index,
      beneficiaryEntry: be,
      beneficiary,
      owner,
      systemProgram: SystemProgram.programId
    })
    .instruction();

  await buildTx(res, owner, [ix]);
});

txRouter.post("/update-beneficiary", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({
    vault: PubkeyStr,
    beneficiary: PubkeyStr,
    shareBps: z.number().int().min(0).max(10_000),
    label: z.string().max(16).default(""),
    active: z.boolean()
  });
  const body = Body.parse(req.body);

  const owner = pk(req.user.wallet);
  const vault = pk(body.vault);
  const beneficiary = pk(body.beneficiary);

  const label16 = Array.from(Buffer.from(body.label.padEnd(16, "\0")).slice(0, 16));
  const [cfg] = pdas.configPda(program.programId);
  const [index] = pdas.indexPda(program.programId, vault);
  const [be] = pdas.beneficiaryEntryPda(program.programId, vault, beneficiary);

  const ix = await program.methods
    .updateBeneficiary(body.shareBps, label16, body.active)
    .accounts({ config: cfg, vault, index, beneficiaryEntry: be, beneficiary, owner })
    .instruction();

  await buildTx(res, owner, [ix]);
});

txRouter.post("/remove-beneficiary", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({ vault: PubkeyStr, beneficiary: PubkeyStr });
  const body = Body.parse(req.body);

  const owner = pk(req.user.wallet);
  const vault = pk(body.vault);
  const beneficiary = pk(body.beneficiary);

  const [cfg] = pdas.configPda(program.programId);
  const [index] = pdas.indexPda(program.programId, vault);
  const [be] = pdas.beneficiaryEntryPda(program.programId, vault, beneficiary);

  const ix = await program.methods
    .removeBeneficiary()
    .accounts({ config: cfg, vault, index, beneficiaryEntry: be, beneficiary, owner })
    .instruction();

  await buildTx(res, owner, [ix]);
});

txRouter.post("/assert-beneficiary-total-10k", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({ vault: PubkeyStr });
  const body = Body.parse(req.body);

  const owner = pk(req.user.wallet);
  const vault = pk(body.vault);
  const [cfg] = pdas.configPda(program.programId);
  const { index, acc } = await getIndexAcc(vault);

  const remaining = (acc.beneficiaries as PublicKey[]).map((b) => {
    const [be] = pdas.beneficiaryEntryPda(program.programId, vault, b);
    return { pubkey: be, isSigner: false, isWritable: false };
  });

  const ix = await program.methods
    .assertBeneficiaryTotal10k()
    .accounts({ config: cfg, vault, index, owner })
    .remainingAccounts(remaining)
    .instruction();

  await buildTx(res, owner, [ix], { beneficiaries: remaining.length });
});

// ---------------------
// Asset rules
// ---------------------
txRouter.post("/set-asset-rule", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({
    vault: PubkeyStr,
    mint: PubkeyStr,
    mode: z.number().int().min(0).max(1), // 0=ProRata,1=AssignAll
    assignedBeneficiary: PubkeyStr.optional()
  });
  const body = Body.parse(req.body);

  const owner = pk(req.user.wallet);
  const vault = pk(body.vault);
  const mint = pk(body.mint);

  const [cfg] = pdas.configPda(program.programId);
  const [index] = pdas.indexPda(program.programId, vault);
  const [assetRule] = pdas.assetRulePda(program.programId, vault, mint);

  const assigned = body.assignedBeneficiary ? pk(body.assignedBeneficiary) : new PublicKey("11111111111111111111111111111111");

  const ix = await program.methods
    .setAssetRule(body.mode)
    .accounts({
      config: cfg,
      vault,
      index,
      mint,
      assetRule,
      assignedBeneficiary: assigned,
      owner,
      systemProgram: SystemProgram.programId
    })
    .instruction();

  await buildTx(res, owner, [ix]);
});

txRouter.post("/clear-asset-rule", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({ vault: PubkeyStr, mint: PubkeyStr });
  const body = Body.parse(req.body);

  const owner = pk(req.user.wallet);
  const vault = pk(body.vault);
  const mint = pk(body.mint);

  const [cfg] = pdas.configPda(program.programId);
  const [assetRule] = pdas.assetRulePda(program.programId, vault, mint);

  const ix = await program.methods
    .clearAssetRule()
    .accounts({ config: cfg, vault, mint, assetRule, owner })
    .instruction();

  await buildTx(res, owner, [ix]);
});

// ---------------------
// Deposits/withdrawals
// ---------------------
txRouter.post("/deposit-sol", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({ vault: PubkeyStr, lamports: z.string() });
  const body = Body.parse(req.body);

  const owner = pk(req.user.wallet);
  const vault = pk(body.vault);
  const [cfg] = pdas.configPda(program.programId);

  const ix = await program.methods
    .depositSol(new BN(body.lamports))
    .accounts({ config: cfg, vault, owner, systemProgram: SystemProgram.programId })
    .instruction();

  await buildTx(res, owner, [ix]);
});

txRouter.post("/withdraw-sol", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({ vault: PubkeyStr, lamports: z.string() });
  const body = Body.parse(req.body);

  const owner = pk(req.user.wallet);
  const vault = pk(body.vault);
  const [cfg] = pdas.configPda(program.programId);

  const ix = await program.methods
    .withdrawSol(new BN(body.lamports))
    .accounts({ config: cfg, vault, owner, systemProgram: SystemProgram.programId })
    .instruction();

  await buildTx(res, owner, [ix]);
});

txRouter.post("/deposit-spl", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({ vault: PubkeyStr, mint: PubkeyStr, amount: z.string() });
  const body = Body.parse(req.body);

  const owner = pk(req.user.wallet);
  const vault = pk(body.vault);
  const mint = pk(body.mint);

  const [cfg] = pdas.configPda(program.programId);
  const [vaultAuth] = pdas.vaultAuthPda(program.programId, vault);

  const ownerAta = getAssociatedTokenAddressSync(mint, owner);
  const vaultAta = getAssociatedTokenAddressSync(mint, vaultAuth, true);

  const ix = await program.methods
    .depositSpl(new BN(body.amount))
    .accounts({
      config: cfg, vault, vaultAuth, mint,
      owner,
      ownerAta,
      vaultAta,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY
    })
    .instruction();

  await buildTx(res, owner, [ix]);
});

txRouter.post("/withdraw-spl", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({ vault: PubkeyStr, mint: PubkeyStr, amount: z.string() });
  const body = Body.parse(req.body);

  const owner = pk(req.user.wallet);
  const vault = pk(body.vault);
  const mint = pk(body.mint);

  const [cfg] = pdas.configPda(program.programId);
  const [vaultAuth] = pdas.vaultAuthPda(program.programId, vault);

  const ownerAta = getAssociatedTokenAddressSync(mint, owner);
  const vaultAta = getAssociatedTokenAddressSync(mint, vaultAuth, true);

  const ix = await program.methods
    .withdrawSpl(new BN(body.amount))
    .accounts({
      config: cfg, vault, vaultAuth, mint,
      owner,
      ownerAta,
      vaultAta,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY
    })
    .instruction();

  await buildTx(res, owner, [ix]);
});

// ---------------------
// Liveness
// ---------------------
txRouter.post("/check-in", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({ vault: PubkeyStr });
  const body = Body.parse(req.body);

  const owner = pk(req.user.wallet);
  const vault = pk(body.vault);
  const [cfg] = pdas.configPda(program.programId);

  const ix = await program.methods
    .checkIn()
    .accounts({ config: cfg, vault, owner })
    .instruction();

  await buildTx(res, owner, [ix]);
});

txRouter.post("/add-delegate", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({ vault: PubkeyStr, delegate: PubkeyStr });
  const body = Body.parse(req.body);

  const owner = pk(req.user.wallet);
  const vault = pk(body.vault);
  const delegate = pk(body.delegate);

  const [cfg] = pdas.configPda(program.programId);
  const [de] = pdas.delegateEntryPda(program.programId, vault, delegate);

  const ix = await program.methods
    .addLivenessDelegate()
    .accounts({
      config: cfg,
      vault,
      delegateEntry: de,
      delegate,
      owner,
      systemProgram: SystemProgram.programId
    })
    .instruction();

  await buildTx(res, owner, [ix]);
});

txRouter.post("/remove-delegate", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({ vault: PubkeyStr, delegate: PubkeyStr });
  const body = Body.parse(req.body);

  const owner = pk(req.user.wallet);
  const vault = pk(body.vault);
  const delegate = pk(body.delegate);

  const [cfg] = pdas.configPda(program.programId);
  const [de] = pdas.delegateEntryPda(program.programId, vault, delegate);

  const ix = await program.methods
    .removeLivenessDelegate()
    .accounts({ config: cfg, vault, delegateEntry: de, delegate, owner })
    .instruction();

  await buildTx(res, owner, [ix]);
});

txRouter.post("/delegate-check-in", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({ vault: PubkeyStr, delegate: PubkeyStr });
  const body = Body.parse(req.body);

  const delegate = pk(req.user.wallet);
  const vault = pk(body.vault);

  const [cfg] = pdas.configPda(program.programId);
  const [de] = pdas.delegateEntryPda(program.programId, vault, delegate);

  const ix = await program.methods
    .delegateCheckIn()
    .accounts({ config: cfg, vault, delegateEntry: de, delegate })
    .instruction();

  await buildTx(res, delegate, [ix]);
});

// ---------------------
// Freeze
// ---------------------
txRouter.post("/panic-freeze", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({ vault: PubkeyStr });
  const body = Body.parse(req.body);

  const owner = pk(req.user.wallet);
  const vault = pk(body.vault);
  const [cfg] = pdas.configPda(program.programId);

  const ix = await program.methods
    .panicFreeze()
    .accounts({ config: cfg, vault, owner })
    .instruction();

  await buildTx(res, owner, [ix]);
});

txRouter.post("/unfreeze", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({ vault: PubkeyStr });
  const body = Body.parse(req.body);

  const owner = pk(req.user.wallet);
  const vault = pk(body.vault);
  const [cfg] = pdas.configPda(program.programId);

  const ix = await program.methods
    .unfreeze()
    .accounts({ config: cfg, vault, owner })
    .instruction();

  await buildTx(res, owner, [ix]);
});

// ---------------------
// Unlock
// ---------------------
txRouter.post("/initiate-unlock", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({ vault: PubkeyStr });
  const body = Body.parse(req.body);

  const guardian = pk(req.user.wallet);
  const vault = pk(body.vault);
  const [cfg] = pdas.configPda(program.programId);

  const vaultAcc: any = await getVaultAcc(vault);
  const nextNonce = BigInt(vaultAcc.currentNonce.toString()) + 1n;
  const [unlock] = pdas.unlockPda(program.programId, vault, nextNonce);
  const [ge] = pdas.guardianEntryPda(program.programId, vault, guardian);

  const ix = await program.methods
    .initiateUnlock()
    .accounts({
      config: cfg,
      vault,
      guardianEntry: ge,
      unlock,
      guardian,
      systemProgram: SystemProgram.programId
    })
    .instruction();

  await buildTx(res, guardian, [ix], { unlock: unlock.toBase58(), nonce: nextNonce.toString() });
});

txRouter.post("/approve-unlock", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({ vault: PubkeyStr, unlock: PubkeyStr });
  const body = Body.parse(req.body);

  const guardian = pk(req.user.wallet);
  const vault = pk(body.vault);
  const unlock = pk(body.unlock);

  const [cfg] = pdas.configPda(program.programId);
  const [ge] = pdas.guardianEntryPda(program.programId, vault, guardian);
  const [approval] = pdas.approvalPda(program.programId, unlock, guardian);

  const ix = await program.methods
    .approveUnlock()
    .accounts({
      config: cfg,
      vault,
      guardianEntry: ge,
      unlock,
      approval,
      guardian,
      systemProgram: SystemProgram.programId
    })
    .instruction();

  await buildTx(res, guardian, [ix]);
});

txRouter.post("/cancel-unlock", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({ vault: PubkeyStr, unlock: PubkeyStr });
  const body = Body.parse(req.body);

  const owner = pk(req.user.wallet);
  const vault = pk(body.vault);
  const unlock = pk(body.unlock);

  const [cfg] = pdas.configPda(program.programId);

  const ix = await program.methods
    .cancelUnlock()
    .accounts({ config: cfg, vault, unlock, owner })
    .instruction();

  await buildTx(res, owner, [ix]);
});

// ---------------------
// Dispute
// ---------------------
txRouter.post("/open-dispute", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({
    vault: PubkeyStr,
    unlock: PubkeyStr,
    noteHashHex: z.string().length(64)
  });
  const body = Body.parse(req.body);

  const opener = pk(req.user.wallet);
  const vault = pk(body.vault);
  const unlock = pk(body.unlock);

  const [cfg] = pdas.configPda(program.programId);
  const [dispute] = pdas.disputePda(program.programId, unlock);

  const noteHash = Uint8Array.from(Buffer.from(body.noteHashHex, "hex"));

  const ix = await program.methods
    .openDispute(Array.from(noteHash) as any)
    .accounts({
      config: cfg,
      vault,
      unlock,
      dispute,
      opener,
      systemProgram: SystemProgram.programId
    })
    .instruction();

  await buildTx(res, opener, [ix]);
});

txRouter.post("/resolve-dispute-cancel", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({ vault: PubkeyStr, unlock: PubkeyStr });
  const body = Body.parse(req.body);

  const arbiter = pk(req.user.wallet);
  const vault = pk(body.vault);
  const unlock = pk(body.unlock);

  const [cfg] = pdas.configPda(program.programId);
  const [dispute] = pdas.disputePda(program.programId, unlock);

  const ix = await program.methods
    .resolveDisputeCancel()
    .accounts({ config: cfg, vault, unlock, dispute, arbiter })
    .instruction();

  await buildTx(res, arbiter, [ix]);
});

txRouter.post("/resolve-dispute-proceed", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({ vault: PubkeyStr, unlock: PubkeyStr });
  const body = Body.parse(req.body);

  const arbiter = pk(req.user.wallet);
  const vault = pk(body.vault);
  const unlock = pk(body.unlock);

  const [cfg] = pdas.configPda(program.programId);
  const [dispute] = pdas.disputePda(program.programId, unlock);

  const ix = await program.methods
    .resolveDisputeProceed()
    .accounts({ config: cfg, vault, unlock, dispute, arbiter })
    .instruction();

  await buildTx(res, arbiter, [ix]);
});

// ---------------------
// Distribution (SOL)
// ---------------------
txRouter.post("/init-dist-sol", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({ vault: PubkeyStr, unlock: PubkeyStr });
  const body = Body.parse(req.body);

  const payer = pk(req.user.wallet);
  const vault = pk(body.vault);
  const unlock = pk(body.unlock);

  const [cfg] = pdas.configPda(program.programId);
  const [distSol] = pdas.distSolPda(program.programId, unlock);

  const ix = await program.methods
    .initDistributionSolSession()
    .accounts({
      config: cfg,
      vault,
      unlock,
      distSol,
      payer,
      systemProgram: SystemProgram.programId
    })
    .instruction();

  await buildTx(res, payer, [ix], { distSol: distSol.toBase58() });
});

txRouter.post("/exec-dist-sol-batch", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({
    vault: PubkeyStr,
    unlock: PubkeyStr,
    startIndex: z.number().int().min(0),
    batchSize: z.number().int().min(1).max(25)
  });
  const body = Body.parse(req.body);

  const payer = pk(req.user.wallet);
  const vault = pk(body.vault);
  const unlock = pk(body.unlock);

  const [cfg] = pdas.configPda(program.programId);
  const [index] = pdas.indexPda(program.programId, vault);
  const [distSol] = pdas.distSolPda(program.programId, unlock);

  const idxAcc: any = await program.account.vaultIndex.fetch(index);
  const ben: PublicKey[] = idxAcc.beneficiaries;

  const slice = ben.slice(body.startIndex, body.startIndex + body.batchSize);
  const remaining = [];
  for (const b of slice) {
    const [be] = pdas.beneficiaryEntryPda(program.programId, vault, b);
    remaining.push({ pubkey: be, isSigner: false, isWritable: false });
    remaining.push({ pubkey: b, isSigner: false, isWritable: true });
  }

  const ix = await program.methods
    .executeDistributionSolBatch(body.startIndex, slice.length)
    .accounts({
      config: cfg,
      vault,
      unlock,
      index,
      distSol,
      systemProgram: SystemProgram.programId
    })
    .remainingAccounts(remaining)
    .instruction();

  await buildTx(res, payer, [ix], { totalBeneficiaries: ben.length });
});

// ---------------------
// Distribution (SPL)
// ---------------------
txRouter.post("/init-dist-spl", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({ vault: PubkeyStr, unlock: PubkeyStr, mint: PubkeyStr });
  const body = Body.parse(req.body);

  const payer = pk(req.user.wallet);
  const vault = pk(body.vault);
  const unlock = pk(body.unlock);
  const mint = pk(body.mint);

  const [cfg] = pdas.configPda(program.programId);
  const [vaultAuth] = pdas.vaultAuthPda(program.programId, vault);
  const [distSpl] = pdas.distSplPda(program.programId, unlock, mint);

  const { ata: vaultAta, ix: createVaultAtaIx } = await maybeCreateAtaIx(payer, vaultAuth, mint);

  const ix = await program.methods
    .initDistributionSplSession()
    .accounts({
      config: cfg,
      vault,
      unlock,
      vaultAuth,
      mint,
      distSpl,
      vaultAta,
      payer,
      systemProgram: SystemProgram.programId
    })
    .instruction();

  const ixs = [createVaultAtaIx, ix].filter(Boolean) as TransactionInstruction[];
  await buildTx(res, payer, ixs, { vaultAta: vaultAta.toBase58(), distSpl: distSpl.toBase58() });
});

txRouter.post("/exec-dist-spl-batch", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({
    vault: PubkeyStr,
    unlock: PubkeyStr,
    mint: PubkeyStr,
    startIndex: z.number().int().min(0),
    batchSize: z.number().int().min(1).max(10),
    createMissingAtas: z.boolean().default(false)
  });
  const body = Body.parse(req.body);

  const payer = pk(req.user.wallet);
  const vault = pk(body.vault);
  const unlock = pk(body.unlock);
  const mint = pk(body.mint);

  const [cfg] = pdas.configPda(program.programId);
  const [vaultAuth] = pdas.vaultAuthPda(program.programId, vault);
  const [index] = pdas.indexPda(program.programId, vault);
  const [distSpl] = pdas.distSplPda(program.programId, unlock, mint);

  const vaultAta = getAssociatedTokenAddressSync(mint, vaultAuth, true, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

  const idxAcc: any = await program.account.vaultIndex.fetch(index);
  const ben: PublicKey[] = idxAcc.beneficiaries;

  const slice = ben.slice(body.startIndex, body.startIndex + body.batchSize);

  const preIxs: TransactionInstruction[] = [];
  const remaining: any[] = [];

  for (const b of slice) {
    const [be] = pdas.beneficiaryEntryPda(program.programId, vault, b);
    const ata = getAssociatedTokenAddressSync(mint, b, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

    if (body.createMissingAtas) {
      const info = await connection.getAccountInfo(ata, "confirmed");
      if (!info) {
        preIxs.push(
          createAssociatedTokenAccountInstruction(
            payer, ata, b, mint, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );
      }
    }

    remaining.push({ pubkey: be, isSigner: false, isWritable: false });
    remaining.push({ pubkey: b, isSigner: false, isWritable: false });
    remaining.push({ pubkey: ata, isSigner: false, isWritable: true });
  }

  const ix = await program.methods
    .executeDistributionSplBatch(body.startIndex, slice.length)
    .accounts({
      config: cfg,
      vault,
      vaultAuth,
      unlock,
      index,
      mint,
      distSpl,
      vaultAta,
      tokenProgram: TOKEN_PROGRAM_ID
    })
    .remainingAccounts(remaining)
    .instruction();

  await buildTx(res, payer, [...preIxs, ix], { totalBeneficiaries: ben.length });
});

// finalize unlock (requires dist_sol + remaining dist_spl sessions)
txRouter.post("/finalize-unlock", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({
    vault: PubkeyStr,
    unlock: PubkeyStr,
    splMints: z.array(PubkeyStr).default([])
  });
  const body = Body.parse(req.body);

  const payer = pk(req.user.wallet);
  const vault = pk(body.vault);
  const unlock = pk(body.unlock);

  const [cfg] = pdas.configPda(program.programId);
  const [distSol] = pdas.distSolPda(program.programId, unlock);

  const remaining = body.splMints.map((m) => {
    const mint = pk(m);
    const [distSpl] = pdas.distSplPda(program.programId, unlock, mint);
    return { pubkey: distSpl, isSigner: false, isWritable: false };
  });

  const ix = await program.methods
    .finalizeUnlock()
    .accounts({ config: cfg, vault, unlock, distSol })
    .remainingAccounts(remaining)
    .instruction();

  await buildTx(res, payer, [ix]);
});

// ---------------------
// Subscription
// ---------------------
txRouter.post("/set-subscription", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({
    vault: PubkeyStr,
    planId: z.number().int().min(0).max(255),
    validUntilUnix: z.string()
  });
  const body = Body.parse(req.body);

  const authority = pk(req.user.wallet);
  const vault = pk(body.vault);

  const [cfg] = pdas.configPda(program.programId);
  const [sub] = pdas.subscriptionPda(program.programId, vault);

  const ix = await program.methods
    .setSubscription(body.planId, new BN(body.validUntilUnix))
    .accounts({
      config: cfg,
      vault,
      subscription: sub,
      authority,
      payer: authority,
      systemProgram: SystemProgram.programId
    })
    .instruction();

  await buildTx(res, authority, [ix]);
});

txRouter.post("/renew-subscription", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({
    vault: PubkeyStr,
    planId: z.number().int().min(0).max(255),
    addSecs: z.string(),
    feeLamports: z.string()
  });
  const body = Body.parse(req.body);

  const payer = pk(req.user.wallet);
  const vault = pk(body.vault);

  const cfgAcc = await getConfig();
  const treasury = cfgAcc.treasury as PublicKey;

  const [cfg] = pdas.configPda(program.programId);
  const [sub] = pdas.subscriptionPda(program.programId, vault);

  const ix = await program.methods
    .renewSubscription(body.planId, new BN(body.addSecs), new BN(body.feeLamports))
    .accounts({
      config: cfg,
      vault,
      subscription: sub,
      payer,
      treasury,
      systemProgram: SystemProgram.programId
    })
    .instruction();

  await buildTx(res, payer, [ix]);
});

// ---------------------
// Professional guardian profile
// ---------------------
txRouter.post("/register-guardian-profile", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({
    displayName: z.string().max(32).default(""),
    websiteUri: z.string().max(100).default("")
  });
  const body = Body.parse(req.body);

  const guardian = pk(req.user.wallet);
  const [cfg] = pdas.configPda(program.programId);
  const [profile] = pdas.guardianProfilePda(program.programId, guardian);

  const ix = await program.methods
    .registerGuardianProfile(
      Array.from(Buffer.from(body.displayName, "utf8")),
      Array.from(Buffer.from(body.websiteUri, "utf8"))
    )
    .accounts({
      config: cfg,
      profile,
      guardian,
      systemProgram: SystemProgram.programId
    })
    .instruction();

  await buildTx(res, guardian, [ix]);
});

// ---------------------
// Bond management
// ---------------------
txRouter.post("/bond-topup", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({ lamports: z.string() });
  const body = Body.parse(req.body);

  const guardian = pk(req.user.wallet);
  const [cfg] = pdas.configPda(program.programId);
  const [bond] = pdas.guardianBondPda(program.programId, guardian);

  const ix = await program.methods
    .createOrTopupGuardianBond(new BN(body.lamports))
    .accounts({ config: cfg, bond, guardian, systemProgram: SystemProgram.programId })
    .instruction();

  await buildTx(res, guardian, [ix]);
});

txRouter.post("/bond-withdraw", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({ lamports: z.string() });
  const body = Body.parse(req.body);

  const guardian = pk(req.user.wallet);
  const [cfg] = pdas.configPda(program.programId);
  const [bond] = pdas.guardianBondPda(program.programId, guardian);

  const ix = await program.methods
    .withdrawGuardianBond(new BN(body.lamports))
    .accounts({ config: cfg, bond, guardian })
    .instruction();

  await buildTx(res, guardian, [ix]);
});
3) Complete guided flow UI — web/src/app/vault/[vault]/page.tsx
This page:

Fetches /v1/vaults/:vault/full
Has 3 sections:
Setup Plan (guardians/beneficiaries/threshold/assert shares)
Unlock (check-in / initiate / approve / cancel / dispute)
Distribute (init + batch execute SOL, discover SPL mints in vault, init + batch execute SPL, finalize)
Web dependencies needed:

add to web/package.json:
@solana/spl-token
@legacyvault/sdk
@coral-xyz/anchor (optional; not used here)
React

// web/src/app/vault/[vault]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { legacyvaultPdas as pdas } from "@legacyvault/sdk";

type TxBuildResp = {
  ok: boolean;
  txBase64: string;
  blockhash: string;
  lastValidBlockHeight: number;
  meta?: any;
};

function Input({ label, value, onChange, placeholder }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: "#555" }}>{label}</div>
      <input
        style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 16, marginBottom: 16 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </div>
  );
}

export default function VaultPage() {
  const params = useParams();
  const vaultPubkey = params.vault as string;

  const { connection } = useConnection();
  const wallet = useWallet();

  const [state, setState] = useState<any>(null);
  const [lastSig, setLastSig] = useState<string>("");

  // Setup plan form
  const [guardianPk, setGuardianPk] = useState("");
  const [guardianRole, setGuardianRole] = useState<"0" | "1">("0");
  const [threshold, setThreshold] = useState("2");

  const [beneficiaryPk, setBeneficiaryPk] = useState("");
  const [shareBps, setShareBps] = useState("5000");
  const [beneficiaryLabel, setBeneficiaryLabel] = useState("Spouse");
  const [beneficiaryActive, setBeneficiaryActive] = useState(true);

  // Unlock/dispute
  const [unlockPk, setUnlockPk] = useState("");
  const [noteHashHex, setNoteHashHex] = useState("".padEnd(64, "0"));

  // Distribution
  const [solBatchSize, setSolBatchSize] = useState("10");
  const [solStartIndex, setSolStartIndex] = useState("0");

  const [splBatchSize, setSplBatchSize] = useState("5");
  const [splStartIndex, setSplStartIndex] = useState("0");
  const [createMissingAtas, setCreateMissingAtas] = useState(false);

  const [discoveredMints, setDiscoveredMints] = useState<string[]>([]);
  const [selectedMints, setSelectedMints] = useState<Record<string, boolean>>({});

  const programId = useMemo(() => {
    const pid = process.env.NEXT_PUBLIC_LEGACYVAULT_PROGRAM_ID!;
    return new PublicKey(pid);
  }, []);

  async function refresh() {
    try {
      const r = await apiFetch(`/v1/vaults/${vaultPubkey}/full`);
      setState(r);
      // if there’s an active unlock in response, set it
      const latestUnlock = r?.vault?.unlockSessions?.[0]?.unlockPubkey;
      if (latestUnlock && !unlockPk) setUnlockPk(latestUnlock);
    } catch (e: any) {
      setState({ ok: false, error: e.message });
    }
  }

  useEffect(() => { refresh(); }, [vaultPubkey]);

  async function signAndSendBuiltTx(resp: TxBuildResp) {
    if (!wallet.publicKey || !wallet.signTransaction) throw new Error("Wallet not ready (need signTransaction).");

    const tx = Transaction.from(Buffer.from(resp.txBase64, "base64"));
    const sig = await wallet.sendTransaction(tx, connection, { skipPreflight: false });
    await connection.confirmTransaction(
      { signature: sig, blockhash: resp.blockhash, lastValidBlockHeight: resp.lastValidBlockHeight },
      "confirmed"
    );
    setLastSig(sig);
    await refresh();
    return sig;
  }

  async function runTx(endpoint: string, body: any) {
    const resp = await apiFetch(endpoint, { method: "POST", body: JSON.stringify(body) }) as TxBuildResp;
    if (!resp.ok) throw new Error("tx build failed");
    const sig = await signAndSendBuiltTx(resp);
    if (resp.meta?.unlock) setUnlockPk(resp.meta.unlock);
    return { sig, meta: resp.meta };
  }

  async function discoverVaultMints() {
    // Discover SPL token mints held by vault authority (vault_auth PDA)
    const vault = new PublicKey(vaultPubkey);
    const [vaultAuth] = pdas.vaultAuthPda(programId, vault);

    const tokAccs = await connection.getTokenAccountsByOwner(vaultAuth, { programId: TOKEN_PROGRAM_ID }, "confirmed");
    const mints = new Set<string>();
    for (const ta of tokAccs.value) {
      // Parse minimal: mint is at bytes 0..32 in token account data
      const data = ta.account.data;
      const mint = new PublicKey(data.slice(0, 32)).toBase58();
      // balance not parsed here (requires unpack); still useful
      mints.add(mint);
    }
    const arr = Array.from(mints);
    setDiscoveredMints(arr);
    const sel: Record<string, boolean> = {};
    for (const m of arr) sel[m] = selectedMints[m] ?? true;
    setSelectedMints(sel);
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <h2>Vault: {vaultPubkey}</h2>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <button onClick={refresh}>Refresh</button>
        {lastSig && (
          <div style={{ fontSize: 12 }}>
            Last tx: <code>{lastSig}</code>
          </div>
        )}
      </div>

      <Section title="0) Status / Debug">
        <pre style={{ background: "#f7f7f7", padding: 12, borderRadius: 8, overflowX: "auto" }}>
          {JSON.stringify(state, null, 2)}
        </pre>
      </Section>

      <Section title="1) Setup plan (Owner)">
        <h4>Guardians</h4>
        <Input label="Guardian pubkey" value={guardianPk} onChange={setGuardianPk} placeholder="..." />
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <label>
            Role:
            <select value={guardianRole} onChange={(e) => setGuardianRole(e.target.value as any)}>
              <option value="0">Personal</option>
              <option value="1">Professional</option>
            </select>
          </label>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            disabled={!wallet.publicKey || !guardianPk}
            onClick={() => runTx("/v1/tx/add-guardian", { vault: vaultPubkey, guardian: guardianPk, role: Number(guardianRole) })}
          >
            Add guardian
          </button>

          <button
            disabled={!wallet.publicKey || !guardianPk}
            onClick={() => runTx("/v1/tx/remove-guardian", { vault: vaultPubkey, guardian: guardianPk })}
          >
            Remove guardian
          </button>
        </div>

        <div style={{ marginTop: 16 }}>
          <Input label="Guardian threshold (M)" value={threshold} onChange={setThreshold} placeholder="2" />
          <button
            disabled={!wallet.publicKey}
            onClick={() => runTx("/v1/tx/set-guardian-threshold", { vault: vaultPubkey, threshold: Number(threshold) })}
          >
            Set threshold
          </button>
        </div>

        <hr style={{ margin: "24px 0" }} />

        <h4>Beneficiaries</h4>
        <Input label="Beneficiary pubkey" value={beneficiaryPk} onChange={setBeneficiaryPk} placeholder="..." />
        <Input label="Share bps (0..10000)" value={shareBps} onChange={setShareBps} placeholder="5000" />
        <Input label="Label (<=16 chars)" value={beneficiaryLabel} onChange={setBeneficiaryLabel} placeholder="Spouse" />
        <div style={{ marginBottom: 12 }}>
          <label>
            Active:
            <input type="checkbox" checked={beneficiaryActive} onChange={(e) => setBeneficiaryActive(e.target.checked)} />
          </label>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            disabled={!wallet.publicKey || !beneficiaryPk}
            onClick={() =>
              runTx("/v1/tx/add-beneficiary", {
                vault: vaultPubkey,
                beneficiary: beneficiaryPk,
                shareBps: Number(shareBps),
                label: beneficiaryLabel
              })
            }
          >
            Add beneficiary
          </button>

          <button
            disabled={!wallet.publicKey || !beneficiaryPk}
            onClick={() =>
              runTx("/v1/tx/update-beneficiary", {
                vault: vaultPubkey,
                beneficiary: beneficiaryPk,
                shareBps: Number(shareBps),
                label: beneficiaryLabel,
                active: beneficiaryActive
              })
            }
          >
            Update beneficiary
          </button>

          <button
            disabled={!wallet.publicKey || !beneficiaryPk}
            onClick={() => runTx("/v1/tx/remove-beneficiary", { vault: vaultPubkey, beneficiary: beneficiaryPk })}
          >
            Remove beneficiary
          </button>

          <button
            disabled={!wallet.publicKey}
            onClick={() => runTx("/v1/tx/assert-beneficiary-total-10k", { vault: vaultPubkey })}
          >
            Assert shares sum to 10,000 bps
          </button>
        </div>

        <hr style={{ margin: "24px 0" }} />

        <h4>Liveness</h4>
        <button disabled={!wallet.publicKey} onClick={() => runTx("/v1/tx/check-in", { vault: vaultPubkey })}>
          Check in (Owner)
        </button>
      </Section>

      <Section title="2) Unlock (Guardians + Owner override)">
        <Input label="Unlock pubkey (auto-filled after initiate)" value={unlockPk} onChange={setUnlockPk} placeholder="..." />

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button disabled={!wallet.publicKey} onClick={() => runTx("/v1/tx/initiate-unlock", { vault: vaultPubkey })}>
            Initiate unlock (as guardian wallet)
          </button>

          <button
            disabled={!wallet.publicKey || !unlockPk}
            onClick={() => runTx("/v1/tx/approve-unlock", { vault: vaultPubkey, unlock: unlockPk })}
          >
            Approve unlock (as guardian wallet)
          </button>

          <button
            disabled={!wallet.publicKey || !unlockPk}
            onClick={() => runTx("/v1/tx/cancel-unlock", { vault: vaultPubkey, unlock: unlockPk })}
          >
            Cancel unlock (Owner)
          </button>
        </div>

        <hr style={{ margin: "24px 0" }} />

        <h4>Disputes (optional)</h4>
        <Input label="noteHashHex (64 hex chars)" value={noteHashHex} onChange={setNoteHashHex} placeholder="..." />

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            disabled={!wallet.publicKey || !unlockPk || noteHashHex.length !== 64}
            onClick={() => runTx("/v1/tx/open-dispute", { vault: vaultPubkey, unlock: unlockPk, noteHashHex })}
          >
            Open dispute
          </button>

          <button
            disabled={!wallet.publicKey || !unlockPk}
            onClick={() => runTx("/v1/tx/resolve-dispute-cancel", { vault: vaultPubkey, unlock: unlockPk })}
          >
            Resolve dispute: cancel (arbiter)
          </button>

          <button
            disabled={!wallet.publicKey || !unlockPk}
            onClick={() => runTx("/v1/tx/resolve-dispute-proceed", { vault: vaultPubkey, unlock: unlockPk })}
          >
            Resolve dispute: proceed (arbiter)
          </button>
        </div>
      </Section>

      <Section title="3) Distribute (after approvals + timelock)">
        <p style={{ color: "#555" }}>
          Distribution requires: unlock approved + timelock elapsed. This UI helps you run SOL + SPL batches and then finalize.
        </p>

        <h4>SOL</h4>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button disabled={!wallet.publicKey || !unlockPk} onClick={() => runTx("/v1/tx/init-dist-sol", { vault: vaultPubkey, unlock: unlockPk })}>
            Init SOL distribution session
          </button>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <Input label="startIndex" value={solStartIndex} onChange={setSolStartIndex} placeholder="0" />
          <Input label="batchSize" value={solBatchSize} onChange={setSolBatchSize} placeholder="10" />
        </div>

        <button
          disabled={!wallet.publicKey || !unlockPk}
          onClick={() =>
            runTx("/v1/tx/exec-dist-sol-batch", {
              vault: vaultPubkey,
              unlock: unlockPk,
              startIndex: Number(solStartIndex),
              batchSize: Number(solBatchSize)
            })
          }
        >
          Execute SOL batch
        </button>

        <hr style={{ margin: "24px 0" }} />

        <h4>SPL</h4>
        <button disabled={!wallet.publicKey} onClick={discoverVaultMints}>
          Discover vault SPL mints
        </button>

        {discoveredMints.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: "#555" }}>Select mints to distribute:</div>
            {discoveredMints.map((m) => (
              <label key={m} style={{ display: "block", marginTop: 6 }}>
                <input
                  type="checkbox"
                  checked={selectedMints[m] ?? true}
                  onChange={(e) => setSelectedMints({ ...selectedMints, [m]: e.target.checked })}
                />
                <code style={{ marginLeft: 8 }}>{m}</code>
              </label>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <Input label="SPL startIndex" value={splStartIndex} onChange={setSplStartIndex} placeholder="0" />
          <Input label="SPL batchSize" value={splBatchSize} onChange={setSplBatchSize} placeholder="5" />
        </div>

        <label style={{ display: "block", marginBottom: 12 }}>
          <input
            type="checkbox"
            checked={createMissingAtas}
            onChange={(e) => setCreateMissingAtas(e.target.checked)}
          />
          <span style={{ marginLeft: 8 }}>
            Create missing beneficiary ATAs in the same tx (may hit tx size limits for large batches)
          </span>
        </label>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {(discoveredMints.filter((m) => selectedMints[m])).slice(0, 6).map((mint) => (
            <div key={mint} style={{ border: "1px solid #eee", borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 12, color: "#555" }}>Mint</div>
              <code style={{ fontSize: 12 }}>{mint}</code>

              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                <button
                  disabled={!wallet.publicKey || !unlockPk}
                  onClick={() => runTx("/v1/tx/init-dist-spl", { vault: vaultPubkey, unlock: unlockPk, mint })}
                >
                  Init SPL session
                </button>

                <button
                  disabled={!wallet.publicKey || !unlockPk}
                  onClick={() =>
                    runTx("/v1/tx/exec-dist-spl-batch", {
                      vault: vaultPubkey,
                      unlock: unlockPk,
                      mint,
                      startIndex: Number(splStartIndex),
                      batchSize: Number(splBatchSize),
                      createMissingAtas
                    })
                  }
                >
                  Exec SPL batch
                </button>
              </div>
            </div>
          ))}
        </div>

        <hr style={{ margin: "24px 0" }} />

        <h4>Finalize</h4>
        <button
          disabled={!wallet.publicKey || !unlockPk}
          onClick={() => {
            const splMints = discoveredMints.filter((m) => selectedMints[m]);
            return runTx("/v1/tx/finalize-unlock", { vault: vaultPubkey, unlock: unlockPk, splMints });
          }}
        >
          Finalize unlock (requires all dist sessions done)
        </button>
      </Section>
    </div>
  );
}
Patch: add /v1/vaults/:vault/full in API (needed by UI)
TypeScript

// api/src/routes/vaults.ts (add this handler)
vaultsRouter.get("/:vaultPubkey/full", requireAuth, async (req: any, res) => {
  const vault = await prisma.vault.findUnique({
    where: { vaultPubkey: req.params.vaultPubkey },
    include: {
      guardians: true,
      beneficiaries: true,
      unlockSessions: {
        orderBy: { createdAt: "desc" },
        include: { approvalsRows: true, distSol: true, distSpl: true, dispute: true }
      },
      subscriptions: true
    }
  });
  if (!vault) return res.status(404).json({ ok: false });
  if (vault.ownerWallet !== req.user.wallet) return res.status(403).json({ ok: false });
  res.json({ ok: true, vault });
});
What you should run next (so this works end-to-end)
Add the missing Prisma models (Document, AssetRule) if you want those derived updates to compile; then:
Bash

pnpm -C db prisma migrate dev
Boot stack:
Bash

docker compose up --build
Go to http://localhost:3000, connect wallet, sign in, open a vault route.





A) DB schema hardening (idempotency + cursors + richer read model)
Add these models/fields to db/prisma/schema.prisma, then run pnpm -C db prisma migrate dev.

1) Add indexing/idempotency tables
prisma

model IndexerCursor {
  id        String   @id
  lastSlot  BigInt   @default(0)
  updatedAt DateTime @updatedAt
}

model ProcessedTx {
  signature   String   @id
  slot        BigInt
  processedAt DateTime @default(now())
}
2) (Recommended) enrich Vault with protocol settings (so UI doesn’t need chain reads)
prisma

model Vault {
  id              String   @id @default(cuid())
  vaultPubkey     String   @unique
  ownerWallet     String
  vaultIdU64      String?
  status          String

  // NEW (optional but recommended):
  lastCheckinUnix        BigInt?
  heartbeatIntervalSecs  Int?
  inactivityThresholdSecs Int?
  timelockSecs           Int?
  guardianThreshold      Int?
  panicEnabled           Boolean?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  guardians       Guardian[]
  beneficiaries   Beneficiary[]
  unlockSessions  UnlockSession[]
  subscriptions   Subscription[]
}
3) (Recommended) add Document + AssetRule models if you want those derived-state upserts
prisma

model Document {
  id          String   @id @default(cuid())
  vaultId     String
  vault       Vault    @relation(fields: [vaultId], references: [id])
  docHashHex  String
  uri         String?
  uriLen      Int
  tsUnix      BigInt
  createdAt   DateTime @default(now())
  @@unique([vaultId, docHashHex])
}

model AssetRule {
  id                  String   @id @default(cuid())
  vaultId             String
  vault               Vault    @relation(fields: [vaultId], references: [id])
  mint                String
  mode                String
  assignedBeneficiary String
  tsUnix              BigInt
  updatedAt           DateTime @updatedAt
  @@unique([vaultId, mint])
}
B) Indexer production-hardening
B1) Replace indexer/src/handlers/derivedState.ts with this hardened version
Key upgrades:

Idempotency: skip re-applying derived state for tx signatures already processed (ProcessedTx)
Auto-create vault/unlock rows from any event (even if VaultCreated missed)
Hydrate missing state from chain (vault + unlock + dist sessions) when needed
Cursor support for deterministic backfill
TypeScript

// indexer/src/handlers/derivedState.ts
import { PublicKey } from "@solana/web3.js";
import { prisma } from "../db";
import { program } from "../anchor";

type AnchorEvent = { name: string; data: any };

function pkToStr(x: any): string {
  if (!x) return "";
  if (typeof x === "string") return x;
  if (x instanceof PublicKey) return x.toBase58();
  if (typeof x?.toBase58 === "function") return x.toBase58();
  return String(x);
}
function toBigInt(x: any): bigint {
  if (x === null || x === undefined) return 0n;
  if (typeof x === "bigint") return x;
  if (typeof x === "number") return BigInt(Math.trunc(x));
  if (typeof x === "string") return BigInt(x);
  if (typeof x?.toString === "function") return BigInt(x.toString());
  return 0n;
}
function toNumber(x: any): number {
  if (x === null || x === undefined) return 0;
  if (typeof x === "number") return x;
  if (typeof x === "bigint") return Number(x);
  if (typeof x === "string") return Number(x);
  if (typeof x?.toString === "function") return Number(x.toString());
  return 0;
}
function field<T = any>(obj: any, ...names: string[]): T | undefined {
  for (const n of names) if (obj && Object.prototype.hasOwnProperty.call(obj, n)) return obj[n];
  return undefined;
}

// ------------ chain hydration (best-effort) ------------

async function hydrateVaultFromChain(vaultPubkey: string) {
  try {
    const vaultPk = new PublicKey(vaultPubkey);
    const acc: any = await program.account.vault.fetchNullable(vaultPk);
    if (!acc) return null;
    return {
      ownerWallet: pkToStr(acc.owner),
      vaultIdU64: acc.vaultId?.toString?.() ?? acc.vaultId?.toString() ?? null,
      status: String(acc.status ?? "Unknown"),
      lastCheckinUnix: BigInt(acc.lastCheckinUnix?.toString?.() ?? "0"),
      heartbeatIntervalSecs: Number(acc.heartbeatIntervalSecs ?? 0),
      inactivityThresholdSecs: Number(acc.inactivityThresholdSecs ?? 0),
      timelockSecs: Number(acc.timelockSecs ?? 0),
      guardianThreshold: Number(acc.guardianThreshold ?? 0),
      panicEnabled: Boolean(acc.panicEnabled ?? false)
    };
  } catch {
    return null;
  }
}

async function hydrateUnlockFromChain(unlockPubkey: string) {
  try {
    const upk = new PublicKey(unlockPubkey);
    const acc: any = await program.account.unlockSession.fetchNullable(upk);
    if (!acc) return null;
    return {
      vaultPubkey: pkToStr(acc.vault),
      nonceU64: acc.nonce?.toString?.() ?? String(acc.nonce ?? "0"),
      status: String(acc.status ?? "Unknown"),
      initiatedBy: pkToStr(acc.initiatedBy),
      initiatedAtUnix: BigInt(acc.initiatedAtUnix?.toString?.() ?? "0"),
      approvals: Number(acc.approvals ?? 0),
      threshold: Number(acc.threshold ?? 0),
      approvedAtUnix: BigInt(acc.approvedAtUnix?.toString?.() ?? "0"),
      executableAtUnix: BigInt(acc.executableAtUnix?.toString?.() ?? "0")
    };
  } catch {
    return null;
  }
}

// ------------ resolvers (auto-create) ------------

async function ensureVault(tx: any, vaultPubkey: string, hintOwner?: string) {
  let v = await tx.vault.findUnique({ where: { vaultPubkey } });
  if (v) return v;

  // create placeholder; fill with hintOwner if available
  v = await tx.vault.create({
    data: {
      vaultPubkey,
      ownerWallet: hintOwner ?? "unknown",
      vaultIdU64: null,
      status: "Unknown"
    }
  });

  // hydrate best-effort immediately
  const hydrated = await hydrateVaultFromChain(vaultPubkey);
  if (hydrated) {
    v = await tx.vault.update({
      where: { id: v.id },
      data: {
        ownerWallet: hydrated.ownerWallet ?? v.ownerWallet,
        vaultIdU64: hydrated.vaultIdU64 ?? v.vaultIdU64,
        status: hydrated.status ?? v.status,
        lastCheckinUnix: hydrated.lastCheckinUnix,
        heartbeatIntervalSecs: hydrated.heartbeatIntervalSecs,
        inactivityThresholdSecs: hydrated.inactivityThresholdSecs,
        timelockSecs: hydrated.timelockSecs,
        guardianThreshold: hydrated.guardianThreshold,
        panicEnabled: hydrated.panicEnabled
      }
    });
  }

  return v;
}

async function ensureUnlock(tx: any, unlockPubkey: string, vaultId: string, nonceU64?: string) {
  let u = await tx.unlockSession.findUnique({ where: { unlockPubkey } });
  if (u) return u;

  u = await tx.unlockSession.create({
    data: {
      unlockPubkey,
      vaultId,
      nonceU64: nonceU64 ?? "0",
      status: "Unknown",
      initiatedBy: "unknown",
      initiatedAtUnix: 0n,
      approvals: 0,
      threshold: 0,
      approvedAtUnix: null,
      executableAtUnix: null
    }
  });

  // best-effort hydrate
  const hydrated = await hydrateUnlockFromChain(unlockPubkey);
  if (hydrated) {
    // ensure referenced vault exists and link if mismatch
    const chainVault = await ensureVault(tx, hydrated.vaultPubkey);
    u = await tx.unlockSession.update({
      where: { id: u.id },
      data: {
        vaultId: chainVault.id,
        nonceU64: hydrated.nonceU64,
        status: hydrated.status,
        initiatedBy: hydrated.initiatedBy,
        initiatedAtUnix: hydrated.initiatedAtUnix,
        approvals: hydrated.approvals,
        threshold: hydrated.threshold,
        approvedAtUnix: hydrated.approvedAtUnix ? hydrated.approvedAtUnix : null,
        executableAtUnix: hydrated.executableAtUnix ? hydrated.executableAtUnix : null
      }
    });
  }

  return u;
}

export async function applyDerivedStateFromEvents(args: {
  signature: string;
  slot: bigint;
  blockTime?: bigint | null;
  programId: string;
  events: AnchorEvent[];
}) {
  await prisma.$transaction(async (tx) => {
    // Idempotency gate (skip derived-state reapply if we already processed this signature)
    const processed = await tx.processedTx.findUnique({ where: { signature: args.signature } });
    if (processed) return;

    // Mark processed early; if txn fails, entire tx rolls back (good).
    await tx.processedTx.create({
      data: { signature: args.signature, slot: args.slot }
    });

    for (const evt of args.events) {
      const d = evt.data ?? {};
      const tsUnix = toBigInt(field(d, "ts", "timestamp", "tsUnix") ?? 0);

      switch (evt.name) {
        // -------------
        // VaultCreated / vault lifecycle
        // -------------
        case "VaultCreated": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          const ownerWallet = pkToStr(field(d, "owner"));
          const vaultIdU64 = toBigInt(field(d, "vaultId", "vault_id") ?? 0).toString();

          await tx.vault.upsert({
            where: { vaultPubkey },
            create: { vaultPubkey, ownerWallet, vaultIdU64, status: "Active" },
            update: { ownerWallet, vaultIdU64, status: "Active" }
          });

          // also seed cursor row if missing (optional)
          await tx.indexerCursor.upsert({
            where: { id: "legacyvault" },
            create: { id: "legacyvault", lastSlot: args.slot },
            update: { lastSlot: args.slot }
          });

          break;
        }

        case "PanicFrozen": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          const v = await ensureVault(tx, vaultPubkey);
          await tx.vault.update({ where: { id: v.id }, data: { status: "Frozen" } });
          break;
        }

        case "Unfrozen": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          const v = await ensureVault(tx, vaultPubkey);
          await tx.vault.update({ where: { id: v.id }, data: { status: "Active" } });
          break;
        }

        case "DocumentSet": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          const v = await ensureVault(tx, vaultPubkey);

          const docHash = field(d, "docHash", "doc_hash") as any;
          const docHashHex = docHash ? Buffer.from(docHash).toString("hex") : "";
          const uriLen = toNumber(field(d, "docUriLen", "doc_uri_len") ?? 0);

          if ((tx as any).document) {
            await (tx as any).document.upsert({
              where: { vaultId_docHashHex: { vaultId: v.id, docHashHex } },
              create: { vaultId: v.id, docHashHex, uri: null, uriLen, tsUnix },
              update: { uriLen, tsUnix }
            });
          }
          break;
        }

        // -------------
        // Guardians / Beneficiaries
        // -------------
        case "GuardianAdded": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          const guardian = pkToStr(field(d, "guardian"));
          const role = String(field(d, "role") ?? "Personal");

          const v = await ensureVault(tx, vaultPubkey);
          await tx.guardian.upsert({
            where: { vaultId_guardian: { vaultId: v.id, guardian } },
            create: { vaultId: v.id, guardian, role, active: true },
            update: { role, active: true }
          });
          break;
        }

        case "GuardianRemoved": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          const guardian = pkToStr(field(d, "guardian"));

          const v = await ensureVault(tx, vaultPubkey);
          await tx.guardian.updateMany({ where: { vaultId: v.id, guardian }, data: { active: false } });
          break;
        }

        case "GuardianThresholdSet": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          const threshold = toNumber(field(d, "threshold") ?? 0);
          const v = await ensureVault(tx, vaultPubkey);
          await tx.vault.update({ where: { id: v.id }, data: { guardianThreshold: threshold } });
          break;
        }

        case "BeneficiaryAdded": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          const beneficiary = pkToStr(field(d, "beneficiary"));
          const shareBps = toNumber(field(d, "shareBps", "share_bps") ?? 0);

          const v = await ensureVault(tx, vaultPubkey);
          await tx.beneficiary.upsert({
            where: { vaultId_beneficiary: { vaultId: v.id, beneficiary } },
            create: { vaultId: v.id, beneficiary, shareBps, label: null, active: true },
            update: { shareBps, active: true }
          });
          break;
        }

        case "BeneficiaryUpdated": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          const beneficiary = pkToStr(field(d, "beneficiary"));
          const shareBps = toNumber(field(d, "shareBps", "share_bps") ?? 0);
          const active = Boolean(field(d, "active") ?? true);

          const v = await ensureVault(tx, vaultPubkey);
          await tx.beneficiary.upsert({
            where: { vaultId_beneficiary: { vaultId: v.id, beneficiary } },
            create: { vaultId: v.id, beneficiary, shareBps, label: null, active },
            update: { shareBps, active }
          });
          break;
        }

        case "BeneficiaryRemoved": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          const beneficiary = pkToStr(field(d, "beneficiary"));

          const v = await ensureVault(tx, vaultPubkey);
          await tx.beneficiary.updateMany({ where: { vaultId: v.id, beneficiary }, data: { active: false } });
          break;
        }

        // -------------
        // Asset rules
        // -------------
        case "AssetRuleSet": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          const mint = pkToStr(field(d, "mint"));
          const mode = String(field(d, "mode") ?? "ProRata");
          const assignedBeneficiary = pkToStr(field(d, "assignedBeneficiary", "assigned_beneficiary"));

          const v = await ensureVault(tx, vaultPubkey);
          if ((tx as any).assetRule) {
            await (tx as any).assetRule.upsert({
              where: { vaultId_mint: { vaultId: v.id, mint } },
              create: { vaultId: v.id, mint, mode, assignedBeneficiary, tsUnix },
              update: { mode, assignedBeneficiary, tsUnix }
            });
          }
          break;
        }

        // -------------
        // Check-ins
        // -------------
        case "CheckIn": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          const v = await ensureVault(tx, vaultPubkey);
          await tx.vault.update({ where: { id: v.id }, data: { lastCheckinUnix: tsUnix } });
          break;
        }

        // -------------
        // Unlock lifecycle
        // -------------
        case "UnlockInitiated": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          const unlockPubkey = pkToStr(field(d, "unlock"));
          const nonceU64 = toBigInt(field(d, "nonce") ?? 0).toString();
          const initiatedBy = pkToStr(field(d, "initiatedBy", "initiated_by"));

          const v = await ensureVault(tx, vaultPubkey);
          await tx.vault.update({ where: { id: v.id }, data: { status: "Unlocking" } });

          await tx.unlockSession.upsert({
            where: { unlockPubkey },
            create: {
              unlockPubkey,
              vaultId: v.id,
              nonceU64,
              status: "Proposed",
              initiatedBy,
              initiatedAtUnix: tsUnix,
              approvals: 0,
              threshold: 0,
              approvedAtUnix: null,
              executableAtUnix: null
            },
            update: {
              vaultId: v.id,
              nonceU64,
              status: "Proposed",
              initiatedBy,
              initiatedAtUnix: tsUnix
            }
          });
          break;
        }

        case "UnlockApproved": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          const unlockPubkey = pkToStr(field(d, "unlock"));
          const guardian = pkToStr(field(d, "guardian"));
          const approvals = toNumber(field(d, "approvals") ?? 0);
          const threshold = toNumber(field(d, "threshold") ?? 0);

          const v = await ensureVault(tx, vaultPubkey);
          const u = await ensureUnlock(tx, unlockPubkey, v.id);

          await tx.unlockSession.update({
            where: { id: u.id },
            data: {
              approvals,
              threshold,
              status: approvals >= threshold && threshold > 0 ? "Approved" : "Proposed"
            }
          });

          await tx.approval.upsert({
            where: { unlockId_guardian: { unlockId: u.id, guardian } },
            create: { unlockId: u.id, guardian, approvedAtUnix: tsUnix },
            update: { approvedAtUnix: tsUnix }
          });
          break;
        }

        case "UnlockCancelled": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          const unlockPubkey = pkToStr(field(d, "unlock"));

          const v = await ensureVault(tx, vaultPubkey);
          await tx.vault.update({ where: { id: v.id }, data: { status: "Active" } });

          await tx.unlockSession.updateMany({ where: { unlockPubkey }, data: { status: "Cancelled" } });
          break;
        }

        // -------------
        // Disputes
        // -------------
        case "DisputeOpened": {
          const unlockPubkey = pkToStr(field(d, "unlock"));
          const openedBy = pkToStr(field(d, "openedBy", "opened_by"));
          const noteHash = field(d, "noteHash", "note_hash") as any;
          const noteHashHex = noteHash ? Buffer.from(noteHash).toString("hex") : "";

          // hydrate unlock (need vault link)
          const hydrated = await hydrateUnlockFromChain(unlockPubkey);
          const v = hydrated ? await ensureVault(tx, hydrated.vaultPubkey) : null;
          const u = v ? await ensureUnlock(tx, unlockPubkey, v.id) : await tx.unlockSession.findUnique({ where: { unlockPubkey } });

          if (u) {
            await tx.unlockSession.update({ where: { id: u.id }, data: { status: "Disputed" } });

            await tx.disputeCase.upsert({
              where: { unlockId: u.id },
              create: { unlockId: u.id, status: "Open", openedBy, openedAtUnix: tsUnix, noteHashHex },
              update: { status: "Open", openedBy, openedAtUnix: tsUnix, noteHashHex }
            });
          }
          break;
        }

        case "DisputeResolved": {
          const unlockPubkey = pkToStr(field(d, "unlock"));
          const status = String(field(d, "status") ?? "ResolvedProceed");

          const u = await tx.unlockSession.findUnique({ where: { unlockPubkey } });
          if (u) {
            await tx.disputeCase.updateMany({ where: { unlockId: u.id }, data: { status, resolvedAt: new Date() } });
            if (status.includes("Cancel")) {
              await tx.unlockSession.update({ where: { id: u.id }, data: { status: "Cancelled" } });
              const v = await tx.vault.findUnique({ where: { id: u.vaultId } });
              if (v) await tx.vault.update({ where: { id: v.id }, data: { status: "Active" } });
            }
          }
          break;
        }

        // -------------
        // Distributions
        // -------------
        case "SolDistributionInitialized": {
          const unlockPubkey = pkToStr(field(d, "unlock"));
          const totalDistributable = toBigInt(field(d, "totalDistributable", "total_distributable") ?? 0);

          const u = await tx.unlockSession.findUnique({ where: { unlockPubkey } });
          if (u) {
            await tx.distributionSolSession.upsert({
              where: { unlockId: u.id },
              create: { unlockId: u.id, totalDistributable, paidTotal: 0n, cursor: 0, done: totalDistributable === 0n },
              update: { totalDistributable }
            });
          }
          break;
        }

        case "SolDistributionBatchExecuted": {
          const unlockPubkey = pkToStr(field(d, "unlock"));
          const newCursor = toNumber(field(d, "newCursor", "new_cursor") ?? 0);

          const u = await tx.unlockSession.findUnique({ where: { unlockPubkey } });
          if (u) {
            await tx.distributionSolSession.updateMany({ where: { unlockId: u.id }, data: { cursor: newCursor } });
          }
          break;
        }

        case "SplDistributionInitialized": {
          const unlockPubkey = pkToStr(field(d, "unlock"));
          const mint = pkToStr(field(d, "mint"));
          const totalBalance = toBigInt(field(d, "totalBalance", "total_balance") ?? 0);

          const u = await tx.unlockSession.findUnique({ where: { unlockPubkey } });
          if (u) {
            await tx.distributionSplSession.upsert({
              where: { unlockId_mint: { unlockId: u.id, mint } },
              create: { unlockId: u.id, mint, totalBalance, paidTotal: 0n, cursor: 0, done: totalBalance === 0n },
              update: { totalBalance }
            });
          }
          break;
        }

        case "SplDistributionBatchExecuted": {
          const unlockPubkey = pkToStr(field(d, "unlock"));
          const mint = pkToStr(field(d, "mint"));
          const newCursor = toNumber(field(d, "newCursor", "new_cursor") ?? 0);
          const done = Boolean(field(d, "done") ?? false);

          const u = await tx.unlockSession.findUnique({ where: { unlockPubkey } });
          if (u) {
            await tx.distributionSplSession.updateMany({ where: { unlockId: u.id, mint }, data: { cursor: newCursor, done } });
          }
          break;
        }

        case "UnlockFinalized": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          const unlockPubkey = pkToStr(field(d, "unlock"));

          const v = await ensureVault(tx, vaultPubkey);
          await tx.vault.update({ where: { id: v.id }, data: { status: "Distributed" } });
          await tx.unlockSession.updateMany({ where: { unlockPubkey }, data: { status: "Executed" } });
          break;
        }

        // -------------
        // Subscription / pro guardian
        // -------------
        case "SubscriptionSet": {
          const vaultPubkey = pkToStr(field(d, "vault"));
          const planId = toNumber(field(d, "planId", "plan_id") ?? 0);
          const validUntilUnix = toBigInt(field(d, "validUntilUnix", "valid_until_unix") ?? 0);

          const v = await ensureVault(tx, vaultPubkey);
          await tx.subscription.upsert({
            where: { vaultId_planId: { vaultId: v.id, planId } },
            create: { vaultId: v.id, planId, validUntilUnix },
            update: { validUntilUnix }
          });
          break;
        }

        case "GuardianProfileRegistered": {
          const guardian = pkToStr(field(d, "guardian"));
          await tx.guardianProfile.upsert({
            where: { guardian },
            create: { guardian, displayName: null, websiteUri: null, kycLevel: 0, active: true },
            update: {}
          });
          break;
        }

        case "GuardianBondUpdated": {
          const guardian = pkToStr(field(d, "guardian"));
          const amount = toBigInt(field(d, "amount") ?? 0);
          const locked = Boolean(field(d, "locked") ?? false);

          await tx.guardianBond.upsert({
            where: { guardian },
            create: { guardian, amount, locked },
            update: { amount, locked }
          });
          break;
        }

        default:
          break;
      }
    }

    // advance cursor monotonically
    await tx.indexerCursor.upsert({
      where: { id: "legacyvault" },
      create: { id: "legacyvault", lastSlot: args.slot },
      update: { lastSlot: args.slot }
    });
  });
}
B2) Add chain backfill: indexer/src/backfill.ts
This backfills transactions that invoked your program by walking signatures for the program id address, skipping signatures already in ProcessedTx.

TypeScript

// indexer/src/backfill.ts
import { connection, programId } from "./anchor";
import { decodeAnchorEvents } from "./decode";
import { persistEvents } from "./handlers/eventsToDb";
import { prisma } from "./db";

export async function backfillOnce(args: { limit: number }) {
  const cursor = await prisma.indexerCursor.upsert({
    where: { id: "legacyvault" },
    create: { id: "legacyvault", lastSlot: 0n },
    update: {}
  });

  // We backfill by signatures; slot cursor used only for progress reporting.
  // Fetch recent signatures for the program id.
  const sigs = await connection.getSignaturesForAddress(programId, { limit: args.limit }, "confirmed");

  // Process oldest first for more natural state progression
  sigs.reverse();

  let processed = 0;
  for (const s of sigs) {
    const signature = s.signature;

    const already = await prisma.processedTx.findUnique({ where: { signature } });
    if (already) continue;

    const tx = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0
    });
    if (!tx?.meta?.logMessages) continue;

    const events = decodeAnchorEvents(tx.meta.logMessages);
    if (events.length === 0) {
      // still mark as processed to avoid refetch loops if desired:
      // await prisma.processedTx.create({ data: { signature, slot: BigInt(s.slot ?? 0) } });
      continue;
    }

    await persistEvents({
      signature,
      slot: BigInt(s.slot ?? 0),
      programId: programId.toBase58(),
      blockTime: tx.blockTime ? BigInt(tx.blockTime) : null,
      events
    });

    processed++;
  }

  // update slot cursor to max seen
  const maxSlot = sigs.reduce((m, x) => Math.max(m, x.slot ?? 0), 0);
  await prisma.indexerCursor.update({ where: { id: "legacyvault" }, data: { lastSlot: BigInt(maxSlot) } });

  return { processed, fetched: sigs.length, lastSlot: maxSlot };
}
B3) Patch indexer/src/env.ts and indexer/src/main.ts to enable backfill on boot
Add to indexer/src/env.ts:

TypeScript

// add these fields to the zod schema
INDEXER_BACKFILL_ON_BOOT: z.string().default("false"),
INDEXER_BACKFILL_LIMIT: z.string().default("200")
Patch indexer/src/main.ts:

TypeScript

import { backfillOnce } from "./backfill";

// inside main() after server starts:
if (env.INDEXER_BACKFILL_ON_BOOT === "true") {
  const limit = Number(env.INDEXER_BACKFILL_LIMIT);
  backfillOnce({ limit }).then((r) => {
    console.log("[indexer] backfill complete", r);
  }).catch(console.error);
}
C) API “distribution wizard endpoint” (single plan with progress cursors)
Add this route to the bottom of api/src/routes/tx.ts. It returns a plan made of “steps” that reference your existing tx-builder endpoints, but it also includes progress cursors (from on-chain dist sessions when present), so clients can resume.

C1) Add helper: mint discovery (server-side, Token + Token-2022)
At top of api/src/routes/tx.ts, add:

TypeScript

import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
Add this helper somewhere in tx.ts:

TypeScript

async function discoverVaultHoldingsMints(vaultAuth: PublicKey) {
  const out: Array<{ mint: string; programId: string; amount: string; decimals: number; uiAmountString: string }> = [];

  for (const pid of [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID]) {
    const parsed = await connection.getParsedTokenAccountsByOwner(vaultAuth, { programId: pid }, "confirmed");
    for (const acc of parsed.value) {
      const info: any = acc.account.data?.parsed?.info;
      if (!info) continue;
      const amount = info.tokenAmount?.amount as string;
      const decimals = info.tokenAmount?.decimals as number;
      const uiAmountString = info.tokenAmount?.uiAmountString as string;
      if (!amount || amount === "0") continue;
      out.push({ mint: info.mint, programId: pid.toBase58(), amount, decimals, uiAmountString });
    }
  }

  // collapse by mint (prefer token-2022 if duplicated; unlikely)
  const map = new Map<string, any>();
  for (const r of out) map.set(r.mint, r);
  return Array.from(map.values());
}
C2) Add the wizard endpoint
TypeScript

// POST /v1/tx/distribution-plan
txRouter.post("/distribution-plan", requireAuth, express.json(), async (req: any, res) => {
  const Body = z.object({
    vault: PubkeyStr,
    unlock: PubkeyStr,
    solBatchSize: z.number().int().min(1).max(25).default(10),
    splBatchSize: z.number().int().min(1).max(10).default(5),

    // optional: if provided, we plan for these mints only; else we discover from vault holdings
    mints: z.array(PubkeyStr).optional()
  });
  const body = Body.parse(req.body);

  const requester = pk(req.user.wallet);
  const vault = pk(body.vault);
  const unlock = pk(body.unlock);

  const [cfg] = pdas.configPda(program.programId);
  const [index] = pdas.indexPda(program.programId, vault);

  const idxAcc: any = await program.account.vaultIndex.fetch(index);
  const beneficiaries: PublicKey[] = idxAcc.beneficiaries;
  const total = beneficiaries.length;

  const [vaultAuth] = pdas.vaultAuthPda(program.programId, vault);

  // ---------- SOL dist session progress ----------
  const [distSol] = pdas.distSolPda(program.programId, unlock);
  const distSolAcc: any = await program.account.distributionSolSession.fetchNullable(distSol);

  const solCursor = distSolAcc ? Number(distSolAcc.cursor ?? 0) : 0;
  const solDone = distSolAcc ? Boolean(distSolAcc.done ?? false) : false;

  const steps: any[] = [];

  if (!distSolAcc) {
    steps.push({ name: "init-dist-sol", endpoint: "/v1/tx/init-dist-sol", body: { vault: vault.toBase58(), unlock: unlock.toBase58() } });
  }

  if (!solDone) {
    for (let start = solCursor; start < total; start += body.solBatchSize) {
      const bs = Math.min(body.solBatchSize, total - start);
      steps.push({
        name: `exec-dist-sol-batch:${start}`,
        endpoint: "/v1/tx/exec-dist-sol-batch",
        body: { vault: vault.toBase58(), unlock: unlock.toBase58(), startIndex: start, batchSize: bs }
      });
    }
  }

  // ---------- SPL mints to distribute ----------
  const mints = body.mints?.length
    ? body.mints.map(pk)
    : (await discoverVaultHoldingsMints(vaultAuth)).map((x) => new PublicKey(x.mint));

  const splPlans: any[] = [];
  for (const mint of mints) {
    const [distSpl] = pdas.distSplPda(program.programId, unlock, mint);
    const distSplAcc: any = await program.account.distributionSplSession.fetchNullable(distSpl);

    const cursor = distSplAcc ? Number(distSplAcc.cursor ?? 0) : 0;
    const done = distSplAcc ? Boolean(distSplAcc.done ?? false) : false;

    const mintSteps: any[] = [];

    if (!distSplAcc) {
      mintSteps.push({
        name: `init-dist-spl:${mint.toBase58()}`,
        endpoint: "/v1/tx/init-dist-spl",
        body: { vault: vault.toBase58(), unlock: unlock.toBase58(), mint: mint.toBase58() }
      });
    }

    if (!done) {
      for (let start = cursor; start < total; start += body.splBatchSize) {
        const bs = Math.min(body.splBatchSize, total - start);
        mintSteps.push({
          name: `exec-dist-spl-batch:${mint.toBase58()}:${start}`,
          endpoint: "/v1/tx/exec-dist-spl-batch",
          body: {
            vault: vault.toBase58(),
            unlock: unlock.toBase58(),
            mint: mint.toBase58(),
            startIndex: start,
            batchSize: bs,
            createMissingAtas: false
          }
        });
      }
    }

    splPlans.push({
      mint: mint.toBase58(),
      distSpl: distSpl.toBase58(),
      cursor,
      done,
      steps: mintSteps
    });
  }

  // ---------- Finalize step (requires dist_spl PDAs) ----------
  const splMints = splPlans.map(p => p.mint);
  steps.push({
    name: "finalize-unlock",
    endpoint: "/v1/tx/finalize-unlock",
    body: { vault: vault.toBase58(), unlock: unlock.toBase58(), splMints }
  });

  res.json({
    ok: true,
    vault: vault.toBase58(),
    unlock: unlock.toBase58(),
    totals: { beneficiaries: total },
    progress: {
      sol: { distSol: distSol.toBase58(), cursor: solCursor, done: solDone },
      spl: splPlans.map(p => ({ mint: p.mint, distSpl: p.distSpl, cursor: p.cursor, done: p.done }))
    },
    plan: {
      steps,
      splPlans
    }
  });
});
How clients use it:

Call /v1/tx/distribution-plan to get an ordered list of steps.
For each step: call endpoint with body to get a fresh unsigned tx (with a fresh blockhash), sign+send, then continue.
This avoids the “blockhash expires” problem while still giving you one “wizard plan”.

D) Web UI: mint/balance-aware SPL discovery (Token + Token-2022, filters 0 balances)
D1) Add helper: web/src/lib/discovery.ts
TypeScript

// web/src/lib/discovery.ts
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

export type TokenHolding = {
  mint: string;
  programId: string; // token program id (classic or token-2022)
  amount: string;    // raw string
  decimals: number;
  uiAmountString: string;
};

export async function discoverTokenHoldingsByOwner(connection: Connection, owner: PublicKey): Promise<TokenHolding[]> {
  const holdings: TokenHolding[] = [];

  for (const pid of [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID]) {
    const parsed = await connection.getParsedTokenAccountsByOwner(owner, { programId: pid }, "confirmed");
    for (const acc of parsed.value) {
      const info: any = acc.account.data?.parsed?.info;
      const tokenAmount = info?.tokenAmount;
      if (!info?.mint || !tokenAmount?.amount) continue;
      if (tokenAmount.amount === "0") continue;

      holdings.push({
        mint: info.mint,
        programId: pid.toBase58(),
        amount: tokenAmount.amount,
        decimals: tokenAmount.decimals,
        uiAmountString: tokenAmount.uiAmountString ?? String(tokenAmount.uiAmount ?? "")
      });
    }
  }

  // dedupe by mint
  const map = new Map<string, TokenHolding>();
  for (const h of holdings) map.set(h.mint, h);
  return Array.from(map.values());
}
D2) Patch /vault/[vault]/page.tsx SPL discovery to use it
At top:

React

import { discoverTokenHoldingsByOwner, type TokenHolding } from "../../../lib/discovery";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
Replace your discoverVaultMints() implementation with:

React

  const [holdings, setHoldings] = useState<TokenHolding[]>([]);

  async function discoverVaultMints() {
    const vault = new PublicKey(vaultPubkey);
    const [vaultAuth] = pdas.vaultAuthPda(programId, vault);

    const hs = await discoverTokenHoldingsByOwner(connection, vaultAuth);

    // optional: filter out obvious NFTs if you want (uiAmountString === "1" and decimals === 0)
    // const filtered = hs.filter(h => !(h.decimals === 0 && h.uiAmountString === "1"));
    const filtered = hs;

    setHoldings(filtered);

    const mintList = filtered.map(h => h.mint);
    setDiscoveredMints(mintList);

    const sel: Record<string, boolean> = {};
    for (const m of mintList) sel[m] = selectedMints[m] ?? true;
    setSelectedMints(sel);
  }
Update your mint display block to show balances + token program:

React

{holdings.length > 0 && (
  <div style={{ marginTop: 12 }}>
    <div style={{ fontSize: 12, color: "#555" }}>Select mints to distribute (non-zero balances):</div>
    {holdings.map((h) => (
      <label key={h.mint} style={{ display: "block", marginTop: 6 }}>
        <input
          type="checkbox"
          checked={selectedMints[h.mint] ?? true}
          onChange={(e) => setSelectedMints({ ...selectedMints, [h.mint]: e.target.checked })}
        />
        <code style={{ marginLeft: 8 }}>{h.mint}</code>
        <span style={{ marginLeft: 10, fontSize: 12, color: "#444" }}>
          balance: {h.uiAmountString} (decimals {h.decimals}) · program:{" "}
          {h.programId === TOKEN_2022_PROGRAM_ID.toBase58() ? "Token-2022" : "Token"}
        </span>
      </label>
    ))}
  </div>
)}
