one master orchestrator + modular sub-scripts (one per build layer) so each file stays readable and debuggable. Run the master and it calls everything in order.
Script Architecture

text

bootstrap/
  bootstrap.sh                  ← Master orchestrator (run this)
  scripts/
    00-preflight.sh             ← Check dependencies
    01-structure.sh             ← Create all directories
    02-build1-anchor.sh         ← Anchor workspace (Build 1)
    03-build2-instructions.sh   ← Instruction handlers (Builds 2-3)
    04-build4-api.sh            ← API server (Build 4)
    05-build5-indexer.sh        ← Indexer (Build 5)
    06-build6-hooks.sh          ← Frontend hooks (Build 6)
    07-build7-components.sh     ← UI components + App.tsx (Build 7)
    08-build8-tests.sh          ← Test suite (Build 8)
    09-build9-infra.sh          ← Production infra (Build 9)
    10-finalize.sh              ← Git init, final messages

Master Script
bootstrap.sh

Bash

#!/usr/bin/env bash
# =============================================================================
# LegacyVault — Master Bootstrap Script
# Builds 1-9 | Anchor + API + Indexer + Frontend + Infra
#
# Usage:
#   chmod +x bootstrap.sh
#   ./bootstrap.sh
#
# Prerequisites:
#   - Rust + Cargo
#   - Solana CLI (stable)
#   - Anchor CLI v0.29.0
#   - Node.js 20+
#   - Docker + Docker Compose
# =============================================================================

set -euo pipefail

# ─── Colours ─────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Colour

# ─── Banner ───────────────────────────────────────────────────────────────────
echo -e "${PURPLE}"
cat << 'BANNER'
 _                               _   _             _ _
| |    ___  __ _  __ _  ___ _  | | | | __ _ _   _| | |_
| |   / _ \/ _` |/ _` |/ __| | | | | |/ _` | | | | | __|
| |__|  __/ (_| | (_| | (__| |_| | |_| | (_| | |_| | | |_
|_____\___|\__, |\__,_|\___|\__, |\___/ \__,_|\__,_|_|\__|
           |___/            |___/
 Bootstrap v1.0 — Builds 1-9
BANNER
echo -e "${NC}"

ROOT_DIR="$(pwd)/legacyvault-project"

echo -e "${CYAN}📁 Project root: ${ROOT_DIR}${NC}\n"

# ─── Source sub-scripts ───────────────────────────────────────────────────────
SCRIPTS_DIR="$(cd "$(dirname "$0")/scripts" && pwd)"

run_step() {
  local step_num="$1"
  local step_name="$2"
  local script="$3"

  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}▶  Step ${step_num}: ${step_name}${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  if bash "${SCRIPTS_DIR}/${script}" "$ROOT_DIR"; then
    echo -e "${GREEN}✅ Step ${step_num} complete${NC}\n"
  else
    echo -e "${RED}❌ Step ${step_num} failed — check output above${NC}"
    exit 1
  fi
}

# ─── Run all steps ────────────────────────────────────────────────────────────
run_step "00" "Preflight checks"              "00-preflight.sh"
run_step "01" "Create directory structure"    "01-structure.sh"
run_step "02" "Anchor workspace (Build 1)"    "02-build1-anchor.sh"
run_step "03" "Instruction handlers (B2-3)"   "03-build23-instructions.sh"
run_step "04" "API server (Build 4)"          "04-build4-api.sh"
run_step "05" "Indexer (Build 5)"             "05-build5-indexer.sh"
run_step "06" "Frontend hooks (Build 6)"      "06-build6-hooks.sh"
run_step "07" "UI components (Build 7)"       "07-build7-components.sh"
run_step "08" "Test suite (Build 8)"          "08-build8-tests.sh"
run_step "09" "Production infra (Build 9)"    "09-build9-infra.sh"
run_step "10" "Finalize & git init"           "10-finalize.sh"

echo -e "${PURPLE}"
cat << 'DONE'
╔═══════════════════════════════════════════════════════╗
║        LegacyVault scaffold complete! 🎉             ║
╚═══════════════════════════════════════════════════════╝
DONE
echo -e "${NC}"
echo -e "${CYAN}Next steps are printed inside: ${ROOT_DIR}/NEXT_STEPS.md${NC}\n"

Sub-Script 00 — Preflight
scripts/00-preflight.sh

Bash

#!/usr/bin/env bash
# 00-preflight.sh — Check all required tools are installed
set -euo pipefail

ROOT_DIR="$1"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "  ${GREEN}✓${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; FAILED=1; }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }

FAILED=0

echo "Checking required tools..."

# Node.js 20+
if command -v node &>/dev/null; then
  NODE_VER=$(node -e "process.stdout.write(process.versions.node)")
  NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
  if [ "$NODE_MAJOR" -ge 20 ]; then
    pass "Node.js $NODE_VER"
  else
    fail "Node.js $NODE_VER (need 20+)"
  fi
else
  fail "Node.js not found"
fi

# npm
if command -v npm &>/dev/null; then
  pass "npm $(npm --version)"
else
  fail "npm not found"
fi

# Rust
if command -v rustc &>/dev/null; then
  pass "Rust $(rustc --version | awk '{print $2}')"
else
  fail "Rust not found — install: https://rustup.rs"
fi

# Solana CLI
if command -v solana &>/dev/null; then
  pass "Solana $(solana --version | awk '{print $2}')"
else
  fail "Solana CLI not found — install: https://docs.solana.com/cli/install-solana-cli-tools"
fi

# Anchor CLI
if command -v anchor &>/dev/null; then
  ANCHOR_VER=$(anchor --version | awk '{print $2}')
  pass "Anchor $ANCHOR_VER"
else
  warn "Anchor CLI not found — install: cargo install --git https://github.com/coral-xyz/anchor --tag v0.29.0 anchor-cli --locked"
fi

# Docker
if command -v docker &>/dev/null; then
  pass "Docker $(docker --version | awk '{print $3}' | tr -d ',')"
else
  warn "Docker not found — needed for Build 9 deployment"
fi

# Docker Compose
if command -v docker-compose &>/dev/null || docker compose version &>/dev/null 2>&1; then
  pass "Docker Compose available"
else
  warn "Docker Compose not found — needed for Build 9 deployment"
fi

if [ "$FAILED" -eq 1 ]; then
  echo ""
  echo -e "${RED}Some required tools are missing. Install them and re-run.${NC}"
  exit 1
fi

echo ""
echo "All critical checks passed."

Sub-Script 01 — Directory Structure
scripts/01-structure.sh

Bash

#!/usr/bin/env bash
# 01-structure.sh — Create full project directory tree
set -euo pipefail

ROOT_DIR="$1"

dirs=(
  # Anchor program
  "$ROOT_DIR/program/programs/legacyvault/src/instructions"
  "$ROOT_DIR/program/programs/legacyvault/src/state"
  "$ROOT_DIR/program/programs/legacyvault/src/errors"
  "$ROOT_DIR/program/programs/legacyvault/src/events"
  "$ROOT_DIR/program/programs/legacyvault/src/utils"
  "$ROOT_DIR/program/tests"
  "$ROOT_DIR/program/scripts"

  # API
  "$ROOT_DIR/api/src/routes"
  "$ROOT_DIR/api/src/services"
  "$ROOT_DIR/api/src/middleware"
  "$ROOT_DIR/api/src/utils"
  "$ROOT_DIR/api/src/types"
  "$ROOT_DIR/api/prisma"
  "$ROOT_DIR/api/workers"
  "$ROOT_DIR/api/tests"

  # Indexer
  "$ROOT_DIR/indexer/src/handlers"
  "$ROOT_DIR/indexer/src/workers"
  "$ROOT_DIR/indexer/src/monitoring"
  "$ROOT_DIR/indexer/src/utils"

  # Dashboard (frontend)
  "$ROOT_DIR/dashboard/src/components"
  "$ROOT_DIR/dashboard/src/hooks"
  "$ROOT_DIR/dashboard/src/providers"
  "$ROOT_DIR/dashboard/src/data"
  "$ROOT_DIR/dashboard/src/types"
  "$ROOT_DIR/dashboard/src/__tests__/hooks"
  "$ROOT_DIR/dashboard/src/__tests__/components"
  "$ROOT_DIR/dashboard/public"

  # Infra
  "$ROOT_DIR/infra/prometheus"
  "$ROOT_DIR/infra/grafana/dashboards"
  "$ROOT_DIR/infra/grafana/provisioning"
  "$ROOT_DIR/infra/nginx"
  "$ROOT_DIR/infra/secrets"

  # Shared types
  "$ROOT_DIR/shared/types"
  "$ROOT_DIR/shared/constants"

  # Deploy scripts
  "$ROOT_DIR/scripts"
)

for dir in "${dirs[@]}"; do
  mkdir -p "$dir"
done

echo "Directory tree created ($(find "$ROOT_DIR" -type d | wc -l | tr -d ' ') directories)"

Sub-Script 02 — Anchor Workspace (Build 1)
scripts/02-build1-anchor.sh

Bash

#!/usr/bin/env bash
# 02-build1-anchor.sh — Scaffold Anchor workspace (Build 1)
set -euo pipefail

ROOT_DIR="$1"
PROG="$ROOT_DIR/program"

# ─── Anchor.toml ─────────────────────────────────────────────────────────────
cat > "$PROG/Anchor.toml" << 'EOF'
[features]
seeds = true
skip-lint = false

[programs.localnet]
legacyvault = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"

[programs.devnet]
# TODO: Replace with your deployed devnet program ID
legacyvault = "TODO_DEVNET_PROGRAM_ID"

[programs.mainnet]
# TODO: Replace with your deployed mainnet program ID
legacyvault = "TODO_MAINNET_PROGRAM_ID"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "Localnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.spec.ts"

[test]
startup_wait = 10000

[[test.validator.clone]]
address = "TokenkegQfeZyiNwAJbNbGKPFXCXuBvf9Ss623VQ5DA"

[[test.validator.clone]]
address = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
EOF

# ─── Cargo.toml (workspace) ───────────────────────────────────────────────────
cat > "$PROG/Cargo.toml" << 'EOF'
[workspace]
members = [
  "programs/*"
]
resolver = "2"

[profile.release]
overflow-checks = true
lto = "fat"
codegen-units = 1

[profile.release.build-override]
opt-level = 3
incremental = false
codegen-units = 1
EOF

# ─── programs/legacyvault/Cargo.toml ─────────────────────────────────────────
cat > "$PROG/programs/legacyvault/Cargo.toml" << 'EOF'
[package]
name = "legacyvault"
version = "0.1.0"
description = "LegacyVault — On-chain digital estate executor on Solana"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "legacyvault"

[features]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
cpi = ["no-entrypoint"]
default = []

[dependencies]
anchor-lang  = { version = "0.29.0", features = ["init-if-needed"] }
anchor-spl   = { version = "0.29.0", features = ["token", "token_2022"] }
spl-token    = { version = "4.0.0",  features = ["no-entrypoint"] }
spl-token-2022 = { version = "0.9.0", features = ["no-entrypoint"] }

[dev-dependencies]
anchor-client = "0.29.0"
EOF

# ─── programs/legacyvault/src/lib.rs ─────────────────────────────────────────
cat > "$PROG/programs/legacyvault/src/lib.rs" << 'EOF'
//! LegacyVault — On-chain digital estate executor
//! Build 1: lib.rs entry point + module declarations

use anchor_lang::prelude::*;

// ── Module declarations ───────────────────────────────────────────────────────
pub mod constants;
pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;
pub mod utils;

use instructions::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

// TODO: Replace with actual program ID after `anchor build`

#[program]
pub mod legacyvault {
    use super::*;

    // ── Module A: Admin ───────────────────────────────────────────────────────
    pub fn initialize(ctx: Context<Initialize>, params: InitializeParams) -> Result<()> {
        instructions::admin::initialize(ctx, params)
    }

    pub fn set_paused(ctx: Context<SetPaused>, paused: bool) -> Result<()> {
        instructions::admin::set_paused(ctx, paused)
    }

    // ── Module B: Vault Lifecycle ─────────────────────────────────────────────
    pub fn create_vault(ctx: Context<CreateVault>, params: CreateVaultParams) -> Result<()> {
        instructions::vault::create_vault(ctx, params)
    }

    pub fn update_vault_settings(
        ctx: Context<UpdateVaultSettings>,
        params: UpdateVaultSettingsParams,
    ) -> Result<()> {
        instructions::vault::update_vault_settings(ctx, params)
    }

    pub fn freeze_vault(ctx: Context<FreezeVault>) -> Result<()> {
        instructions::vault::freeze_vault(ctx)
    }

    pub fn unfreeze_vault(ctx: Context<UnfreezeVault>) -> Result<()> {
        instructions::vault::unfreeze_vault(ctx)
    }

    // ── Module C: Guardians ───────────────────────────────────────────────────
    pub fn add_guardian(ctx: Context<AddGuardian>, params: AddGuardianParams) -> Result<()> {
        instructions::guardians::add_guardian(ctx, params)
    }

    pub fn remove_guardian(ctx: Context<RemoveGuardian>) -> Result<()> {
        instructions::guardians::remove_guardian(ctx)
    }

    // ── Module D: Beneficiaries ───────────────────────────────────────────────
    pub fn add_beneficiary(
        ctx: Context<AddBeneficiary>,
        params: AddBeneficiaryParams,
    ) -> Result<()> {
        instructions::beneficiaries::add_beneficiary(ctx, params)
    }

    pub fn update_beneficiary(
        ctx: Context<UpdateBeneficiary>,
        params: UpdateBeneficiaryParams,
    ) -> Result<()> {
        instructions::beneficiaries::update_beneficiary(ctx, params)
    }

    pub fn remove_beneficiary(ctx: Context<RemoveBeneficiary>) -> Result<()> {
        instructions::beneficiaries::remove_beneficiary(ctx)
    }

    // ── Module E: Deposits / Withdrawals ─────────────────────────────────────
    pub fn deposit_sol(ctx: Context<DepositSol>, params: DepositSolParams) -> Result<()> {
        instructions::custody::deposit_sol(ctx, params)
    }

    pub fn withdraw_sol(ctx: Context<WithdrawSol>, params: WithdrawSolParams) -> Result<()> {
        instructions::custody::withdraw_sol(ctx, params)
    }

    pub fn deposit_spl(ctx: Context<DepositSpl>, params: DepositSplParams) -> Result<()> {
        instructions::custody::deposit_spl(ctx, params)
    }

    pub fn withdraw_spl(ctx: Context<WithdrawSpl>, params: WithdrawSplParams) -> Result<()> {
        instructions::custody::withdraw_spl(ctx, params)
    }

    // ── Module F: Liveness ────────────────────────────────────────────────────
    pub fn check_in(ctx: Context<CheckIn>) -> Result<()> {
        instructions::liveness::check_in(ctx)
    }

    pub fn add_delegate(ctx: Context<AddDelegate>) -> Result<()> {
        instructions::liveness::add_delegate(ctx)
    }

    pub fn remove_delegate(ctx: Context<RemoveDelegate>) -> Result<()> {
        instructions::liveness::remove_delegate(ctx)
    }

    // ── Module G: Documents ───────────────────────────────────────────────────
    pub fn set_document_commitment(
        ctx: Context<SetDocumentCommitment>,
        params: SetDocumentCommitmentParams,
    ) -> Result<()> {
        instructions::documents::set_document_commitment(ctx, params)
    }

    pub fn revoke_document_commitment(ctx: Context<RevokeDocumentCommitment>) -> Result<()> {
        instructions::documents::revoke_document_commitment(ctx)
    }

    // ── Module H: Unlock ──────────────────────────────────────────────────────
    pub fn initiate_unlock(ctx: Context<InitiateUnlock>) -> Result<()> {
        instructions::unlock::initiate_unlock(ctx)
    }

    pub fn approve_unlock(ctx: Context<ApproveUnlock>) -> Result<()> {
        instructions::unlock::approve_unlock(ctx)
    }

    pub fn cancel_unlock(ctx: Context<CancelUnlock>) -> Result<()> {
        instructions::unlock::cancel_unlock(ctx)
    }

    // ── Module I: Disputes ────────────────────────────────────────────────────
    pub fn open_dispute(ctx: Context<OpenDispute>, params: OpenDisputeParams) -> Result<()> {
        instructions::disputes::open_dispute(ctx, params)
    }

    pub fn resolve_dispute(
        ctx: Context<ResolveDispute>,
        params: ResolveDisputeParams,
    ) -> Result<()> {
        instructions::disputes::resolve_dispute(ctx, params)
    }

    // ── Module J: Distribution ────────────────────────────────────────────────
    pub fn init_sol_distribution(ctx: Context<InitSolDistribution>) -> Result<()> {
        instructions::distribution::init_sol_distribution(ctx)
    }

    pub fn execute_sol_batch(
        ctx: Context<ExecuteSolBatch>,
        params: ExecuteSolBatchParams,
    ) -> Result<()> {
        instructions::distribution::execute_sol_batch(ctx, params)
    }

    pub fn init_spl_distribution(
        ctx: Context<InitSplDistribution>,
        params: InitSplDistributionParams,
    ) -> Result<()> {
        instructions::distribution::init_spl_distribution(ctx, params)
    }

    pub fn execute_spl_batch(
        ctx: Context<ExecuteSplBatch>,
        params: ExecuteSplBatchParams,
    ) -> Result<()> {
        instructions::distribution::execute_spl_batch(ctx, params)
    }

    pub fn finalize_unlock(ctx: Context<FinalizeUnlock>) -> Result<()> {
        instructions::distribution::finalize_unlock(ctx)
    }

    // ── Module K: Subscription ────────────────────────────────────────────────
    pub fn set_subscription(
        ctx: Context<SetSubscription>,
        params: SetSubscriptionParams,
    ) -> Result<()> {
        instructions::subscription::set_subscription(ctx, params)
    }
}
EOF

# ─── constants.rs ─────────────────────────────────────────────────────────────
cat > "$PROG/programs/legacyvault/src/constants.rs" << 'EOF'
//! Protocol-wide constants — never change without a migration

pub const BPS_DENOMINATOR: u16 = 10_000;

pub const MIN_INACTIVITY_THRESHOLD: i64 = 30 * 86_400;   // 30 days
pub const MAX_INACTIVITY_THRESHOLD: i64 = 365 * 86_400;  // 365 days
pub const MIN_TIMELOCK_DURATION: i64 = 1 * 86_400;       // 1 day
pub const MAX_TIMELOCK_DURATION: i64 = 90 * 86_400;      // 90 days

pub const MAX_GUARDIANS_FREE: u8 = 3;
pub const MAX_GUARDIANS_PRO: u8 = 10;
pub const MAX_BENEFICIARIES_FREE: u8 = 5;
pub const MAX_BENEFICIARIES_PRO: u8 = 20;
pub const MAX_DOCS_FREE: u8 = 2;
pub const MAX_DOCS_PRO: u8 = 10;

pub const DEFAULT_SOL_BATCH_SIZE: u8 = 5;
pub const DEFAULT_SPL_BATCH_SIZE: u8 = 5;
pub const SPL_BATCH_WITH_ATA_SIZE: u8 = 3;

// PDA seeds
pub const SEED_GLOBAL_CONFIG: &[u8] = b"global_config";
pub const SEED_VAULT: &[u8] = b"vault";
pub const SEED_VAULT_AUTHORITY: &[u8] = b"vault_authority";
pub const SEED_GUARDIAN_ENTRY: &[u8] = b"guardian_entry";
pub const SEED_BENEFICIARY_ENTRY: &[u8] = b"beneficiary_entry";
pub const SEED_ASSET_RULE: &[u8] = b"asset_rule";
pub const SEED_LIVENESS_DELEGATE: &[u8] = b"liveness_delegate";
pub const SEED_UNLOCK_SESSION: &[u8] = b"unlock_session";
pub const SEED_GUARDIAN_APPROVAL: &[u8] = b"guardian_approval";
pub const SEED_SOL_DISTRIBUTION: &[u8] = b"sol_distribution_session";
pub const SEED_SPL_DISTRIBUTION: &[u8] = b"spl_distribution_session";
pub const SEED_DISPUTE_CASE: &[u8] = b"dispute_case";
pub const SEED_SUBSCRIPTION: &[u8] = b"subscription_state";
EOF

# ─── state/mod.rs ─────────────────────────────────────────────────────────────
cat > "$PROG/programs/legacyvault/src/state/mod.rs" << 'EOF'
pub mod accounts;
pub use accounts::*;
EOF

# ─── state/accounts.rs ───────────────────────────────────────────────────────
cat > "$PROG/programs/legacyvault/src/state/accounts.rs" << 'EOF'
use anchor_lang::prelude::*;

// ─── Enums ────────────────────────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum VaultStatus {
    Active,
    Unlocking,
    Executing,
    Distributed,
    Frozen,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum GuardianRole {
    Personal,
    Professional,
    Delegate,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum GuardianStatus {
    Pending,
    Active,
    Removed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum UnlockSessionStatus {
    Proposed,
    Approved,
    Executing,
    Executed,
    Cancelled,
    Disputed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum AssetOverrideType {
    ProRata,
    FixedBps,
    EntireToBeneficiary,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum SubscriptionTier {
    Free,
    Pro,
}

// ─── GlobalConfig ─────────────────────────────────────────────────────────────

#[account]
pub struct GlobalConfig {
    pub admin: Pubkey,
    pub paused: bool,
    pub creation_fee_lamports: u64,
    pub fee_receiver: Pubkey,
    pub free_guardian_limit: u8,
    pub free_doc_limit: u8,
    pub free_beneficiary_limit: u8,
    pub pro_guardian_limit: u8,
    pub pro_doc_limit: u8,
    pub pro_beneficiary_limit: u8,
    pub bump: u8,
    pub _reserved: [u8; 64],
}

impl GlobalConfig {
    pub const LEN: usize = 8
        + 32 + 1 + 8 + 32
        + 1 + 1 + 1 + 1 + 1 + 1
        + 1 + 64;
}

// ─── Vault ────────────────────────────────────────────────────────────────────

#[account]
pub struct Vault {
    pub owner: Pubkey,
    pub status: VaultStatus,
    pub inactivity_threshold: i64,
    pub timelock_duration: i64,
    pub guardian_threshold: u8,
    pub guardian_count: u8,
    pub beneficiary_count: u8,
    pub total_bps: u16,
    pub last_check_in: i64,
    pub created_at: i64,
    pub doc_hash: [u8; 32],
    pub doc_uri: String,         // max 200 chars
    pub arbiter: Option<Pubkey>,
    pub subscription_tier: SubscriptionTier,
    pub subscription_expires_at: Option<i64>,
    pub vault_authority_bump: u8,
    pub bump: u8,
    pub _reserved: [u8; 64],
}

impl Vault {
    pub const LEN: usize = 8
        + 32        // owner
        + 1 + 1     // status enum
        + 8 + 8     // inactivity, timelock
        + 1 + 1 + 1 // thresholds, counts
        + 2         // total_bps
        + 8 + 8     // last_check_in, created_at
        + 32        // doc_hash
        + 4 + 200   // doc_uri (string prefix + max chars)
        + 1 + 32    // Option<Pubkey> arbiter
        + 1 + 1     // subscription_tier enum
        + 1 + 8     // Option<i64> subscription_expires_at
        + 1 + 1     // bumps
        + 64;       // reserved
}

// ─── GuardianEntry ────────────────────────────────────────────────────────────

#[account]
pub struct GuardianEntry {
    pub vault: Pubkey,
    pub guardian_wallet: Pubkey,
    pub role: GuardianRole,
    pub status: GuardianStatus,
    pub added_at: i64,
    pub bump: u8,
    pub _reserved: [u8; 32],
}

impl GuardianEntry {
    pub const LEN: usize = 8 + 32 + 32 + 1 + 1 + 1 + 8 + 1 + 32;
}

// ─── BeneficiaryEntry ─────────────────────────────────────────────────────────

#[account]
pub struct BeneficiaryEntry {
    pub vault: Pubkey,
    pub beneficiary_wallet: Pubkey,
    pub share_bps: u16,
    pub active: bool,
    pub added_at: i64,
    pub bump: u8,
    pub _reserved: [u8; 32],
}

impl BeneficiaryEntry {
    pub const LEN: usize = 8 + 32 + 32 + 2 + 1 + 8 + 1 + 32;
}

// ─── AssetRule ────────────────────────────────────────────────────────────────

#[account]
pub struct AssetRule {
    pub vault: Pubkey,
    pub beneficiary: Pubkey,
    pub mint: Pubkey,
    pub override_type: AssetOverrideType,
    pub fixed_bps: Option<u16>,
    pub bump: u8,
}

impl AssetRule {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 1 + 1 + 2 + 1;
}

// ─── LivenessDelegate ─────────────────────────────────────────────────────────

#[account]
pub struct LivenessDelegate {
    pub vault: Pubkey,
    pub delegate_wallet: Pubkey,
    pub active: bool,
    pub added_at: i64,
    pub bump: u8,
}

impl LivenessDelegate {
    pub const LEN: usize = 8 + 32 + 32 + 1 + 8 + 1;
}

// ─── UnlockSession ────────────────────────────────────────────────────────────

#[account]
pub struct UnlockSession {
    pub vault: Pubkey,
    pub initiator: Pubkey,
    pub status: UnlockSessionStatus,
    pub approval_count: u8,
    pub initiated_at: i64,
    pub timelock_ends_at: Option<i64>,
    pub executed_at: Option<i64>,
    pub bump: u8,
    pub _reserved: [u8; 32],
}

impl UnlockSession {
    pub const LEN: usize = 8 + 32 + 32 + 1 + 1 + 8 + 9 + 9 + 1 + 32;
}

// ─── GuardianApproval ─────────────────────────────────────────────────────────

#[account]
pub struct GuardianApproval {
    pub session: Pubkey,
    pub guardian: Pubkey,
    pub approved_at: i64,
    pub bump: u8,
}

impl GuardianApproval {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 1;
}

// ─── SolDistributionSession ───────────────────────────────────────────────────

#[account]
pub struct SolDistributionSession {
    pub vault: Pubkey,
    pub total_lamports: u64,
    pub distributed_lamports: u64,
    pub cursor: u8,
    pub completed: bool,
    pub completed_at: Option<i64>,
    pub bump: u8,
}

impl SolDistributionSession {
    pub const LEN: usize = 8 + 32 + 8 + 8 + 1 + 1 + 9 + 1;
}

// ─── SplDistributionSession ───────────────────────────────────────────────────

#[account]
pub struct SplDistributionSession {
    pub vault: Pubkey,
    pub mint: Pubkey,
    pub total_amount: u64,
    pub distributed_amount: u64,
    pub cursor: u8,
    pub completed: bool,
    pub completed_at: Option<i64>,
    pub bump: u8,
}

impl SplDistributionSession {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 1 + 1 + 9 + 1;
}

// ─── DisputeCase ──────────────────────────────────────────────────────────────

#[account]
pub struct DisputeCase {
    pub vault: Pubkey,
    pub session: Pubkey,
    pub opener: Pubkey,
    pub arbiter: Pubkey,
    pub resolved: bool,
    pub opened_at: i64,
    pub resolved_at: Option<i64>,
    pub bump: u8,
}

impl DisputeCase {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 32 + 1 + 8 + 9 + 1;
}

// ─── SubscriptionState ───────────────────────────────────────────────────────

#[account]
pub struct SubscriptionState {
    pub vault: Pubkey,
    pub tier: SubscriptionTier,
    pub expires_at: Option<i64>,
    pub bump: u8,
}

impl SubscriptionState {
    pub const LEN: usize = 8 + 32 + 1 + 9 + 1;
}
EOF

# ─── errors.rs ────────────────────────────────────────────────────────────────
cat > "$PROG/programs/legacyvault/src/errors.rs" << 'EOF'
use anchor_lang::prelude::*;

#[error_code]
pub enum LegacyVaultError {
    #[msg("Program is paused")]
    Paused,
    #[msg("Vault is not active")]
    VaultNotActive,
    #[msg("Inactivity threshold out of bounds")]
    InactivityThresholdOutOfBounds,
    #[msg("Timelock duration out of bounds")]
    TimelockDurationOutOfBounds,
    #[msg("Invalid guardian threshold")]
    InvalidGuardianThreshold,
    #[msg("Total BPS exceeds 10000")]
    TotalBpsExceeds10000,
    #[msg("Total BPS would drop below zero")]
    TotalBpsUnderflow,
    #[msg("Guardian limit exceeded for current tier")]
    GuardianLimitExceeded,
    #[msg("Beneficiary limit exceeded for current tier")]
    BeneficiaryLimitExceeded,
    #[msg("Unlock not eligible — inactivity threshold not met")]
    UnlockNotEligible,
    #[msg("Unlock session already exists")]
    UnlockSessionAlreadyExists,
    #[msg("Double approval not allowed")]
    DoubleApproval,
    #[msg("Batch cursor mismatch")]
    BatchCursorMismatch,
    #[msg("Beneficiary ordering violated")]
    BeneficiaryOrderingViolated,
    #[msg("Distribution not complete")]
    DistributionNotComplete,
    #[msg("Open dispute blocks finalization")]
    OpenDisputeBlocksFinalization,
    #[msg("Subscription tier downgrade blocked by usage")]
    DowngradeBlockedByUsage,
    #[msg("Document limit exceeded")]
    DocumentLimitExceeded,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid token program")]
    InvalidTokenProgram,
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
}
EOF

# ─── events.rs ────────────────────────────────────────────────────────────────
cat > "$PROG/programs/legacyvault/src/events.rs" << 'EOF'
use anchor_lang::prelude::*;

#[event]
pub struct VaultCreated {
    pub vault: Pubkey,
    pub owner: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct VaultFrozen {
    pub vault: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct VaultUnfrozen {
    pub vault: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct GuardianAdded {
    pub vault: Pubkey,
    pub guardian: Pubkey,
    pub role: String,
    pub timestamp: i64,
}

#[event]
pub struct GuardianRemoved {
    pub vault: Pubkey,
    pub guardian: Pubkey,
    pub timestamp: i64,
}

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
    pub new_share_bps: u16,
    pub timestamp: i64,
}

#[event]
pub struct BeneficiaryRemoved {
    pub vault: Pubkey,
    pub beneficiary: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct CheckInPerformed {
    pub vault: Pubkey,
    pub signer: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct UnlockInitiated {
    pub vault: Pubkey,
    pub initiator: Pubkey,
    pub session: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct UnlockApproved {
    pub vault: Pubkey,
    pub guardian: Pubkey,
    pub approval_count: u8,
    pub threshold_met: bool,
    pub timelock_ends_at: Option<i64>,
    pub timestamp: i64,
}

#[event]
pub struct UnlockCancelled {
    pub vault: Pubkey,
    pub cancelled_by: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct SolBatchExecuted {
    pub vault: Pubkey,
    pub batch_start: u8,
    pub batch_end: u8,
    pub lamports_distributed: u64,
    pub timestamp: i64,
}

#[event]
pub struct SplBatchExecuted {
    pub vault: Pubkey,
    pub mint: Pubkey,
    pub batch_start: u8,
    pub batch_end: u8,
    pub amount_distributed: u64,
    pub timestamp: i64,
}

#[event]
pub struct DistributionFinalized {
    pub vault: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct DocumentCommitmentSet {
    pub vault: Pubkey,
    pub hash: [u8; 32],
    pub uri: String,
    pub timestamp: i64,
}

#[event]
pub struct DisputeOpened {
    pub vault: Pubkey,
    pub dispute: Pubkey,
    pub opener: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct DisputeResolved {
    pub vault: Pubkey,
    pub dispute: Pubkey,
    pub arbiter: Pubkey,
    pub timestamp: i64,
}
EOF

# ─── instructions/mod.rs ─────────────────────────────────────────────────────
cat > "$PROG/programs/legacyvault/src/instructions/mod.rs" << 'EOF'
pub mod admin;
pub mod beneficiaries;
pub mod custody;
pub mod disputes;
pub mod distribution;
pub mod documents;
pub mod guardians;
pub mod liveness;
pub mod subscription;
pub mod unlock;
pub mod vault;

// Re-export all Context structs and param types
pub use admin::*;
pub use beneficiaries::*;
pub use custody::*;
pub use disputes::*;
pub use distribution::*;
pub use documents::*;
pub use guardians::*;
pub use liveness::*;
pub use subscription::*;
pub use unlock::*;
pub use vault::*;
EOF

# ─── Create instruction stub files ───────────────────────────────────────────
for module in admin vault guardians beneficiaries custody liveness documents unlock disputes distribution subscription; do
cat > "$PROG/programs/legacyvault/src/instructions/${module}.rs" << STUBEOF
//! ${module} instruction module
//! TODO: Implement instruction bodies from Build 2/3 specifications

use anchor_lang::prelude::*;
use crate::{constants::*, errors::LegacyVaultError, events::*, state::*};

// TODO: Add Context structs and instruction handler bodies
// Reference: completedoc.md + build2.md / build3.md
STUBEOF
done

# ─── utils/mod.rs ─────────────────────────────────────────────────────────────
cat > "$PROG/programs/legacyvault/src/utils/mod.rs" << 'EOF'
use anchor_lang::prelude::*;

/// Validates that a token program is either spl-token or token-2022
pub fn validate_token_program(token_program_id: &Pubkey) -> Result<()> {
    require!(
        token_program_id == &anchor_spl::token::ID
            || token_program_id == &anchor_spl::token_2022::ID,
        crate::errors::LegacyVaultError::InvalidTokenProgram
    );
    Ok(())
}

/// Safe bps multiplication
pub fn bps_of(amount: u64, bps: u16) -> Option<u64> {
    (amount as u128)
        .checked_mul(bps as u128)?
        .checked_div(10_000)?
        .try_into()
        .ok()
}
EOF

# ─── package.json (for ts-mocha tests) ───────────────────────────────────────
cat > "$PROG/package.json" << 'EOF'
{
  "name": "legacyvault-program",
  "version": "0.1.0",
  "scripts": {
    "test": "anchor test",
    "test:verbose": "anchor test -- --reporter spec",
    "build": "anchor build"
  },
  "dependencies": {},
  "devDependencies": {
    "@coral-xyz/anchor": "^0.29.0",
    "@solana/web3.js": "^1.87.6",
    "@solana/spl-token": "^0.3.11",
    "@types/chai": "^4.3.9",
    "@types/mocha": "^10.0.4",
    "chai": "^4.3.10",
    "ts-mocha": "^10.0.0",
    "typescript": "^5.3.2"
  }
}
EOF

# ─── tsconfig.json ────────────────────────────────────────────────────────────
cat > "$PROG/tsconfig.json" << 'EOF'
{
  "compilerOptions": {
    "types": ["mocha", "chai"],
    "typeRoots": ["./node_modules/@types"],
    "lib": ["es2015"],
    "module": "commonjs",
    "target": "es6",
    "esModuleInterop": true,
    "strict": true,
    "noImplicitAny": true
  }
}
EOF

echo "Anchor workspace scaffolded (programs/legacyvault/src/ + Cargo.toml + Anchor.toml)"

Sub-Script 04 — API Server (Build 4)
scripts/04-build4-api.sh

Bash

#!/usr/bin/env bash
# 04-build4-api.sh — Scaffold API server (Build 4)
set -euo pipefail

ROOT_DIR="$1"
API="$ROOT_DIR/api"

# ─── package.json ─────────────────────────────────────────────────────────────
cat > "$API/package.json" << 'EOF'
{
  "name": "legacyvault-api",
  "version": "1.0.0",
  "description": "LegacyVault API gateway — tx builder, auth, reads",
  "main": "dist/index.js",
  "scripts": {
    "dev": "ts-node-dev --respawn src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "prisma:gen": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:deploy": "prisma migrate deploy"
  },
  "dependencies": {
    "@aws-sdk/client-s3": "^3.462.0",
    "@aws-sdk/s3-request-presigner": "^3.462.0",
    "@coral-xyz/anchor": "^0.29.0",
    "@dha-team/arbundles": "^0.11.0",
    "@prisma/client": "^5.7.0",
    "@sentry/node": "^7.88.0",
    "@shadow-drive/sdk": "^1.0.4",
    "@solana/web3.js": "^1.87.6",
    "@types/node": "^20.10.4",
    "arweave": "^1.14.4",
    "bullmq": "^5.1.1",
    "firebase-admin": "^12.0.0",
    "fastify": "^4.25.2",
    "fastify-plugin": "^4.5.1",
    "@fastify/cors": "^8.4.1",
    "@fastify/jwt": "^8.0.0",
    "@fastify/multipart": "^8.1.0",
    "@fastify/rate-limit": "^9.1.0",
    "ioredis": "^5.3.2",
    "prom-client": "^15.1.0",
    "resend": "^2.1.0",
    "tweetnacl": "^1.0.3",
    "twilio": "^4.20.1",
    "uuid": "^9.0.1",
    "bs58": "^5.0.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/jest": "^29.5.11",
    "@types/bs58": "^4.0.4",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.3.2",
    "prisma": "^5.7.0"
  }
}
EOF

# ─── tsconfig.json ─────────────────────────────────────────────────────────────
cat > "$API/tsconfig.json" << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*", "workers/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
EOF

# ─── Prisma schema ─────────────────────────────────────────────────────────────
cat > "$API/prisma/schema.prisma" << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Vault {
  id                  String   @id @default(cuid())
  address             String   @unique
  owner               String
  status              String   @default("locked")
  inactivityThreshold Int
  timelockDuration    Int
  guardianThreshold   Int
  guardianCount       Int      @default(0)
  beneficiaryCount    Int      @default(0)
  totalBps            Int      @default(0)
  lastCheckIn         DateTime @default(now())
  docHash             String?
  docUri              String?
  arbiter             String?
  subscriptionTier    String   @default("free")
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  guardians        Guardian[]
  beneficiaries    Beneficiary[]
  assets           VaultAsset[]
  activityLogs     ActivityLog[]
  notifications    NotificationPreference?

  @@index([owner])
  @@index([status])
}

model Guardian {
  id            String   @id @default(cuid())
  vaultAddress  String
  wallet        String
  role          String
  status        String   @default("pending")
  addedAt       DateTime @default(now())
  updatedAt     DateTime @updatedAt

  vault         Vault    @relation(fields: [vaultAddress], references: [address])

  @@unique([vaultAddress, wallet])
  @@index([vaultAddress])
}

model Beneficiary {
  id            String   @id @default(cuid())
  vaultAddress  String
  wallet        String
  shareBps      Int
  active        Boolean  @default(true)
  addedAt       DateTime @default(now())
  updatedAt     DateTime @updatedAt

  vault         Vault    @relation(fields: [vaultAddress], references: [address])

  @@unique([vaultAddress, wallet])
  @@index([vaultAddress])
}

model VaultAsset {
  id           String   @id @default(cuid())
  vaultAddress String
  mint         String?
  assetType    String
  balance      String
  usdValue     Float?
  lastUpdated  DateTime @default(now())

  vault        Vault    @relation(fields: [vaultAddress], references: [address])

  @@index([vaultAddress])
}

model ActivityLog {
  id           String   @id @default(cuid())
  vaultAddress String
  action       String
  actor        String
  txSignature  String?
  metadata     Json?
  timestamp    DateTime @default(now())

  vault        Vault    @relation(fields: [vaultAddress], references: [address])

  @@index([vaultAddress, timestamp])
}

model NotificationPreference {
  id                  String   @id @default(cuid())
  vault               String   @unique
  email               String?
  phone               String?
  pushToken           String?
  checkInReminders    Boolean  @default(true)
  unlockAlerts        Boolean  @default(true)
  timelockAlerts      Boolean  @default(true)
  distributionAlerts  Boolean  @default(true)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  vaultRef            Vault    @relation(fields: [vault], references: [address])

  @@index([vault])
}

model NotificationLog {
  id        String    @id @default(cuid())
  vault     String
  type      String
  channel   String
  recipient String
  status    String
  error     String?
  metadata  Json?
  sentAt    DateTime?
  createdAt DateTime  @default(now())

  @@index([vault, type])
  @@index([status, createdAt])
}
EOF

# ─── src/index.ts ─────────────────────────────────────────────────────────────
cat > "$API/src/index.ts" << 'EOF'
import { buildServer } from './server';

const PORT = parseInt(process.env.API_PORT ?? '3000');
const HOST = process.env.API_HOST ?? '0.0.0.0';

async function main() {
  const server = await buildServer();

  try {
    await server.listen({ port: PORT, host: HOST });
    console.log(`🚀 LegacyVault API running on http://${HOST}:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
EOF

# ─── src/server.ts ─────────────────────────────────────────────────────────────
cat > "$API/src/server.ts" << 'EOF'
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';

// Routes
import authRoute from './routes/auth.route';
import vaultRoute from './routes/vault.route';
import txRoute from './routes/tx.route';
import documentsRoute from './routes/documents.route';
import notificationsRoute from './routes/notifications.route';
import healthRoute from './routes/health.route';
import metricsRoute from './routes/metrics.route';

// Middleware
import { metricsMiddleware } from './middleware/metrics.middleware';
import { sentryMiddleware } from './middleware/sentry.middleware';

export async function buildServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  });

  // ── Plugins ────────────────────────────────────────────────────────────────
  await server.register(cors, {
    origin: process.env.APP_URL ?? '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  await server.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
    sign: { expiresIn: '15m' },
  });

  await server.register(multipart);

  await server.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
  });

  // ── Custom middleware ──────────────────────────────────────────────────────
  await server.register(metricsMiddleware);
  await server.register(sentryMiddleware);

  // ── Routes ─────────────────────────────────────────────────────────────────
  await server.register(healthRoute);
  await server.register(metricsRoute);
  await server.register(authRoute,          { prefix: '/v1/auth' });
  await server.register(vaultRoute,         { prefix: '/v1' });
  await server.register(txRoute,            { prefix: '/v1/tx' });
  await server.register(documentsRoute,     { prefix: '/v1' });
  await server.register(notificationsRoute, { prefix: '/v1' });

  return server;
}
EOF

# ─── src/routes/auth.route.ts ─────────────────────────────────────────────────
cat > "$API/src/routes/auth.route.ts" << 'EOF'
import { FastifyPluginAsync } from 'fastify';
import Redis from 'ioredis';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { randomBytes } from 'crypto';

const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');

const NONCE_TTL = 300; // 5 minutes
const REFRESH_TTL = 60 * 60 * 24 * 7; // 7 days

const authRoute: FastifyPluginAsync = async (server) => {
  // GET /nonce
  server.get<{ Querystring: { address: string } }>(
    '/nonce',
    async (req, reply) => {
      const { address } = req.query;

      try {
        new PublicKey(address);
      } catch {
        return reply.code(400).send({ error: 'Invalid address' });
      }

      const nonce = randomBytes(16).toString('hex');
      await redis.setex(`nonce:${address}`, NONCE_TTL, nonce);

      return { nonce };
    },
  );

  // POST /verify
  server.post<{
    Body: { address: string; signature: string; message: string };
  }>('/verify', async (req, reply) => {
    const { address, signature, message } = req.body;

    // Verify nonce is in message
    const storedNonce = await redis.get(`nonce:${address}`);
    if (!storedNonce || !message.includes(storedNonce)) {
      return reply.code(401).send({ error: 'Invalid or expired nonce' });
    }

    // Verify signature
    try {
      const pubkey = new PublicKey(address);
      const msgBytes = new TextEncoder().encode(message);
      const sigBytes = bs58.decode(signature);
      const valid = nacl.sign.detached.verify(msgBytes, sigBytes, pubkey.toBytes());

      if (!valid) {
        return reply.code(401).send({ error: 'Invalid signature' });
      }
    } catch {
      return reply.code(401).send({ error: 'Signature verification failed' });
    }

    // Delete used nonce
    await redis.del(`nonce:${address}`);

    // Issue tokens
    const accessToken = server.jwt.sign({ address }, { expiresIn: '15m' });
    const refreshToken = randomBytes(32).toString('hex');
    await redis.setex(`refresh:${refreshToken}`, REFRESH_TTL, address);

    return { accessToken, refreshToken };
  });

  // POST /refresh
  server.post<{ Body: { refreshToken: string } }>(
    '/refresh',
    async (req, reply) => {
      const { refreshToken } = req.body;

      const address = await redis.get(`refresh:${refreshToken}`);
      if (!address) {
        return reply.code(401).send({ error: 'Invalid refresh token' });
      }

      // Rotate refresh token
      await redis.del(`refresh:${refreshToken}`);
      const newRefreshToken = randomBytes(32).toString('hex');
      await redis.setex(`refresh:${newRefreshToken}`, REFRESH_TTL, address);

      const accessToken = server.jwt.sign({ address }, { expiresIn: '15m' });

      return { accessToken, refreshToken: newRefreshToken };
    },
  );
};

export default authRoute;
EOF

# ─── src/routes/tx.route.ts ───────────────────────────────────────────────────
cat > "$API/src/routes/tx.route.ts" << 'EOF'
import { FastifyPluginAsync } from 'fastify';
import {
  Connection,
  PublicKey,
  TransactionInstruction,
  VersionedTransaction,
  TransactionMessage,
  ComputeBudgetProgram,
} from '@solana/web3.js';

// TODO: Import your Anchor IDL and program after `anchor build`
// import { Program, AnchorProvider } from '@coral-xyz/anchor';
// import { IDL } from '../../program/target/idl/legacyvault.json';

const connection = new Connection(
  process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com',
);

// Auth guard
async function requireAuth(req: any, reply: any) {
  try {
    await req.jwtVerify();
  } catch {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
}

const txRoute: FastifyPluginAsync = async (server) => {
  server.addHook('onRequest', requireAuth);

  // Helper: build versioned tx and return as base64
  async function buildTx(
    payer: PublicKey,
    instructions: TransactionInstruction[],
  ): Promise<string> {
    const { blockhash } = await connection.getLatestBlockhash('confirmed');

    const computeIx = ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 });

    const message = new TransactionMessage({
      payerKey: payer,
      recentBlockhash: blockhash,
      instructions: [computeIx, ...instructions],
    }).compileToV0Message();

    const tx = new VersionedTransaction(message);
    return Buffer.from(tx.serialize()).toString('base64');
  }

  // ── Create Vault ────────────────────────────────────────────────────────────
  server.post<{
    Body: {
      inactivityThreshold: number;
      timelockDuration: number;
      guardianThreshold: number;
    };
  }>('/create-vault', async (req, reply) => {
    const address = (req.user as any).address;
    const payer = new PublicKey(address);

    // TODO: Build actual create_vault instruction using Anchor program
    // const ix = await program.methods.createVault({ ... }).accounts({ ... }).instruction();
    // const transaction = await buildTx(payer, [ix]);
    // return { transaction };

    return reply.code(501).send({
      error: 'TODO: Wire to Anchor program after anchor build',
    });
  });

  // ── Check-in ────────────────────────────────────────────────────────────────
  server.post('/check-in', async (req, reply) => {
    const address = (req.user as any).address;
    // TODO: Build check_in instruction
    return reply.code(501).send({ error: 'TODO' });
  });

  // ── Add Guardian ─────────────────────────────────────────────────────────────
  server.post<{
    Body: { guardianWallet: string; role: string };
  }>('/add-guardian', async (req, reply) => {
    // TODO: Build add_guardian instruction
    return reply.code(501).send({ error: 'TODO' });
  });

  // ── Add Beneficiary ──────────────────────────────────────────────────────────
  server.post<{
    Body: { beneficiaryWallet: string; shareBps: number };
  }>('/add-beneficiary', async (req, reply) => {
    // TODO: Build add_beneficiary instruction
    return reply.code(501).send({ error: 'TODO' });
  });

  // ── Initiate Unlock ──────────────────────────────────────────────────────────
  server.post('/initiate-unlock', async (req, reply) => {
    // TODO: Build initiate_unlock instruction
    return reply.code(501).send({ error: 'TODO' });
  });

  // ── Approve Unlock ───────────────────────────────────────────────────────────
  server.post('/approve-unlock', async (req, reply) => {
    // TODO: Build approve_unlock instruction
    return reply.code(501).send({ error: 'TODO' });
  });

  // ── Cancel Unlock ────────────────────────────────────────────────────────────
  server.post('/cancel-unlock', async (req, reply) => {
    // TODO: Build cancel_unlock instruction
    return reply.code(501).send({ error: 'TODO' });
  });

  // ── Init SOL Distribution ────────────────────────────────────────────────────
  server.post('/init-sol-distribution', async (req, reply) => {
    // TODO: Build init_sol_distribution instruction
    return reply.code(501).send({ error: 'TODO' });
  });

  // ── Execute SOL Batch ────────────────────────────────────────────────────────
  server.post<{ Body: { batchSize: number } }>(
    '/execute-sol-batch',
    async (req, reply) => {
      // TODO: Build execute_sol_batch with sorted remaining accounts
      return reply.code(501).send({ error: 'TODO' });
    },
  );

  // ── Finalize Unlock ──────────────────────────────────────────────────────────
  server.post('/finalize-unlock', async (req, reply) => {
    // TODO: Build finalize_unlock instruction
    return reply.code(501).send({ error: 'TODO' });
  });
};

export default txRoute;
EOF

# ─── src/routes/vault.route.ts ────────────────────────────────────────────────
cat > "$API/src/routes/vault.route.ts" << 'EOF'
import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function requireAuth(req: any, reply: any) {
  try {
    await req.jwtVerify();
  } catch {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
}

const vaultRoute: FastifyPluginAsync = async (server) => {
  server.addHook('onRequest', requireAuth);

  // GET /vaults/:vault/summary
  server.get<{ Params: { vault: string } }>(
    '/vaults/:vault/summary',
    async (req, reply) => {
      const vault = await prisma.vault.findUnique({
        where: { address: req.params.vault },
        include: { guardians: true, beneficiaries: true, assets: true },
      });

      if (!vault) return reply.code(404).send({ error: 'Vault not found' });

      return {
        vaultAddress: vault.address,
        owner: vault.owner,
        status: vault.status,
        inactivityThreshold: vault.inactivityThreshold,
        timelockDuration: vault.timelockDuration,
        guardianThreshold: vault.guardianThreshold,
        guardianCount: vault.guardianCount,
        beneficiaryCount: vault.beneficiaryCount,
        totalBps: vault.totalBps,
        lastCheckIn: vault.lastCheckIn,
        subscriptionTier: vault.subscriptionTier,
        assets: vault.assets,
      };
    },
  );

  // GET /vaults/:vault/guardians
  server.get<{ Params: { vault: string } }>(
    '/vaults/:vault/guardians',
    async (req, reply) => {
      const guardians = await prisma.guardian.findMany({
        where: { vaultAddress: req.params.vault },
        orderBy: { addedAt: 'asc' },
      });
      return { guardians };
    },
  );

  // GET /vaults/:vault/beneficiaries
  server.get<{ Params: { vault: string } }>(
    '/vaults/:vault/beneficiaries',
    async (req, reply) => {
      const beneficiaries = await prisma.beneficiary.findMany({
        where: { vaultAddress: req.params.vault, active: true },
        orderBy: { addedAt: 'asc' },
      });
      return { beneficiaries };
    },
  );

  // GET /vaults/:vault/activity
  server.get<{ Params: { vault: string } }>(
    '/vaults/:vault/activity',
    async (req, reply) => {
      const activity = await prisma.activityLog.findMany({
        where: { vaultAddress: req.params.vault },
        orderBy: { timestamp: 'desc' },
        take: 50,
      });
      return { activity };
    },
  );
};

export default vaultRoute;
EOF

# ─── src/routes/health.route.ts ──────────────────────────────────────────────
cat > "$API/src/routes/health.route.ts" << 'EOF'
import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');

const healthRoute: FastifyPluginAsync = async (server) => {
  server.get('/health', async (req, reply) => {
    const checks: Record<string, boolean> = {
      api: true,
      database: false,
      redis: false,
    };

    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch {}

    try {
      await redis.ping();
      checks.redis = true;
    } catch {}

    const healthy = Object.values(checks).every((v) => v);
    return reply.code(healthy ? 200 : 503).send({
      status: healthy ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '1.0.0',
    });
  });
};

export default healthRoute;
EOF

# ─── src/middleware/metrics.middleware.ts ─────────────────────────────────────
cat > "$API/src/middleware/metrics.middleware.ts" << 'EOF'
import { FastifyPluginAsync } from 'fastify';
import client from 'prom-client';

export const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1.0, 2.0, 5.0],
});

export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

export const metricsMiddleware: FastifyPluginAsync = async (server) => {
  server.addHook('onRequest', async (req) => {
    (req as any).startTime = Date.now();
  });

  server.addHook('onResponse', async (req, reply) => {
    const duration = (Date.now() - (req as any).startTime) / 1000;
    const route = req.routeOptions?.url ?? 'unknown';
    const labels = { method: req.method, route, status: reply.statusCode };
    httpRequestDuration.observe(labels, duration);
    httpRequestTotal.inc(labels);
  });
};
EOF

# ─── src/middleware/sentry.middleware.ts ──────────────────────────────────────
cat > "$API/src/middleware/sentry.middleware.ts" << 'EOF'
import { FastifyPluginAsync } from 'fastify';
import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT ?? 'production',
    tracesSampleRate: 0.1,
  });
}

export const sentryMiddleware: FastifyPluginAsync = async (server) => {
  server.addHook('onError', async (req, reply, error) => {
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error);
    }
  });
};
EOF

# ─── src/routes/metrics.route.ts ─────────────────────────────────────────────
cat > "$API/src/routes/metrics.route.ts" << 'EOF'
import { FastifyPluginAsync } from 'fastify';
import { register } from '../middleware/metrics.middleware';

const metricsRoute: FastifyPluginAsync = async (server) => {
  server.get('/metrics', async (req, reply) => {
    reply.type(register.contentType);
    return await register.metrics();
  });
};

export default metricsRoute;
EOF

# ─── API .env.example ─────────────────────────────────────────────────────────
cat > "$API/.env.example" << 'EOF'
# LegacyVault API — Environment Variables
# Copy to .env and fill in values

DATABASE_URL=postgresql://user:password@localhost:5432/legacyvault
REDIS_URL=redis://localhost:6379

API_PORT=3000
API_HOST=0.0.0.0

# JWT — MUST be at least 32 random characters
JWT_SECRET=TODO_REPLACE_WITH_RANDOM_32_CHAR_STRING

SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_CLUSTER=devnet

# TODO: Replace after anchor build + deploy
PROGRAM_ID=TODO_PROGRAM_ID

APP_URL=http://localhost:5173

# Notifications
RESEND_API_KEY=TODO_RESEND_KEY
EMAIL_FROM=LegacyVault <noreply@legacyvault.io>
TWILIO_ACCOUNT_SID=TODO
TWILIO_AUTH_TOKEN=TODO
TWILIO_PHONE_NUMBER=TODO
FIREBASE_PROJECT_ID=TODO
FIREBASE_CLIENT_EMAIL=TODO
FIREBASE_PRIVATE_KEY=TODO

# Document Storage
STORAGE_BACKEND=s3
ARWEAVE_WALLET_JWK={}
S3_ENDPOINT=TODO
S3_REGION=us-east-1
S3_BUCKET_NAME=legacyvault-documents
S3_ACCESS_KEY_ID=TODO
S3_SECRET_ACCESS_KEY=TODO

# Monitoring
SENTRY_DSN=TODO_OPTIONAL
SENTRY_ENVIRONMENT=development
EOF

# ─── API Dockerfile ───────────────────────────────────────────────────────────
cat > "$API/Dockerfile" << 'EOF'
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./
ENV NODE_ENV=production
EXPOSE 3000
USER node
CMD ["dumb-init", "node", "dist/index.js"]
EOF

echo "API server scaffolded (src/ + prisma/schema.prisma + Dockerfile)"

Sub-Script 05 — Indexer (Build 5)
scripts/05-build5-indexer.sh

Bash

#!/usr/bin/env bash
# 05-build5-indexer.sh — Scaffold indexer (Build 5)
set -euo pipefail

ROOT_DIR="$1"
IDX="$ROOT_DIR/indexer"

# ─── package.json ─────────────────────────────────────────────────────────────
cat > "$IDX/package.json" << 'EOF'
{
  "name": "legacyvault-indexer",
  "version": "1.0.0",
  "description": "LegacyVault on-chain event indexer",
  "main": "dist/index.js",
  "scripts": {
    "dev": "ts-node-dev --respawn src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@coral-xyz/anchor": "^0.29.0",
    "@prisma/client": "^5.7.0",
    "@solana/web3.js": "^1.87.6",
    "@sentry/node": "^7.88.0",
    "bullmq": "^5.1.1",
    "ioredis": "^5.3.2",
    "prom-client": "^15.1.0",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.4",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.3.2",
    "prisma": "^5.7.0"
  }
}
EOF

# ─── tsconfig.json ─────────────────────────────────────────────────────────────
cat > "$IDX/tsconfig.json" << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# ─── src/index.ts ─────────────────────────────────────────────────────────────
cat > "$IDX/src/index.ts" << 'EOF'
import { Connection } from '@solana/web3.js';
import { startMetricsServer } from './monitoring/metrics';
import { startHealthServer, updateHealth } from './monitoring/health';
import { EventParser } from './event-parser';
import { slotLagGauge } from './monitoring/metrics';

const RPC_URL = process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';
const PROGRAM_ID = process.env.PROGRAM_ID ?? 'TODO_PROGRAM_ID';

const MAX_REORG_DEPTH = 32;
const FINALIZED_CONFIRMATION_DEPTH = 32;

async function main() {
  console.log('🔍 LegacyVault Indexer starting...');

  const connection = new Connection(RPC_URL, {
    commitment: 'confirmed',
    wsEndpoint: process.env.SOLANA_WS_URL,
  });

  // Start monitoring servers
  startMetricsServer(9091);
  startHealthServer(9092);

  const parser = new EventParser(connection, PROGRAM_ID);

  console.log(`👂 Subscribing to program: ${PROGRAM_ID}`);

  // Subscribe to program logs
  connection.onLogs(
    PROGRAM_ID,
    async (logs, ctx) => {
      try {
        await parser.processLogs(logs, ctx);

        // Update slot metrics
        const currentSlot = await connection.getSlot();
        slotLagGauge.set(currentSlot - ctx.slot);
        updateHealth(ctx.slot, true);
      } catch (err) {
        console.error('Error processing logs:', err);
        updateHealth(ctx.slot, false);
      }
    },
    'confirmed',
  );

  console.log('✅ Indexer running');

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down indexer...');
    process.exit(0);
  });
}

main().catch(console.error);
EOF

# ─── src/event-parser.ts ──────────────────────────────────────────────────────
cat > "$IDX/src/event-parser.ts" << 'EOF'
import { Connection } from '@solana/web3.js';
import { PrismaClient } from '@prisma/client';
import { eventsProcessedCounter } from './monitoring/metrics';

const prisma = new PrismaClient();

export class EventParser {
  constructor(
    private connection: Connection,
    private programId: string,
  ) {}

  async processLogs(
    logs: { logs: string[]; err: any; signature: string },
    ctx: { slot: number },
  ) {
    if (logs.err) return; // Skip failed transactions

    for (const log of logs.logs) {
      // Anchor events are prefixed with "Program data: "
      if (!log.startsWith('Program data: ')) continue;

      try {
        await this.dispatchEvent(log, logs.signature, ctx.slot);
      } catch (err) {
        console.error(`Failed to process event in tx ${logs.signature}:`, err);
      }
    }
  }

  private async dispatchEvent(log: string, signature: string, slot: number) {
    // TODO: Decode event using Anchor IDL coder after program is built
    // const data = log.replace('Program data: ', '');
    // const decoded = this.coder.events.decode(data);

    // Placeholder event routing — expand after anchor build
    const eventName = this.parseEventName(log);
    if (!eventName) return;

    eventsProcessedCounter.inc({ event_type: eventName });

    // Route to handler
    const handler = this.handlers[eventName];
    if (handler) {
      await handler(log, signature, slot);
    }
  }

  private parseEventName(log: string): string | null {
    // TODO: Replace with actual IDL-based decoding
    return null;
  }

  private handlers: Record<
    string,
    (log: string, sig: string, slot: number) => Promise<void>
  > = {
    VaultCreated: async (log, sig, slot) => {
      // TODO: Decode event + upsert vault row
    },
    CheckInPerformed: async (log, sig, slot) => {
      // TODO: Update vault.lastCheckIn
    },
    UnlockInitiated: async (log, sig, slot) => {
      // TODO: Update vault status + trigger notification
    },
    UnlockApproved: async (log, sig, slot) => {
      // TODO: Update approval count + timelock
    },
    GuardianAdded: async (log, sig, slot) => {
      // TODO: Upsert guardian row
    },
    BeneficiaryAdded: async (log, sig, slot) => {
      // TODO: Upsert beneficiary row
    },
    SolBatchExecuted: async (log, sig, slot) => {
      // TODO: Update distribution session cursor
    },
    DistributionFinalized: async (log, sig, slot) => {
      // TODO: Set vault status = distributed
    },
  };
}
EOF

# ─── src/monitoring/metrics.ts ───────────────────────────────────────────────
cat > "$IDX/src/monitoring/metrics.ts" << 'EOF'
import client from 'prom-client';
import express from 'express';

export const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const slotLagGauge = new client.Gauge({
  name: 'indexer_slot_lag',
  help: 'Number of slots the indexer is behind the chain tip',
  registers: [register],
});

export const eventsProcessedCounter = new client.Counter({
  name: 'indexer_events_processed_total',
  help: 'Total number of events processed by the indexer',
  labelNames: ['event_type'],
  registers: [register],
});

export const uptimeGauge = new client.Gauge({
  name: 'indexer_uptime_seconds',
  help: 'Indexer uptime in seconds',
  registers: [register],
});

const startTime = Date.now();
setInterval(() => {
  uptimeGauge.set((Date.now() - startTime) / 1000);
}, 10_000);

export function startMetricsServer(port = 9091) {
  const app = express();
  app.get('/metrics', async (_, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });
  app.listen(port, () => {
    console.log(`📊 Metrics server: http://0.0.0.0:${port}/metrics`);
  });
}
EOF

# ─── src/monitoring/health.ts ─────────────────────────────────────────────────
cat > "$IDX/src/monitoring/health.ts" << 'EOF'
import express from 'express';

let lastProcessedSlot = 0;
let isHealthy = true;

export function updateHealth(slot: number, healthy: boolean) {
  lastProcessedSlot = slot;
  isHealthy = healthy;
}

export function startHealthServer(port = 9092) {
  const app = express();
  app.get('/health', (_, res) => {
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      lastProcessedSlot,
      timestamp: new Date().toISOString(),
    });
  });
  app.listen(port, () => {
    console.log(`🏥 Health server: http://0.0.0.0:${port}/health`);
  });
}
EOF

# ─── Indexer .env.example ─────────────────────────────────────────────────────
cat > "$IDX/.env.example" << 'EOF'
DATABASE_URL=postgresql://user:password@localhost:5432/legacyvault
REDIS_URL=redis://localhost:6379
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_WS_URL=wss://api.devnet.solana.com
# TODO: Set after anchor build + deploy
PROGRAM_ID=TODO_PROGRAM_ID
SENTRY_DSN=TODO_OPTIONAL
EOF

# ─── Indexer Dockerfile ───────────────────────────────────────────────────────
cat > "$IDX/Dockerfile" << 'EOF'
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
ENV NODE_ENV=production
USER node
CMD ["dumb-init", "node", "dist/index.js"]
EOF

echo "Indexer scaffolded (src/ + Dockerfile)"

Sub-Script 06 — Frontend Hooks (Build 6)
scripts/06-build6-hooks.sh

Bash

#!/usr/bin/env bash
# 06-build6-hooks.sh — Scaffold React Query hooks (Build 6)
set -euo pipefail

ROOT_DIR="$1"
DASH="$ROOT_DIR/dashboard"

# ─── package.json ─────────────────────────────────────────────────────────────
cat > "$DASH/package.json" << 'EOF'
{
  "name": "legacyvault-dashboard",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  },
  "dependencies": {
    "@coral-xyz/anchor": "^0.29.0",
    "@solana/wallet-adapter-backpack": "^0.1.13",
    "@solana/wallet-adapter-base": "^0.9.23",
    "@solana/wallet-adapter-ledger": "^0.9.26",
    "@solana/wallet-adapter-phantom": "^0.9.24",
    "@solana/wallet-adapter-react": "^0.15.35",
    "@solana/wallet-adapter-react-ui": "^0.9.35",
    "@solana/wallet-adapter-solflare": "^0.6.28",
    "@solana/web3.js": "^1.87.6",
    "@tanstack/react-query": "^5.13.4",
    "clsx": "^2.0.0",
    "lucide-react": "^0.294.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.3",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/react": "^14.1.2",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "@vitest/ui": "^1.1.0",
    "autoprefixer": "^10.4.16",
    "jsdom": "^23.0.1",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.2",
    "vite": "^5.0.10",
    "vitest": "^1.1.0"
  }
}
EOF

# ─── vite.config.ts ────────────────────────────────────────────────────────────
cat > "$DASH/vite.config.ts" << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
    global: {},
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          solana: ['@solana/web3.js', '@solana/wallet-adapter-react'],
          charts: ['recharts'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/testUtils.tsx',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
    },
  },
});
EOF

# ─── tsconfig.json ─────────────────────────────────────────────────────────────
cat > "$DASH/tsconfig.json" << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

cat > "$DASH/tsconfig.node.json" << 'EOF'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
EOF

# ─── tailwind.config.js ────────────────────────────────────────────────────────
cat > "$DASH/tailwind.config.js" << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        vault: {
          300: 'var(--color-vault-300)',
          400: 'var(--color-vault-400)',
          500: 'var(--color-vault-500)',
          600: 'var(--color-vault-600)',
          900: 'var(--color-vault-900)',
        },
      },
      animation: {
        'in': 'fadeIn 0.2s ease-out',
        'zoom-in-95': 'zoomIn95 0.2s ease-out',
        'slide-in-from-bottom-2': 'slideInFromBottom2 0.15s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        zoomIn95: { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        slideInFromBottom2: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
EOF

# ─── src/types.ts ─────────────────────────────────────────────────────────────
cat > "$DASH/src/types.ts" << 'EOF'
// ── Vault domain types (UI contract) ─────────────────────────────────────────

export type VaultStatusUI = 'locked' | 'unlocking' | 'unlocked' | 'frozen' | 'distributed';

export interface VaultSummary {
  vaultAddress: string;
  owner: string;
  status: VaultStatusUI;
  totalValue: number;
  inactivityThreshold: number;
  timelockDuration: number;
  guardianThreshold: number;
  guardianCount: number;
  beneficiaryCount: number;
  totalBps: number;
  lastCheckIn: string;
  subscriptionTier: 'free' | 'pro';
  docHash?: string;
  docUri?: string;
}

export interface Guardian {
  id: string;
  vaultAddress: string;
  wallet: string;
  role: 'personal' | 'professional' | 'delegate';
  status: 'pending' | 'active' | 'removed';
  addedAt: string;
}

export interface Beneficiary {
  id: string;
  vaultAddress: string;
  wallet: string;
  shareBps: number;
  active: boolean;
  addedAt: string;
}

export interface VaultAsset {
  id: string;
  vaultAddress: string;
  mint?: string;
  assetType: 'SOL' | 'SPL' | 'NFT' | 'POSITION';
  balance: string;
  usdValue?: number;
  lastUpdated: string;
}

export interface VaultDocument {
  id: string;
  fileName: string;
  uri: string;
  hash: string;
  uploadedAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  actor: string;
  txSignature?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface PortfolioPoint {
  timestamp: string;
  usdValue: number;
}

export interface LivenessInfo {
  lastCheckIn: string;
  daysSinceCheckIn: number;
  daysUntilInactive: number;
  healthPercent: number;
  status: 'healthy' | 'warning' | 'critical';
  delegates: Guardian[];
}

export interface DistributionState {
  vaultStatus: VaultStatusUI;
  unlockSession?: {
    status: string;
    initiator: string;
    approvalCount: number;
    timelockEndsAt?: string;
  };
  solSession?: {
    cursor: number;
    totalLamports: number;
    distributedLamports: number;
    completed: boolean;
  };
  splSessions?: Array<{
    mint: string;
    cursor: number;
    completed: boolean;
  }>;
  hasOpenDispute: boolean;
}

export interface VaultSettings {
  inactivityThreshold: number;
  timelockDuration: number;
  guardianThreshold: number;
  subscriptionTier: 'free' | 'pro';
  notificationPrefs?: {
    email?: string;
    phone?: string;
    checkInReminders: boolean;
    unlockAlerts: boolean;
    timelockAlerts: boolean;
    distributionAlerts: boolean;
  };
}
EOF

# ─── src/hooks/useAuth.ts ─────────────────────────────────────────────────────
cat > "$DASH/src/hooks/useAuth.ts" << 'EOF'
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  FC,
  createElement,
} from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/v1';

interface AuthState {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  authError: string | null;
  accessToken: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  isAuthenticating: false,
  authError: null,
  accessToken: null,
  signIn: async () => {},
  signOut: async () => {},
});

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { publicKey, signMessage } = useWallet();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    if (!publicKey || !signMessage) return;

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      // 1. Get nonce
      const nonceRes = await fetch(
        `${API_BASE}/auth/nonce?address=${publicKey.toBase58()}`,
      );
      const { nonce } = await nonceRes.json();

      // 2. Sign message
      const message = `Sign in to LegacyVault\n\nNonce: ${nonce}`;
      const msgBytes = new TextEncoder().encode(message);
      const signatureBytes = await signMessage(msgBytes);

      // 3. Encode signature as base58
      const bs58 = await import('bs58');
      const signature = bs58.default.encode(signatureBytes);

      // 4. Verify
      const verifyRes = await fetch(`${API_BASE}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: publicKey.toBase58(),
          signature,
          message,
        }),
      });

      if (!verifyRes.ok) throw new Error('Authentication failed');

      const { accessToken: at, refreshToken: rt } = await verifyRes.json();
      setAccessToken(at);
      setRefreshToken(rt);
    } catch (err: any) {
      setAuthError(err.message ?? 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  }, [publicKey, signMessage]);

  const signOut = useCallback(async () => {
    setAccessToken(null);
    setRefreshToken(null);
  }, []);

  return createElement(AuthContext.Provider, {
    value: {
      isAuthenticated: !!accessToken,
      isAuthenticating,
      authError,
      accessToken,
      signIn,
      signOut,
    },
    children,
  });
};

export const useAuth = () => useContext(AuthContext);
EOF

# ─── src/hooks/useTxBuilder.ts ───────────────────────────────────────────────
cat > "$DASH/src/hooks/useTxBuilder.ts" << 'EOF'
import { useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
import { useAuth } from './useAuth';
import type { TxStatusState, TxPhase } from '../components/TxStatusModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/v1';

interface UseTxBuilderOptions {
  onStateChange: (state: TxStatusState) => void;
}

export function useTxBuilder({ onStateChange }: UseTxBuilderOptions) {
  const { signTransaction } = useWallet();
  const { connection } = useConnection();
  const { accessToken } = useAuth();

  const setState = (phase: TxPhase, extra?: Partial<TxStatusState>) => {
    onStateChange({ phase, ...extra });
  };

  const execute = useCallback(
    async (endpoint: string, params: Record<string, any>) => {
      if (!signTransaction || !accessToken) {
        setState('error', { error: 'Wallet not connected or not authenticated' });
        return;
      }

      try {
        // Phase 1: Building
        setState('building', { label: formatLabel(endpoint) });

        const res = await fetch(`${API_BASE}/tx/${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(params),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? 'Failed to build transaction');
        }

        const { transaction: base64Tx } = await res.json();

        // Phase 2: Signing
        setState('signing', { label: formatLabel(endpoint) });
        const txBuffer = Buffer.from(base64Tx, 'base64');
        const tx = VersionedTransaction.deserialize(txBuffer);
        const signed = await signTransaction(tx);

        // Phase 3: Sending
        setState('sending');
        const serialized = signed.serialize();
        const signature = await connection.sendRawTransaction(serialized, {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        });

        // Phase 4: Confirming
        setState('confirming', { signature });
        const { value } = await connection.confirmTransaction(
          signature,
          'confirmed',
        );

        if (value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(value.err)}`);
        }

        // Success
        setState('success', { signature, label: formatLabel(endpoint) });
      } catch (err: any) {
        setState('error', { error: err.message ?? 'Unknown error' });
      }
    },
    [signTransaction, connection, accessToken],
  );

  return { execute };
}

function formatLabel(endpoint: string): string {
  return endpoint
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
EOF

# Create stub hook files for all Build 6 hooks
for hook in useVaultSummary useGuardians useBeneficiaries useAssets useLiveness useDistribution useDocuments useSettings useActivityLog usePortfolioHistory useNotifications; do
cat > "$DASH/src/hooks/${hook}.ts" << HOOKEOF
// ${hook}.ts — React Query hook (Build 6)
// TODO: Implement full query body from build6.md

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/v1';

async function apiFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(\`\${API_BASE}\${path}\`, {
    headers: { Authorization: \`Bearer \${token}\` },
  });
  if (!res.ok) throw new Error(\`API error: \${res.status}\`);
  return res.json();
}

export function ${hook}(opts?: { enabled?: boolean }) {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['${hook}'],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint from build6.md
      throw new Error('${hook}: not yet implemented — see build6.md');
    },
    enabled: (opts?.enabled ?? isAuthenticated) && !!accessToken,
    staleTime: 30_000,
  });
}
HOOKEOF
done

echo "Frontend hooks scaffolded (src/hooks/)"

Sub-Script 07 — UI Components (Build 7)
scripts/07-build7-components.sh

Bash

#!/usr/bin/env bash
# 07-build7-components.sh — Scaffold UI components (Build 7)
set -euo pipefail

ROOT_DIR="$1"
DASH="$ROOT_DIR/dashboard"

# ─── index.html ───────────────────────────────────────────────────────────────
cat > "$DASH/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>LegacyVault</title>
    <link rel="icon" type="image/svg+xml" href="/vault-icon.svg" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

# ─── src/index.css ─────────────────────────────────────────────────────────────
cat > "$DASH/src/index.css" << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-vault-300: #c4b5fd;
  --color-vault-400: #a78bfa;
  --color-vault-500: #8b5cf6;
  --color-vault-600: #7c3aed;
  --color-vault-900: #2e1065;
  --color-bg-primary: #0a0a0f;
  --color-bg-secondary: #0f0f1a;
  --color-bg-card: rgba(255, 255, 255, 0.03);
}

body {
  background-color: var(--color-bg-primary);
  color: white;
  font-family: system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.glass-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 1rem;
}

.shimmer-text {
  background: linear-gradient(
    90deg,
    var(--color-vault-400),
    #60a5fa,
    var(--color-vault-400)
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 3s linear infinite;
}

@keyframes shimmer {
  0% { background-position: 0% center; }
  100% { background-position: 200% center; }
}

/* Custom scrollbar */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.1);
  border-radius: 2px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,0.2);
}
EOF

# ─── src/main.tsx ─────────────────────────────────────────────────────────────
cat > "$DASH/src/main.tsx" << 'EOF'
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppProviders from './providers/AppProviders';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
EOF

# ─── src/providers/AppProviders.tsx ──────────────────────────────────────────
cat > "$DASH/src/providers/AppProviders.tsx" << 'EOF'
import { FC, ReactNode, useMemo } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../hooks/useAuth';

import '@solana/wallet-adapter-react-ui/styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, gcTime: 5 * 60_000, retry: 2 },
    mutations: { retry: 0 },
  },
});

const ENDPOINT = import.meta.env.VITE_RPC_URL ?? clusterApiUrl('devnet');

const AppProviders: FC<{ children: ReactNode }> = ({ children }) => {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  );

  return (
    <ConnectionProvider endpoint={ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>{children}</AuthProvider>
          </QueryClientProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default AppProviders;
EOF

# ─── Create component stubs ───────────────────────────────────────────────────
for comp in TxStatusModal WalletButton LoadingSkeleton Sidebar DashboardPanel VaultPanel GuardiansPanel BeneficiariesPanel LivenessPanel DistributionPanel DocumentsPanel SettingsPanel; do
cat > "$DASH/src/components/${comp}.tsx" << COMPEOF
// ${comp}.tsx — Build 7
// TODO: Copy full component implementation from build7.md / your build7 file

import { FC } from 'react';

// PLACEHOLDER — replace with full implementation from your build7.md
const ${comp}: FC<any> = (props) => {
  return (
    <div className="glass-card p-6 text-white/40 text-sm">
      <p>${comp} — TODO: implement from build7.md</p>
    </div>
  );
};

export default ${comp};
COMPEOF
done

# ─── src/App.tsx ──────────────────────────────────────────────────────────────
cat > "$DASH/src/App.tsx" << 'EOF'
// App.tsx — Build 7 final wiring
// TODO: Copy full implementation from build7.md / your build7 file

import { FC, useState } from 'react';

export type TabId =
  | 'dashboard' | 'vault' | 'guardians' | 'beneficiaries'
  | 'liveness' | 'distribution' | 'documents' | 'settings';

const App: FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-bg-primary)] text-white items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold shimmer-text mb-4">LegacyVault</h1>
        <p className="text-white/40 text-sm">
          TODO: Copy App.tsx from build7.md and wire real hooks
        </p>
      </div>
    </div>
  );
};

export default App;
EOF

# ─── Dashboard .env.example ───────────────────────────────────────────────────
cat > "$DASH/.env.example" << 'EOF'
# LegacyVault Dashboard
# Copy to .env.local and configure

# Solana RPC (Helius/QuickNode recommended)
VITE_RPC_URL=https://api.devnet.solana.com

# API base URL (Build 4 server)
VITE_API_BASE_URL=http://localhost:3000/v1

# Cluster for Solscan explorer links
VITE_CLUSTER=devnet
EOF

echo "Dashboard scaffolded (src/components/ + providers/ + hooks/ + App.tsx)"

Sub-Script 09 — Infrastructure (Build 9)
scripts/09-build9-infra.sh

Bash

#!/usr/bin/env bash
# 09-build9-infra.sh — Scaffold production infra (Build 9)
set -euo pipefail

ROOT_DIR="$1"
INFRA="$ROOT_DIR/infra"

# ─── docker-compose.yml ───────────────────────────────────────────────────────
cat > "$INFRA/docker-compose.yml" << 'EOF'
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-legacyvault}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?POSTGRES_PASSWORD required}
      POSTGRES_DB: ${POSTGRES_DB:-legacyvault}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER:-legacyvault}']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - '6379:6379'
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ../api
      dockerfile: Dockerfile
    restart: unless-stopped
    env_file: ../.env
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-legacyvault}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-legacyvault}
      REDIS_URL: redis://redis:6379
    ports:
      - '3000:3000'
    depends_on:
      postgres: { condition: service_healthy }
      redis: { condition: service_healthy }
    healthcheck:
      test: ['CMD', 'wget', '--spider', '-q', 'http://localhost:3000/health']
      interval: 30s
      timeout: 10s
      retries: 3

  indexer:
    build:
      context: ../indexer
      dockerfile: Dockerfile
    restart: unless-stopped
    env_file: ../.env
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-legacyvault}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-legacyvault}
      REDIS_URL: redis://redis:6379
    depends_on:
      postgres: { condition: service_healthy }
      redis: { condition: service_healthy }

  prometheus:
    image: prom/prometheus:latest
    restart: unless-stopped
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./prometheus/alerts.yml:/etc/prometheus/alerts.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=30d'
    ports:
      - '9090:9090'

  grafana:
    image: grafana/grafana:latest
    restart: unless-stopped
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD:-changeme}
      GF_USERS_ALLOW_SIGN_UP: 'false'
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
      - grafana_data:/var/lib/grafana
    ports:
      - '3001:3000'
    depends_on:
      - prometheus

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    ports:
      - '80:80'
    depends_on:
      - api

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:
EOF

# ─── prometheus.yml ───────────────────────────────────────────────────────────
cat > "$INFRA/prometheus/prometheus.yml" << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - 'alerts.yml'

scrape_configs:
  - job_name: 'api'
    static_configs:
      - targets: ['api:3000']
    metrics_path: '/metrics'

  - job_name: 'indexer'
    static_configs:
      - targets: ['indexer:9091']
    metrics_path: '/metrics'
EOF

# ─── alerts.yml ───────────────────────────────────────────────────────────────
cat > "$INFRA/prometheus/alerts.yml" << 'EOF'
groups:
  - name: legacyvault
    rules:
      - alert: APIDown
        expr: up{job="api"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: 'LegacyVault API is down'

      - alert: IndexerLagging
        expr: indexer_slot_lag > 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'Indexer is {{ $value }} slots behind chain tip'

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'High API error rate: {{ $value }} errors/sec'
EOF

# ─── Grafana provisioning ─────────────────────────────────────────────────────
cat > "$INFRA/grafana/provisioning/datasources.yml" << 'EOF'
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
EOF

cat > "$INFRA/grafana/provisioning/dashboards.yml" << 'EOF'
apiVersion: 1
providers:
  - name: LegacyVault
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 60
    options:
      path: /etc/grafana/provisioning/dashboards
EOF

# ─── nginx.conf ───────────────────────────────────────────────────────────────
cat > "$INFRA/nginx/nginx.conf" << 'EOF'
events { worker_connections 1024; }

http {
  upstream api {
    server api:3000;
  }

  server {
    listen 80;
    server_name _;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=20r/s;

    location /v1/ {
      limit_req zone=api burst=50 nodelay;
      proxy_pass http://api;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /health {
      proxy_pass http://api;
    }
  }
}
EOF

echo "Infrastructure scaffolded (docker-compose.yml + prometheus + grafana + nginx)"

Sub-Script 10 — Finalize
scripts/10-finalize.sh

Bash

#!/usr/bin/env bash
# 10-finalize.sh — Git init + root env + NEXT_STEPS.md
set -euo pipefail

ROOT_DIR="$1"

# ─── Root .env.example ────────────────────────────────────────────────────────
cat > "$ROOT_DIR/.env.example" << 'EOF'
# ══════════════════════════════════════════
# LegacyVault — Root Environment Variables
# Copy to .env and fill in all TODO values
# ══════════════════════════════════════════

# Postgres
POSTGRES_USER=legacyvault
POSTGRES_PASSWORD=TODO_STRONG_PASSWORD
POSTGRES_DB=legacyvault

DATABASE_URL=postgresql://legacyvault:TODO_STRONG_PASSWORD@localhost:5432/legacyvault

# Redis
REDIS_URL=redis://localhost:6379

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_WS_URL=wss://api.devnet.solana.com
SOLANA_CLUSTER=devnet
PROGRAM_ID=TODO_AFTER_ANCHOR_BUILD

# API
API_PORT=3000
JWT_SECRET=TODO_RANDOM_32_CHARS
APP_URL=http://localhost:5173

# Grafana
GRAFANA_PASSWORD=TODO_GRAFANA_PASSWORD

# Notifications
RESEND_API_KEY=TODO
EMAIL_FROM=LegacyVault <noreply@legacyvault.io>
TWILIO_ACCOUNT_SID=TODO
TWILIO_AUTH_TOKEN=TODO
TWILIO_PHONE_NUMBER=TODO

# Firebase (push notifications)
FIREBASE_PROJECT_ID=TODO
FIREBASE_CLIENT_EMAIL=TODO
FIREBASE_PRIVATE_KEY=TODO

# Document Storage
STORAGE_BACKEND=s3
S3_ENDPOINT=TODO
S3_REGION=us-east-1
S3_BUCKET_NAME=legacyvault-documents
S3_ACCESS_KEY_ID=TODO
S3_SECRET_ACCESS_KEY=TODO

# Arweave (optional alternative)
ARWEAVE_WALLET_JWK={}

# Monitoring
SENTRY_DSN=TODO_OPTIONAL
SENTRY_ENVIRONMENT=development
EOF

# ─── Root .gitignore ──────────────────────────────────────────────────────────
cat > "$ROOT_DIR/.gitignore" << 'EOF'
# Environment
.env
.env.local
.env.*.local

# Node
node_modules/
dist/
.turbo/

# Rust / Anchor
target/
.anchor/
test-ledger/

# Build artifacts
*.js.map
*.d.ts.map

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
*.log
npm-debug.log*
yarn-error.log*

# Coverage
coverage/
.nyc_output/

# Prisma
api/prisma/dev.db
api/prisma/migrations/*.db

# Secrets — NEVER commit these
*.pem
*.key
*.jwk
arweave-wallet.json
EOF

# ─── .github/workflows/test.yml ──────────────────────────────────────────────
mkdir -p "$ROOT_DIR/.github/workflows"
cat > "$ROOT_DIR/.github/workflows/test.yml" << 'EOF'
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  anchor-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Solana
        run: |
          sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
          echo "$HOME/.local/share/solana/install/active_release/bin" >> $GITHUB_PATH
      - name: Cache Cargo
        uses: actions/cache@v3
        with:
          path: |
            ~/.cargo/registry
            ~/.cargo/git
            program/target
          key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}
      - name: Install Anchor
        run: cargo install --git https://github.com/coral-xyz/anchor --tag v0.29.0 anchor-cli --locked
      - name: Build program
        working-directory: ./program
        run: anchor build
      - name: Run Anchor tests
        working-directory: ./program
        run: anchor test

  api-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: legacyvault_test
        ports: ['5433:5432']
        options: --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5
      redis:
        image: redis:7
        ports: ['6380:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm', cache-dependency-path: api/package-lock.json }
      - run: npm ci
        working-directory: ./api
      - run: npx prisma migrate deploy
        working-directory: ./api
        env:
          DATABASE_URL: postgresql://test:test@localhost:5433/legacyvault_test
      - run: npm test
        working-directory: ./api
        env:
          DATABASE_URL: postgresql://test:test@localhost:5433/legacyvault_test
          REDIS_URL: redis://localhost:6380
          JWT_SECRET: test-secret-32-chars-minimum-length

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm', cache-dependency-path: dashboard/package-lock.json }
      - run: npm ci
        working-directory: ./dashboard
      - run: npm test -- --run
        working-directory: ./dashboard
EOF

# ─── deploy.sh ────────────────────────────────────────────────────────────────
cat > "$ROOT_DIR/deploy.sh" << 'EOF'
#!/usr/bin/env bash
# deploy.sh — Production deployment orchestrator

set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

step() { echo -e "${YELLOW}▶ $1${NC}"; }
ok()   { echo -e "${GREEN}✓ $1${NC}"; }
err()  { echo -e "${RED}✗ $1${NC}"; exit 1; }

[ -f .env ] || err ".env not found — copy .env.example and configure"
source .env

step "Building Anchor program..."
cd program
anchor build
ok "Program built"

step "Deploying to ${SOLANA_CLUSTER}..."
anchor deploy --provider.cluster "${SOLANA_CLUSTER}"
ok "Program deployed"

step "Running database migrations..."
cd ../api
npx prisma migrate deploy
ok "Migrations complete"

step "Building Docker images..."
cd ../infra
docker-compose build --no-cache
ok "Images built"

step "Starting services..."
docker-compose up -d
ok "Services started"

step "Waiting for health checks..."
sleep 15
docker-compose ps

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  LegacyVault deployed!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "  API:        http://localhost:3000/health"
echo "  Grafana:    http://localhost:3001"
echo "  Prometheus: http://localhost:9090"
EOF
chmod +x "$ROOT_DIR/deploy.sh"

# ─── NEXT_STEPS.md ────────────────────────────────────────────────────────────
cat > "$ROOT_DIR/NEXT_STEPS.md" << 'EOF'
# LegacyVault — What To Do After Scaffolding

## 🔴 Must Do First (Blockers)

### 1. Install dependencies
```bash
# Anchor program
cd program && npm install

# API
cd api && npm install

# Indexer
cd indexer && npm install

# Dashboard
cd dashboard && npm install

2. Configure environment

Bash

cp .env.example .env
# Open .env and replace every TODO_ value

3. Build & deploy Anchor program to devnet

Bash

cd program
anchor build
# Copy the program ID from target/deploy/legacyvault-keypair.json
# Paste it into:
#   - program/Anchor.toml [programs.devnet]
#   - program/programs/legacyvault/src/lib.rs declare_id!()
#   - .env PROGRAM_ID=

anchor deploy --provider.cluster devnet

🟡 Implement TODOs (Core logic)
4. Implement Anchor instruction handlers

Files with // TODO: Implement in:

text

program/programs/legacyvault/src/instructions/
  admin.rs
  vault.rs
  guardians.rs
  beneficiaries.rs
  custody.rs
  liveness.rs
  documents.rs
  unlock.rs
  disputes.rs
  distribution.rs
  subscription.rs

Reference: completedoc.md + build2.md + build3.md
5. Wire API tx-builder endpoints to real Anchor program

File: api/src/routes/tx.route.ts All endpoints return HTTP 501 — replace with real instruction builders. Reference: build4.md
6. Wire indexer event handlers to real IDL

File: indexer/src/event-parser.ts Replace stub parseEventName() with Anchor IDL coder. Reference: build5.md
7. Implement React Query hook bodies

Files: dashboard/src/hooks/use*.ts All hooks throw "not yet implemented". Reference: build6.md
8. Copy full component implementations

Files: dashboard/src/components/*.tsx All components are stubs. Copy from build7.md.
🟢 Test & Validate
9. Run Anchor tests (devnet)

Bash

cd program
anchor test

10. Start local API + DB

Bash

# Start Postgres + Redis via Docker
cd infra
docker-compose up -d postgres redis

# Run migrations
cd ../api
npx prisma migrate dev

# Start API dev server
npm run dev

11. Start indexer

Bash

cd indexer
npm run dev

12. Start dashboard

Bash

cd dashboard
npm run dev
# Open http://localhost:5173

13. Run test suite

Bash

# Anchor
cd program && anchor test

# API
cd api && npm test

# Frontend
cd dashboard && npm test

🔵 Production Deployment
14. Deploy to mainnet

Bash

# Edit .env: SOLANA_CLUSTER=mainnet-beta
./deploy.sh

15. Transfer upgrade authority to multisig

Bash

cd program
./scripts/transfer-upgrade-authority.sh

File Reference Map
What you need	Where to look
Anchor instruction logic	build2.md, build3.md
API tx-builder full code	build4.md
Indexer event handlers	build5.md
React Query hook bodies	build6.md
TxStatusModal, WalletButton	build7.md
App.tsx final wiring	build7.md
Test implementations	build8.md
Notifier / doc storage	build9.md
Full protocol spec	completedoc.md
EOF	
─── Git init ─────────────────────────────────────────────────────────────────

cd "$ROOT_DIR" git init -q git add . git commit -q -m "chore: initial scaffold from builds 1-9"

echo "Git repository initialized with initial commit" echo "Project root: $ROOT_DIR"

text


---

## Final Setup

### Make everything executable and run

```bash
# 1. Create the bootstrap directory
mkdir -p bootstrap/scripts

# 2. Save each script file from above into bootstrap/scripts/

# 3. Make executable
chmod +x bootstrap/bootstrap.sh
chmod +x bootstrap/scripts/*.sh

# 4. Run
./bootstrap/bootstrap.sh

# 5. Output
# legacyvault-project/
#   program/          ← Anchor workspace
#   api/              ← Fastify API
#   indexer/          ← Event indexer
#   dashboard/        ← React frontend
#   infra/            ← Docker + Prometheus + Grafana
#   .env.example      ← Root config template
#   deploy.sh         ← Production deployer
#   NEXT_STEPS.md     ← Exactly what to do next
#   .github/          ← CI/CD

What the script creates vs. what you fill in
Created by script	You fill in (from build docs)
Full folder structure	Anchor instruction bodies (builds 2-3)
Cargo.toml, package.json, tsconfig.json	API tx-builder wiring (build 4)
All state/error/event types	Indexer IDL event decoding (build 5)
Prisma schema	React Query hook bodies (build 6)
Auth route (SIWS complete)	Component implementations (build 7)
Health/metrics routes	Test implementations (build 8)
Docker Compose + Prometheus + Grafana	Notifier/doc storage (build 9)
.env.example templates	All TODO_ values in .env
NEXT_STEPS.md	Your program ID after anchor build
CI/CD workflow	Real API keys (Resend, Twilio, etc.)

Start with NEXT_STEPS.md inside legacyvault-project/ — it tells you exactly what to do in order after the scaffold runs.
