LEGACYVAULT — MASTERDOC.MD (Remastered v1.1)
"Dashboard-Parity Build" — Single Source of Truth

Version: 1.1 Date: 2026-05-06 Status: Authoritative — supersedes all prior drafts Phase output: 1 of 3

    ⚠️ Legal & Compliance Disclaimer (Non-Negotiable) LegacyVault is a digital asset custody and automation tool. It is not legal advice. It does not create legally enforceable wills or trusts under any jurisdiction's estate or probate law. It does not guarantee compliance with tax, inheritance, or financial regulation in any country. All product copy, UI labels, and onboarding screens must communicate this clearly and without ambiguity. Users should be directed to consult licensed legal professionals for estate planning matters.

PHASE 1 — PRODUCT DEFINITION, PRINCIPLES, ACTORS, AND COMPLETE UI CONTRACT
Section 0 — Purpose & Governing Rules of This Document
0.1 What this document is

This is the single canonical source of truth for the entire LegacyVault product: the on-chain Solana program (Anchor), the off-chain services (API Gateway, Indexer, Notifier, Document Service, Market Data), and the front-end dashboard application.

Every engineering decision — program account shapes, API response schemas, UI data bindings, state machine transitions, distribution batch conventions, encryption posture, error codes, events, and testing strategy — must be traceable back to a requirement in this document.
0.2 The reference UI is Legacyvaultdashboardbuild/

The dashboard application located at Legacyvaultdashboardbuild/ is the canonical product UI reference. Its:

    information architecture (sidebar tabs and ordering),
    component shapes and interactions (panels, cards, toggles, charts, flows),
    domain types (VaultState, Guardian, Beneficiary, VaultAsset, VaultDocument, DistributionBatch, Notification, ActivityLog), and
    visual language (Tailwind v4 vault-* color tokens, .glass-panel, .glass-card, animation helpers, toggle styling)

…are all frozen as product requirements. Nothing in this document overrides the look, feel, or functional scope of that UI — this document exists to make that UI work with real data, real transactions, and real on-chain state.
0.3 The "No Mock Data" Rule (Hard Constraint)

The following files in Legacyvaultdashboardbuild/ are development scaffolding only and must be fully replaced before any production or testnet deployment:
Mock artifact	What replaces it
src/data/mockData.ts	Indexer-backed API read models (see Section 7)
useVaultState in-memory simulator	Real data hooks + tx-builder API calls (see Section 8)
Fake txSignature (setTimeout)	Real confirmed Solana tx signatures from wallet adapter
Hard-coded totalValue = 103701	Market data service valuation (see Section 6.4)
Hard-coded liveness chart data	Indexed CheckIn event series (see Section 6.2)
Hard-coded portfolio history	Off-chain snapshot store (see Section 6.4)

Definition: "No mock data" means every value rendered in the production dashboard has a declared, verifiable, live source — on-chain account, indexed event, or authenticated API response.
0.4 How to use this document

    Protocol engineers → Sections 3, 4, 5 (state machine, accounts, instructions, errors, events)
    Backend engineers → Sections 6, 7, 8 (services, indexer, API gateway)
    Frontend engineers → Sections 1, 2, 8, 9 (UI contract, data bindings, hook replacement, tx flows)
    QA / acceptance → Section 10 (definition of done per tab)
    Security reviewers → Section 11 (threat model and mitigations)

Section 1 — Product Definition
1.1 What LegacyVault is

LegacyVault is a Solana-native digital estate automation protocol and application. It allows a wallet owner ("vault owner") to:

    Deposit digital assets (SOL, SPL tokens, NFTs, position tokens) into a program-controlled vault.
    Designate beneficiaries with configurable share allocations and per-asset override rules.
    Appoint guardians (personal, professional, or delegate) with a configurable M-of-N approval threshold.
    Define liveness conditions: an inactivity threshold (if the owner stops checking in, the vault becomes unlock-eligible) and a timelock delay (window for owner to cancel after guardians approve).
    Upload encrypted documents (wills, letters, legal records) anchored by on-chain hash commitments.
    When unlock conditions are met, execute a deterministic, on-chain asset distribution to beneficiaries.

1.2 Supported asset types

All four asset types that the UI models must be supported end-to-end:
UI VaultAsset.type	On-chain reality	Discovery method
SOL	Native lamports on vault authority PDA	Direct RPC balance query
SPL	SPL Token / Token-2022 account owned by vault authority	getTokenAccountsByOwner
NFT	SPL token with supply = 1, optional Metaplex metadata	Same as SPL; enriched by metadata
POSITION	LP receipt / LST / vault share (SPL-compatible)	Same as SPL; enriched by registry
1.3 Asset override semantics

The UI models three override types for per-beneficiary per-asset rules. These are protocol-level rules (stored on-chain, enforced during distribution):
UI AssetOverride.type	Meaning
pro-rata	Beneficiary participates in this asset's distribution at their global shareBps weight
fixed-bps	Beneficiary receives an explicit basis-points slice of this asset (independent of global share)
entire-to-beneficiary	The entire balance of this asset is sent to this one beneficiary
1.4 Subscription tiers

The Settings panel shows three tiers. These must be enforced consistently:
Tier	Hard limits enforced on-chain	Service perks enforced off-chain (API/Notifier)
Free	Max 2 guardians, max 2 beneficiaries, max 1 vault	Basic email notification only
Pro ($9.99/mo)	Max 5 guardians, max 10 beneficiaries, max 3 vaults	Email + SMS + push; 5GB doc storage
Enterprise ($29.99/mo)	Max 20 guardians, unlimited beneficiaries, unlimited vaults	All channels + KYC pro guardian + 50GB doc storage

Rule: subscription tier must never affect custody safety. An expired subscription must not prevent a valid distribution from executing on-chain. It may restrict UI features and notification delivery.
Section 2 — Non-Negotiable Principles

These principles govern every trade-off in this system:
2.1 Safety over convenience

    False-positive unlocks (owner is alive but missed check-in) must be reversible: the owner can cancel during the timelock window.
    No irreversible action (distribution) can be triggered by a single party acting alone.
    Default inactivity thresholds must be conservative (30-day minimum configurable; 90-day default).

2.2 Deterministic execution

    Distribution must produce identical results regardless of which off-chain service triggered it.
    Beneficiary processing order is canonical: sorted ascending by beneficiary wallet pubkey bytes.
    Cursor/session accounting tracks progress so batches are idempotent and resumable.

2.3 Least trust

    Off-chain services (API gateway, notifier, automation worker) may suggest transactions but must never hold private keys or submit transactions on behalf of users.
    The protocol must be fully executable by a technically capable user with only an RPC endpoint and a wallet — no hosted services required for custody operations.

2.4 Transparency

    Every state change emits an on-chain event.
    The indexer reconstructs a full audit trail from events alone.
    The UI activity log and distribution batch history are derived entirely from this audit trail.

2.5 Compute awareness

    Solana's per-transaction compute and account limits mean distribution must be chunked.
    Batch sizes and remaining-account layouts are defined canonically in Section 5.6 of this document.
    The UI's "Process single batch" and "Process all" operations map directly to these chunked instructions.

2.6 UI parity (non-negotiable for this remaster)

    Every field, button, status indicator, chart, and flow in Legacyvaultdashboardbuild/ must be backed by a real data source as defined in this document.
    The visual language (glass components, vault color tokens, animations) must not change.
    The sidebar tab ordering (dashboard → vault → guardians → beneficiaries → liveness → distribution → documents → settings) is frozen.

Section 3 — Actors & Trust Model
3.1 Actor definitions
Owner

    The wallet that created the vault.
    Has full administrative control: deposit, withdraw (when not unlocking), configure settings, add/remove guardians and beneficiaries, check in, cancel unlock during timelock, freeze, and upload documents.
    Is the only entity that can sign custody-affecting transactions in normal operation.
    May designate liveness delegates to submit check-ins on their behalf (but delegates cannot perform any other owner action).

Guardian

Three sub-roles (matching UI Guardian.role):
Role	Description
personal	Trusted individual (friend, family member) chosen by owner
professional	Verified third-party (legal/trust service) with optional bonding and KYC
delegate	Authorized only to submit check-ins, not unlock approvals

    Guardians initiate the unlock process (any guardian may initiate if inactivity threshold is met).
    Guardians approve the unlock (M-of-N threshold must be reached).
    Guardians cannot change custody rules, withdraw assets, or trigger distribution directly.

Beneficiary

    Receives assets when distribution executes.
    Has no active role in custody decisions.
    Has a dashboard view showing their expected share and distribution receipts once distributed.

Professional Guardian

    Has an on-chain profile PDA with KYC status, reputation, and bond amount.
    Bond is subject to slashing if the guardian approves a fraudulent/premature unlock.
    Listed in a discoverable professional guardian marketplace.

Arbiter (Optional)

    Appointed per-vault by the owner.
    Can resolve disputes that block finalization.
    Has no ability to move funds directly; can only unblock or cancel a disputed unlock.

Automation Worker (Off-chain, Advisory Only)

    An off-chain service that monitors vault states, detects unlock eligibility, and proposes batched distribution transactions for guardian/beneficiary execution.
    Never holds private keys.
    Never submits transactions on behalf of any actor.

Section 4 — Complete UI Contract (The "What Must Be Real")

This section is the authoritative binding between UI components and their required data sources. Every field listed here must come from a real source in production — no computed defaults, no fallback mock constants.
4.1 VaultState (used by: Dashboard, Sidebar, all panels)
Field	Type	Real source
state	'locked' | 'unlocking' | 'unlocked' | 'frozen' | 'distributed'	Mapped from on-chain VaultStatus via indexer read model
createdAt	timestamp (ms)	On-chain vault created_at field (slot timestamp at creation)
lastCheckIn	timestamp (ms)	On-chain vault last_check_in field
timelockStart	timestamp (ms) or null	On-chain unlock session timelock_started_at
inactivityThreshold	seconds	On-chain vault inactivity_threshold
timelockDuration	seconds	On-chain vault timelock_duration
guardianThreshold	number	On-chain vault guardian_threshold
totalGuardians	number	Derived: count of active guardian entry PDAs
totalBeneficiaries	number	Derived: count of active beneficiary entry PDAs
totalBps	number	Derived: sum of shareBps across active beneficiaries
subscriptionTier	'free' | 'pro' | 'enterprise'	On-chain subscription state or off-chain signed attestation
subscriptionExpiry	timestamp (ms)	On-chain subscription state or off-chain record
4.2 Guardian (used by: GuardiansPanel, Dashboard approval count)
Field	Type	Real source
pubkey	string	On-chain guardian entry PDA guardian_wallet
role	'personal' | 'professional' | 'delegate'	On-chain guardian entry role
status	'active' | 'pending' | 'inactive'	On-chain guardian entry status
approved	boolean	On-chain guardian approval PDA exists for current unlock session
approvalTime	timestamp or null	On-chain guardian approval PDA approved_at
name	string	Off-chain user metadata (profile DB, auth by wallet sig)
avatar	string (URL)	Off-chain user metadata
lastContact	timestamp	Off-chain notification delivery receipt
reputation	number or null	On-chain professional guardian profile PDA (if professional role)
bondAmount	number or null	On-chain professional guardian bond PDA (if professional role)
4.3 Beneficiary (used by: BeneficiariesPanel, DistributionPanel)
Field	Type	Real source
pubkey	string	On-chain beneficiary entry PDA beneficiary_wallet
shareBps	number	On-chain beneficiary entry share_bps
active	boolean	On-chain beneficiary entry active
name	string	Off-chain user metadata
avatar	string	Off-chain user metadata
assetOverrides	AssetOverride[]	On-chain asset rule PDAs keyed by (vault, beneficiary, mint)
4.4 VaultAsset (used by: VaultPanel, DistributionPanel, Dashboard pie chart)
Field	Type	Real source
type	'SOL' | 'SPL' | 'NFT' | 'POSITION'	Asset discovery + token metadata
mint	string or null	SPL mint address (null for SOL)
symbol	string	Token metadata service
name	string	Token metadata service
icon	string (URL)	Token metadata service
balance	number	On-chain token account balance
usdValue	number	Market pricing service
change24h	number or null	Market pricing service
4.5 VaultDocument (used by: DocumentsPanel)
Field	Type	Real source
id	string	Off-chain document record ID
type	'will' | 'letter' | 'legal' | 'identity' | 'financial' | 'other'	Off-chain document metadata
name	string	Off-chain document metadata
size	number	Off-chain document metadata
hash	string	On-chain vault document commitment doc_hash
uri	string	On-chain vault document commitment doc_uri
uploadedAt	timestamp	Off-chain document record
encrypted	boolean	Always true in production
icon	string	Derived from type
4.6 DistributionBatch (used by: DistributionPanel)
Field	Type	Real source
id	string	Derived from session PDA + batch index
type	'sol' | 'spl'	Distribution session type
mint	string or null	SPL mint (null for SOL)
startIndex	number	Distribution session cursor before this batch
batchSize	number	Defined by tx-builder
status	'pending' | 'processing' | 'completed' | 'failed'	Derived from session cursor progress + indexer
txSignature	string or null	Confirmed Solana transaction signature
processedAt	timestamp or null	On-chain confirmed slot timestamp
4.7 ActivityLog (used by: Dashboard)
Field	Type	Real source
id	string	Indexer-generated UUID
type	enum (see below)	Derived from on-chain event type
description	string	Indexer-generated human-readable label
timestamp	timestamp	On-chain slot timestamp of the event
txSignature	string	On-chain transaction signature

Activity types (must all be derivable from on-chain events): deposit, withdrawal, check_in, guardian_added, guardian_removed, guardian_approved, beneficiary_added, beneficiary_updated, unlock_initiated, unlock_cancelled, unlock_approved, freeze, unfreeze, distribution_batch, unlock_finalized, document_set, settings_updated
4.8 Notification (used by: Dashboard, Topbar badge)
Field	Type	Real source
id	string	Notifier service DB
type	enum (see below)	Notifier rule type
title	string	Notifier-generated
message	string	Notifier-generated
read	boolean	User-scoped read state in DB
createdAt	timestamp	Notifier DB
severity	'info' | 'warning' | 'critical'	Notifier rule config

Notification types: check_in_reminder, check_in_overdue, unlock_eligible, unlock_initiated, unlock_approved, timelock_ending, distribution_complete, guardian_invite, subscription_expiring, distribution_failed
Section 5 — End-to-End UX Flows (UI-Grounded)

This section defines every user flow as it exists in Legacyvaultdashboardbuild/ and specifies exactly what real operations must happen beneath each step.
5.1 Owner onboarding flow (first-time vault creation)

    Owner connects wallet (Phantom/Backpack/etc. via standard wallet adapter).
    Owner navigates to Settings → creates vault with:
        Inactivity threshold (slider: 30–365 days → stored in seconds on-chain)
        Timelock duration (slider → stored in seconds on-chain)
        Guardian threshold (number)
        Subscription tier selection → triggers subscription initialization
    System derives vault PDA and vault authority PDA deterministically from owner pubkey.
    Vault creation transaction is built by API tx-builder, signed by owner wallet, submitted to Solana.
    Indexer confirms vault creation event and populates read model.
    Dashboard redirects to Vault tab with newly created vault loaded.

5.2 Guardian management flow (GuardiansPanel)

Add guardian (owner action):

    Owner clicks "Add Guardian" in GuardiansPanel.
    Fills in guardian wallet address, selects role (personal, professional, delegate).
    For professional role: system checks on-chain professional guardian profile exists for that wallet.
    API tx-builder builds add_guardian transaction; owner signs.
    Guardian appears with status: 'pending' until they accept (optional: acceptance instruction).
    Indexer emits guardian_added activity log entry.

Guardian approval flow (guardian action — during unlocking):

    Guardian connects wallet and navigates to GuardiansPanel.
    Guardian sees unlock session is active (inactivity threshold met).
    Guardian clicks "Approve Unlock".
    API tx-builder builds approve_unlock transaction signed by guardian.
    On-chain guardian approval PDA is created.
    UI Guardian.approved flips to true, Guardian.approvalTime is set from slot timestamp.
    If M-of-N threshold is now met: VaultState.state transitions to 'unlocking' → approval phase done.

5.3 Beneficiary management flow (BeneficiariesPanel)

Add/edit beneficiary (owner action):

    Owner adds beneficiary wallet address + shareBps.
    UI validates in real-time: shows allocated vs remaining bps (from live totalBps read model field).
    If totalBps !== 10000, plan is flagged as invalid — unlock and distribution are blocked on-chain.
    Owner can set active toggle; inactive beneficiaries are excluded from distribution calculations.
    Asset overrides can be set per beneficiary per mint.

5.4 Liveness check-in flow (LivenessPanel)

    LivenessPanel displays daysSinceCheckIn and daysRemaining (from real lastCheckIn on-chain timestamp).
    Health status (healthy / warning / danger) is computed by API read model (not re-computed client-side from arbitrary thresholds).
    Owner clicks "Check In".
    API tx-builder builds check_in transaction; owner wallet signs.
    On-chain last_check_in is updated to current slot time.
    Indexer records a check_in activity log entry and emits an updated liveness snapshot for the chart.
    Notifier scheduler resets check-in reminder timers.

5.5 Distribution flow (DistributionPanel — 4 steps)

This is the most protocol-sensitive flow. The UI uses an activeSection with four stages:
Step 1: unlock (Unlock initiation)

    Display: current vault state, inactivity status, guardian threshold vs approvals.
    If not yet unlock-eligible: show days remaining; disable "Initiate Unlock".
    If eligible: Guardian clicks "Initiate Unlock". API builds initiate_unlock tx; guardian signs.
    If already unlocking: show timelock countdown (derived from timelockStart + timelockDuration - now).
    Cancel Unlock: Owner can cancel during timelock. API builds cancel_unlock tx; owner signs.
    Freeze/Unfreeze: Owner can freeze vault at any point. API builds freeze/unfreeze tx; owner signs.

Step 2: sol (SOL distribution batching)

    Enabled only when unlock state is Approved + timelock elapsed.
    API provides: total beneficiaries, current SOL session cursor, batch size recommendation.
    "Process Distribution" button → API builds init_dist_sol tx (first call) then exec_dist_sol_batch tx; owner or designated executor signs.
    Each batch call advances the cursor. UI shows per-batch status and txSignature on confirmation.
    "Process All" → executes all remaining batches sequentially.

Step 3: spl (SPL distribution batching)

    UI shows SPL asset list (from real VaultAsset[] filtered to type === 'SPL' || type === 'NFT' || type === 'POSITION').
    Owner/executor selects which mints to distribute.
    "Create missing beneficiary ATAs" toggle: if enabled, the exec_dist_spl_batch instruction will create beneficiary ATAs if they don't exist (adds compute and fee — UI must warn).
    Per-mint: init_dist_spl → exec_dist_spl_batch (batched) → cursor advances.
    Per-batch: status and txSignature displayed.

Step 4: finalize (Finalize unlock)

    Enabled only when:
        SOL distribution session is complete (cursor = total beneficiaries).
        All selected SPL mint sessions are complete.
        No open dispute.
    API builds finalize_unlock tx; owner or designated executor signs.
    Vault state transitions to 'distributed'.
    All subsequent withdrawal/deposit instructions are blocked.

5.6 Documents flow (DocumentsPanel)

Upload:

    Owner selects file and document type.
    Browser encrypts file using WebCrypto AES-GCM with vault document key.
    Encrypted blob is uploaded to doc service (presigned URL).
    sha256(ciphertext) is computed client-side.
    API tx-builder builds set_document_commitment tx with hash + URI + metadata digest.
    Owner signs; on-chain commitment confirmed.
    Doc service records metadata; DocumentsPanel refreshes.

View/download:

    Authorized user clicks View or Download.
    API verifies wallet auth (SIWS); returns download URL.
    Browser downloads encrypted blob and decrypts using vault document key.
    File is rendered (view) or saved (download).

Delete/revoke:

    Owner selects Delete.
    Off-chain blob is removed from doc service.
    API tx-builder builds revoke_document tx marking on-chain commitment as revoked (not erased — audit trail preserved).

5.7 Settings flow (SettingsPanel)

Custody settings (on-chain changes):

    Inactivity threshold, timelock duration, guardian threshold → each requires a signed on-chain transaction.
    These are blocked during unlocking or frozen states.

Notification preferences (off-chain):

    Email/SMS/push toggles → stored in off-chain user DB, authenticated via SIWS.
    Changes take effect immediately; no on-chain tx needed.

Subscription:

    Upgrade/downgrade → triggers on-chain subscription instruction + off-chain billing record.
    Downgrade checks if current usage exceeds new tier limits (warn before allowing downgrade).

Section 6 — State Machine (UI ↔ Protocol Mapping)
6.1 Vault status state machine

text

┌──────────────────────────────────────────────────────────────────┐
│                        STATE MACHINE                             │
│                                                                  │
│   [CREATED] ──────────────────────────────────────────────────  │
│       │                                                          │
│       ▼                                                          │
│   [Active / "locked"] ◄──────────────────────────────────────   │
│       │                           ▲                             │
│       │ initiate_unlock            │ cancel_unlock              │
│       │ (inactivity met)          │ (owner, within timelock)   │
│       ▼                           │                             │
│   [Unlocking / "unlocking"] ───────┘                            │
│       │                                                          │
│       │ M-of-N approvals + timelock elapsed                      │
│       ▼                                                          │
│   [Executing / "unlocked"] ◄── (batched distribution runs here) │
│       │                                                          │
│       │ finalize_unlock (all sessions done)                      │
│       ▼                                                          │
│   [Distributed / "distributed"] ──── terminal state             │
│                                                                  │
│   Any state ──► [Frozen / "frozen"] ──► (unfreeze) ──► prior    │
└──────────────────────────────────────────────────────────────────┘

6.2 UI state → Protocol state mapping (canonical)
UI VaultState.state	Protocol VaultStatus (on-chain enum)	Transitions in
locked	Active	Created; cancel_unlock; unfreeze (from Active)
unlocking	Unlocking	initiate_unlock
unlocked	Executing	Threshold met + timelock elapsed
distributed	Distributed	finalize_unlock
frozen	Frozen	freeze (from any non-distributed state)

Rule: The UI must never compute state from timestamps or approval counts. State must come from the VaultStatus field in the indexer read model (GET /v1/vaults/:vault/summary), mapped through this table.
6.3 Unlock session status state machine

text

UnlockSession status:

  [Proposed] → (guardians approve) → [Approved] → (timelock elapsed)
             → [Executing] → (all batches done) → [Finalize] → [Executed]

  [Proposed] → (owner cancels) → [Cancelled]
  [Approved] → (owner cancels within timelock) → [Cancelled]
  [Executing] → (dispute opened) → [Disputed]
  [Disputed] → (arbiter: cancel) → [Cancelled]
  [Disputed] → (arbiter: proceed) → [Executing]

Section 7 — Dashboard-Specific UI/UX Rules
7.1 App shell (Sidebar + Topbar)

Sidebar:

    Tab order is frozen: dashboard | vault | guardians | beneficiaries | liveness | distribution | documents | settings
    The vault status card ("Vault Secured") must bind to:
        VaultState.state (for color/icon)
        VaultState.guardianThreshold and real approvedGuardians count during unlocking
    Collapsed/expanded behavior is purely local UI state (no backend)

Topbar:

    Notification bell badge count = notifications.filter(n => !n.read).length (from GET /v1/vaults/:vault/notifications)
    Profile widget shows connected wallet address (truncated) + role label
    Role label is derived from: if wallet = vault owner → "Vault Owner"; if in guardian list → "Guardian"; if in beneficiary list → "Beneficiary"; else → "Viewer"

7.2 Dashboard panel bindings
UI element	Real data source
"Total vault value" KPI	GET /v1/vaults/:vault/portfolio/summary → totalUsdValue
"Guardian approvals" KPI	approvedGuardians from vault summary read model
"Beneficiaries" KPI	totalBeneficiaries from vault summary read model
"Days since check-in"	daysSinceCheckIn from liveness read model
"Days remaining"	daysRemaining from liveness read model
Check-in health indicator	checkInHealth: 'healthy' | 'warning' | 'danger' from liveness read model
Portfolio history area chart	GET /v1/vaults/:vault/portfolio/history?range=30d
Asset distribution pie chart	GET /v1/vaults/:vault/portfolio/distribution
Recent activity list	GET /v1/vaults/:vault/activity?limit=10
Notifications list	GET /v1/vaults/:vault/notifications?limit=10&unread=true
7.3 Liveness health tiers (must be computed server-side and returned as enum)

The existing dashboard computes health client-side from fractions of the inactivity window. In production, the API read model must compute and return checkInHealth so the UI only renders it:
checkInHealth value	Rule
healthy	daysSinceCheckIn / inactivityDays < 0.5
warning	daysSinceCheckIn / inactivityDays < 0.8
danger	daysSinceCheckIn / inactivityDays >= 0.8
7.4 Distribution panel: "Create missing ATAs" toggle

When this toggle is enabled:

    The exec_dist_spl_batch tx builder must include ATA creation instructions for any beneficiary who does not yet have an ATA for the given mint.
    The UI must display a warning: "Enabling this option increases transaction size and fee. If the batch exceeds compute limits, reduce batch size."
    Batch size when createMissingAtas = true should default to a smaller value (e.g., 3 beneficiaries per batch instead of the standard 5).

7.5 Chart requirements

Portfolio history area chart (Dashboard):

    Series: total USD value per time unit
    X-axis: date labels
    Y-axis: USD value
    Range options: 30d, 90d, 1y (matching Dashboard UI range controls)
    Data source: GET /v1/vaults/:vault/portfolio/history?range=X

Asset distribution pie chart (Dashboard):

    Each slice = one asset (SOL or SPL token) with its % of total vault value
    Data source: GET /v1/vaults/:vault/portfolio/distribution

Liveness history bar chart (LivenessPanel):

    Each bar = one check-in event (slot timestamp)
    Optionally grouped by week/month for long ranges
    Data source: GET /v1/vaults/:vault/liveness/history?range=X

→ End of Phase 1


LEGACYVAULT — MASTERDOC.MD (Remastered v1.1)
Phase 2 of 3 — On-Chain Program & Off-Chain Services

Version: 1.1 Date: 2026-05-06 Continues from: Phase 1 (Product Definition, Principles, Actors, UI Contract, Flows, State Machine)
PHASE 2 — ON-CHAIN PROGRAM (ANCHOR) + OFF-CHAIN SERVICES
Section 8 — On-Chain Program (Anchor)
8.0 Program overview & governing rules

The LegacyVault Anchor program is the sole custodian of all assets and state. Every custody-affecting action (deposit, withdrawal, guardian add/remove, beneficiary management, unlock, distribution, finalization, freeze) must be executed by a signed instruction to this program. No off-chain service may move funds or mutate on-chain state.

Program ID: assigned at deployment; stored in declare_id!() in lib.rs and published in the SDK and API gateway config.

Upgrade authority: must be a multisig (Squads or equivalent) before mainnet deployment. Single-key upgrade authority is forbidden on mainnet.

Compute budget: all instructions that loop over accounts (distribution batches, multi-guardian checks) must be designed with explicit compute unit awareness. Where necessary, callers must prepend a ComputeBudgetProgram::setComputeUnitLimit instruction. The API tx-builder handles this automatically.

Token program compatibility: all SPL operations must support both spl-token (legacy) and spl-token-2022. The instruction context must accept the token program as an argument and validate it is one of the two known program IDs.
8.1 Program constants

Rust

// Basis points denominator — shares must sum to this
pub const BPS_DENOMINATOR: u16 = 10_000;

// Max string lengths (enforced at instruction validation time)
pub const MAX_NAME_LEN: usize = 64;
pub const MAX_URI_LEN: usize  = 256;
pub const MAX_HASH_LEN: usize = 64;    // hex-encoded SHA-256

// Subscription hard limits (enforced on-chain per tier)
pub const MAX_GUARDIANS_FREE:       u8  = 2;
pub const MAX_GUARDIANS_PRO:        u8  = 5;
pub const MAX_GUARDIANS_ENTERPRISE: u8  = 20;

pub const MAX_BENEFICIARIES_FREE:       u8  = 2;
pub const MAX_BENEFICIARIES_PRO:        u8  = 10;
pub const MAX_BENEFICIARIES_ENTERPRISE: u8  = 255;

pub const MAX_VAULTS_FREE:       u8 = 1;
pub const MAX_VAULTS_PRO:        u8 = 3;
pub const MAX_VAULTS_ENTERPRISE: u8 = 255;

// Distribution defaults
pub const DEFAULT_SOL_BATCH_SIZE: u8  = 5;
pub const DEFAULT_SPL_BATCH_SIZE: u8  = 5;
pub const SPL_BATCH_SIZE_WITH_ATA: u8 = 3;  // reduced when createMissingAtas = true

// Inactivity bounds (seconds)
pub const MIN_INACTIVITY_SECONDS: i64 = 60 * 60 * 24 * 30;   // 30 days
pub const MAX_INACTIVITY_SECONDS: i64 = 60 * 60 * 24 * 365;  // 365 days

// Timelock bounds (seconds)
pub const MIN_TIMELOCK_SECONDS: i64 = 60 * 60 * 24 * 1;   // 1 day
pub const MAX_TIMELOCK_SECONDS: i64 = 60 * 60 * 24 * 90;  // 90 days

8.2 PDA seed definitions (canonical — every service must derive addresses using these)

All PDAs are derived with Pubkey::find_program_address(&[seeds...], &program_id).

text

GlobalConfig
  seeds: [b"global_config"]
  owner:  program deployer / admin multisig

Vault
  seeds: [b"vault", owner_pubkey.as_ref()]
  Note:  one vault per owner per seed; extend with a nonce suffix
         [b"vault", owner_pubkey.as_ref(), &[vault_nonce]] for multi-vault support

VaultAuthority  (signer PDA — holds all assets)
  seeds: [b"vault_auth", vault_pubkey.as_ref()]

GuardianEntry
  seeds: [b"guardian", vault_pubkey.as_ref(), guardian_wallet.as_ref()]

BeneficiaryEntry
  seeds: [b"beneficiary", vault_pubkey.as_ref(), beneficiary_wallet.as_ref()]

AssetRule
  seeds: [b"asset_rule", vault_pubkey.as_ref(),
          beneficiary_wallet.as_ref(), mint_pubkey.as_ref()]

LivenessDelegate
  seeds: [b"delegate", vault_pubkey.as_ref(), delegate_wallet.as_ref()]

UnlockSession
  seeds: [b"unlock_session", vault_pubkey.as_ref()]
  Note:  one active unlock session per vault at a time

GuardianApproval
  seeds: [b"approval", unlock_session_pubkey.as_ref(),
          guardian_wallet.as_ref()]

SolDistributionSession
  seeds: [b"dist_sol", unlock_session_pubkey.as_ref()]

SplDistributionSession
  seeds: [b"dist_spl", unlock_session_pubkey.as_ref(),
          mint_pubkey.as_ref()]

DisputeCase
  seeds: [b"dispute", unlock_session_pubkey.as_ref()]

SubscriptionState
  seeds: [b"subscription", vault_pubkey.as_ref()]

ProfessionalGuardianProfile
  seeds: [b"pro_guardian", guardian_wallet.as_ref()]

ProfessionalGuardianBond
  seeds: [b"pro_bond", vault_pubkey.as_ref(), guardian_wallet.as_ref()]

8.3 Enums

Rust

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum VaultStatus {
    Active,       // UI: "locked"
    Unlocking,    // UI: "unlocking"
    Executing,    // UI: "unlocked"
    Distributed,  // UI: "distributed"
    Frozen,       // UI: "frozen"
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
pub enum GuardianRole {
    Personal,
    Professional,
    Delegate,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum GuardianStatus {
    Pending,
    Active,
    Inactive,
    Removed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum AssetRuleMode {
    ProRata,
    FixedBps,
    EntireToBeneficiary,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum SubscriptionTier {
    Free,
    Pro,
    Enterprise,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum DisputeStatus {
    Open,
    ResolvedCancel,
    ResolvedProceed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum KycStatus {
    Unverified,
    Pending,
    Verified,
    Revoked,
}

8.4 Account structs
8.4.1 GlobalConfig

Rust

#[account]
pub struct GlobalConfig {
    pub admin: Pubkey,           // admin multisig
    pub paused: bool,            // global kill switch
    pub fee_receiver: Pubkey,    // receives protocol fees
    pub creation_fee_lamports: u64,
    pub subscription_fee_pro_lamports: u64,
    pub subscription_fee_enterprise_lamports: u64,
    pub max_guardians_free: u8,
    pub max_guardians_pro: u8,
    pub max_guardians_enterprise: u8,
    pub max_beneficiaries_free: u8,
    pub max_beneficiaries_pro: u8,
    pub max_beneficiaries_enterprise: u8,
    pub bump: u8,
}

8.4.2 Vault

Rust

#[account]
pub struct Vault {
    pub owner: Pubkey,
    pub vault_nonce: u8,               // supports multi-vault per owner
    pub status: VaultStatus,
    pub bump: u8,
    pub authority_bump: u8,

    // Liveness
    pub created_at: i64,               // Unix timestamp
    pub last_check_in: i64,
    pub inactivity_threshold: i64,     // seconds; min 30d, max 365d

    // Timelock
    pub timelock_duration: i64,        // seconds; min 1d, max 90d

    // Guardian config
    pub guardian_threshold: u8,
    pub guardian_count: u8,

    // Beneficiary config
    pub beneficiary_count: u8,
    pub total_bps: u16,                // must equal 10_000 to allow distribution

    // Safety
    pub panic_freeze: bool,
    pub frozen_by: Option<Pubkey>,
    pub frozen_at: Option<i64>,

    // Document commitment (latest)
    pub doc_hash: [u8; 64],            // hex SHA-256 of ciphertext
    pub doc_uri: [u8; 256],            // off-chain storage URI
    pub doc_updated_at: i64,

    // Optional arbiter
    pub arbiter: Option<Pubkey>,

    // Counters for PDA derivation / indexing
    pub unlock_session_count: u32,
    pub distribution_nonce: u32,

    // Subscription reference
    pub subscription_tier: SubscriptionTier,

    // Reserved padding for future fields (avoids realloc)
    pub _reserved: [u8; 64],
}

8.4.3 GuardianEntry

Rust

#[account]
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

8.4.4 BeneficiaryEntry

Rust

#[account]
pub struct BeneficiaryEntry {
    pub vault: Pubkey,
    pub beneficiary_wallet: Pubkey,
    pub share_bps: u16,
    pub active: bool,
    pub added_at: i64,
    pub updated_at: i64,
    pub bump: u8,
    pub _reserved: [u8; 16],
}

8.4.5 AssetRule

Rust

#[account]
pub struct AssetRule {
    pub vault: Pubkey,
    pub beneficiary_wallet: Pubkey,
    pub mint: Pubkey,
    pub mode: AssetRuleMode,
    pub fixed_bps: Option<u16>,       // used when mode = FixedBps
    pub bump: u8,
    pub _reserved: [u8; 8],
}

8.4.6 LivenessDelegate

Rust

#[account]
pub struct LivenessDelegate {
    pub vault: Pubkey,
    pub delegate_wallet: Pubkey,
    pub added_at: i64,
    pub active: bool,
    pub bump: u8,
}

8.4.7 UnlockSession

Rust

#[account]
pub struct UnlockSession {
    pub vault: Pubkey,
    pub initiated_by: Pubkey,          // guardian who initiated
    pub status: UnlockSessionStatus,
    pub initiated_at: i64,
    pub approved_at: Option<i64>,      // when M-of-N threshold was met
    pub timelock_started_at: Option<i64>,
    pub timelock_ends_at: Option<i64>, // approved_at + timelock_duration
    pub executed_at: Option<i64>,
    pub cancelled_at: Option<i64>,
    pub approval_count: u8,
    pub bump: u8,
    pub _reserved: [u8; 16],
}

8.4.8 GuardianApproval

Rust

#[account]
pub struct GuardianApproval {
    pub unlock_session: Pubkey,
    pub guardian_wallet: Pubkey,
    pub approved_at: i64,
    pub bump: u8,
}

8.4.9 SolDistributionSession

Rust

#[account]
pub struct SolDistributionSession {
    pub unlock_session: Pubkey,
    pub vault: Pubkey,
    pub total_beneficiaries: u8,
    pub cursor: u8,                    // next beneficiary index to process
    pub total_lamports: u64,           // vault SOL balance at session init
    pub distributed_lamports: u64,     // running total paid out
    pub initialized_at: i64,
    pub completed_at: Option<i64>,
    pub bump: u8,
    pub _reserved: [u8; 8],
}

8.4.10 SplDistributionSession

Rust

#[account]
pub struct SplDistributionSession {
    pub unlock_session: Pubkey,
    pub vault: Pubkey,
    pub mint: Pubkey,
    pub total_beneficiaries: u8,
    pub cursor: u8,
    pub total_amount: u64,             // vault token balance at session init
    pub distributed_amount: u64,
    pub create_missing_atas: bool,
    pub initialized_at: i64,
    pub completed_at: Option<i64>,
    pub bump: u8,
    pub _reserved: [u8; 8],
}

8.4.11 DisputeCase

Rust

#[account]
pub struct DisputeCase {
    pub unlock_session: Pubkey,
    pub vault: Pubkey,
    pub opened_by: Pubkey,
    pub status: DisputeStatus,
    pub opened_at: i64,
    pub resolved_at: Option<i64>,
    pub resolved_by: Option<Pubkey>,
    pub resolution_note_hash: Option<[u8; 64]>,  // hash of off-chain resolution doc
    pub bump: u8,
    pub _reserved: [u8; 16],
}

8.4.12 SubscriptionState

Rust

#[account]
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

8.4.13 ProfessionalGuardianProfile

Rust

#[account]
pub struct ProfessionalGuardianProfile {
    pub guardian_wallet: Pubkey,
    pub kyc_status: KycStatus,
    pub reputation_score: u16,         // 0–10000 (basis points style)
    pub total_vaults_served: u32,
    pub active_vault_count: u16,
    pub registered_at: i64,
    pub kyc_updated_at: Option<i64>,
    pub name_hash: [u8; 64],           // hash of off-chain name (not stored on-chain)
    pub profile_uri: [u8; 256],        // off-chain profile metadata URI
    pub bump: u8,
    pub _reserved: [u8; 16],
}

8.4.14 ProfessionalGuardianBond

Rust

#[account]
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

8.5 Complete instruction set

Instructions are grouped by functional module. Each instruction includes:

    Signer(s): who must sign
    Accounts: key accounts passed (beyond standard PDAs)
    Validation: what the instruction must check before executing
    Mutations: what on-chain state it changes
    Emits: which event it fires

MODULE A — Global admin
A1. initialize_global_config

    Signer: deployer
    Accounts: GlobalConfig (init), deployer
    Validation: GlobalConfig must not already exist
    Mutations: Sets all GlobalConfig fields from instruction args
    Emits: GlobalConfigInitialized

A2. update_global_config

    Signer: admin
    Accounts: GlobalConfig (mut)
    Validation: Signer == global_config.admin
    Mutations: Updates fee fields, limits, paused flag
    Emits: GlobalConfigUpdated

A3. pause_program / A4. unpause_program

    Signer: admin
    Accounts: GlobalConfig (mut)
    Mutations: Sets global_config.paused to true/false
    Emits: ProgramPaused / ProgramUnpaused

MODULE B — Vault lifecycle
B1. create_vault

    Signer: owner
    Accounts: Vault (init), VaultAuthority (init, seeds-only PDA), SubscriptionState (init), GlobalConfig
    Args: vault_nonce: u8, inactivity_threshold: i64, timelock_duration: i64, guardian_threshold: u8
    Validation:
        Program not paused
        inactivity_threshold within [MIN_INACTIVITY_SECONDS, MAX_INACTIVITY_SECONDS]
        timelock_duration within [MIN_TIMELOCK_SECONDS, MAX_TIMELOCK_SECONDS]
        guardian_threshold >= 1
        Owner has not exceeded vault count for their subscription tier
    Mutations: Initializes Vault with status = Active, last_check_in = now, created_at = now; initializes SubscriptionState with tier = Free; transfers creation fee to fee_receiver
    Emits: VaultCreated

B2. update_vault_settings

    Signer: owner
    Accounts: Vault (mut)
    Args: optional inactivity_threshold, timelock_duration, guardian_threshold, arbiter
    Validation:
        Signer == vault.owner
        Vault status is Active (not Unlocking/Frozen/Distributed)
        Any provided threshold within bounds
        guardian_threshold <= vault.guardian_count (cannot set threshold higher than existing guardian count)
    Mutations: Updates provided fields; sets updated_at
    Emits: VaultSettingsUpdated

B3. freeze_vault

    Signer: owner
    Accounts: Vault (mut)
    Validation:
        Signer == vault.owner
        Vault status is not Distributed
        Records prior status (stored externally or in reserved bytes) to restore on unfreeze
    Mutations: vault.status = Frozen, vault.panic_freeze = true, vault.frozen_by = signer, vault.frozen_at = now
    Emits: VaultFrozen

B4. unfreeze_vault

    Signer: owner
    Accounts: Vault (mut)
    Validation:
        Signer == vault.owner
        Vault status is Frozen
    Mutations: Restores vault to prior status (Active or Unlocking based on whether unlock session exists)
    Emits: VaultUnfrozen

MODULE C — Guardians
C1. add_guardian

    Signer: owner
    Accounts: Vault (mut), GuardianEntry (init), optional ProfessionalGuardianProfile (read-only if role = Professional)
    Args: guardian_wallet: Pubkey, role: GuardianRole
    Validation:
        Signer == vault.owner
        Vault not frozen or distributed
        vault.guardian_count < max_guardians_for_tier
        GuardianEntry PDA does not already exist for this wallet + vault
        If role = Professional: ProfessionalGuardianProfile must exist with kyc_status = Verified
    Mutations: Initializes GuardianEntry with status = Pending; increments vault.guardian_count
    Emits: GuardianAdded

C2. accept_guardian_invitation

    Signer: guardian_wallet
    Accounts: GuardianEntry (mut)
    Validation:
        Signer == guardian_entry.guardian_wallet
        guardian_entry.status == Pending
    Mutations: guardian_entry.status = Active, accepted_at = now
    Emits: GuardianAccepted

C3. remove_guardian

    Signer: owner
    Accounts: Vault (mut), GuardianEntry (mut)
    Validation:
        Signer == vault.owner
        Cannot remove a guardian if vault is Unlocking and their removal would drop approvals below threshold
        vault.guardian_threshold <= vault.guardian_count - 1 (result must still be achievable)
    Mutations: guardian_entry.status = Removed, removed_at = now; decrements vault.guardian_count
    Emits: GuardianRemoved

C4. set_guardian_threshold

    Signer: owner
    Accounts: Vault (mut)
    Args: threshold: u8
    Validation:
        1 <= threshold <= vault.guardian_count
        Vault not in Unlocking/Executing/Distributed/Frozen
    Mutations: vault.guardian_threshold = threshold
    Emits: GuardianThresholdUpdated

MODULE D — Beneficiaries
D1. add_beneficiary

    Signer: owner
    Accounts: Vault (mut), BeneficiaryEntry (init)
    Args: beneficiary_wallet: Pubkey, share_bps: u16, active: bool
    Validation:
        Signer == vault.owner
        Vault not Unlocking/Executing/Distributed/Frozen
        vault.beneficiary_count < max_beneficiaries_for_tier
        BeneficiaryEntry does not already exist for this wallet + vault
        share_bps > 0
    Mutations: Initializes BeneficiaryEntry; increments vault.beneficiary_count; updates vault.total_bps
    Emits: BeneficiaryAdded

D2. update_beneficiary

    Signer: owner
    Accounts: Vault (mut), BeneficiaryEntry (mut)
    Args: optional share_bps, optional active
    Validation:
        Signer == vault.owner
        Vault not Unlocking/Executing/Distributed
    Mutations: Updates fields; recalculates and updates vault.total_bps
    Emits: BeneficiaryUpdated

D3. remove_beneficiary

    Signer: owner
    Accounts: Vault (mut), BeneficiaryEntry (mut, close → owner)
    Validation:
        Signer == vault.owner
        Vault not Unlocking/Executing/Distributed
    Mutations: Closes BeneficiaryEntry; decrements vault.beneficiary_count; recalculates vault.total_bps
    Emits: BeneficiaryRemoved

D4. set_asset_rule

    Signer: owner
    Accounts: Vault, BeneficiaryEntry, AssetRule (init or mut)
    Args: mint: Pubkey, mode: AssetRuleMode, fixed_bps: Option<u16>
    Validation:
        Signer == vault.owner
        If mode = FixedBps: fixed_bps must be Some(v) where v > 0 && v <= 10000
    Mutations: Initializes or updates AssetRule
    Emits: AssetRuleSet

D5. clear_asset_rule

    Signer: owner
    Accounts: Vault, AssetRule (mut, close → owner)
    Mutations: Closes AssetRule account
    Emits: AssetRuleCleared

MODULE E — Asset deposits & withdrawals
E1. deposit_sol

    Signer: depositor (any wallet — not owner-restricted for deposits)
    Accounts: Vault, VaultAuthority (mut), system_program
    Args: lamports: u64
    Validation:
        Vault not Frozen or Distributed
        lamports > 0
    Mutations: Transfers lamports from depositor to VaultAuthority
    Emits: Deposited { asset_type: SOL, amount: lamports }

E2. deposit_spl

    Signer: depositor
    Accounts: Vault, VaultAuthority, depositor_token_account (mut), vault_token_account (mut, vault auth is owner), mint, token_program
    Args: amount: u64
    Validation:
        Vault not Frozen or Distributed
        Token program is spl-token or spl-token-2022
        amount > 0
    Mutations: token::transfer from depositor to vault token account
    Emits: Deposited { asset_type: SPL, mint, amount }

E3. withdraw_sol

    Signer: owner
    Accounts: Vault, VaultAuthority (mut), owner (mut)
    Args: lamports: u64
    Validation:
        Signer == vault.owner
        Vault status is Active only (blocked during Unlocking/Executing/Frozen/Distributed)
        VaultAuthority lamports after withdrawal must cover rent exemption of all open PDAs (leave minimum buffer)
    Mutations: VaultAuthority transfers lamports to owner via PDA CPI
    Emits: Withdrawn { asset_type: SOL, amount: lamports }

E4. withdraw_spl

    Signer: owner
    Accounts: Vault, VaultAuthority, vault_token_account (mut), owner_token_account (mut), token_program
    Args: amount: u64
    Validation:
        Signer == vault.owner
        Vault status is Active
    Mutations: token::transfer from vault to owner via VaultAuthority PDA signer
    Emits: Withdrawn { asset_type: SPL, mint, amount }

MODULE F — Liveness
F1. check_in

    Signer: owner OR active liveness delegate
    Accounts: Vault (mut), optional LivenessDelegate (if signer is not owner)
    Validation:
        If signer != owner: LivenessDelegate must exist for signer with active = true and vault must match
        Vault status is Active (cannot check in while Frozen/Unlocking/Executing/Distributed)
    Mutations: vault.last_check_in = now
    Emits: CheckIn { vault, signed_by, timestamp: now }

F2. add_liveness_delegate

    Signer: owner
    Accounts: Vault, LivenessDelegate (init)
    Args: delegate_wallet: Pubkey
    Validation: Signer == owner; vault not Distributed
    Mutations: Initializes LivenessDelegate with active = true
    Emits: LivenessDelegateAdded

F3. remove_liveness_delegate

    Signer: owner
    Accounts: Vault, LivenessDelegate (mut, close → owner)
    Mutations: Closes LivenessDelegate account
    Emits: LivenessDelegateRemoved

MODULE G — Documents
G1. set_document_commitment

    Signer: owner
    Accounts: Vault (mut)
    Args: doc_hash: [u8; 64], doc_uri: [u8; 256]
    Validation:
        Signer == vault.owner
        Vault not Distributed
        doc_hash is non-zero
        doc_uri length within MAX_URI_LEN
    Mutations: vault.doc_hash = doc_hash, vault.doc_uri = doc_uri, vault.doc_updated_at = now
    Emits: DocumentSet { vault, doc_hash, doc_uri, timestamp: now }

G2. revoke_document_commitment

    Signer: owner
    Accounts: Vault (mut)
    Validation:
        Signer == vault.owner
        vault.doc_hash is non-zero (commitment must exist)
    Mutations: Zeroes vault.doc_hash and vault.doc_uri; sets vault.doc_updated_at = now
    Emits: DocumentRevoked { vault, timestamp: now }

MODULE H — Unlock
H1. initiate_unlock

    Signer: any active guardian (role = Personal or Professional — not Delegate)
    Accounts: Vault (mut), GuardianEntry (read-only), UnlockSession (init)
    Validation:
        Vault status is Active
        GuardianEntry for signer exists with status = Active and role != Delegate
        now >= vault.last_check_in + vault.inactivity_threshold
        Program not globally paused
    Mutations: Initializes UnlockSession with status = Proposed, initiated_by = signer, initiated_at = now; sets vault.status = Unlocking
    Emits: UnlockInitiated { vault, unlock_session, initiated_by, initiated_at }

H2. approve_unlock

    Signer: guardian
    Accounts: Vault (mut), GuardianEntry, UnlockSession (mut), GuardianApproval (init)
    Validation:
        unlock_session.status == Proposed
        GuardianEntry for signer is Active and role != Delegate
        GuardianApproval PDA does not already exist for this guardian + session (prevents double-approval)
        Vault status is Unlocking
    Mutations:
        Initializes GuardianApproval with approved_at = now
        Increments unlock_session.approval_count
        If approval_count >= vault.guardian_threshold:
            unlock_session.status = Approved
            unlock_session.approved_at = now
            unlock_session.timelock_started_at = now
            unlock_session.timelock_ends_at = now + vault.timelock_duration
    Emits: UnlockApproved { vault, unlock_session, guardian, approval_count }; if threshold met: also UnlockThresholdMet

H3. cancel_unlock

    Signer: owner
    Accounts: Vault (mut), UnlockSession (mut)
    Validation:
        Signer == vault.owner
        unlock_session.status is Proposed OR Approved (within timelock window)
        If status == Executing: cannot cancel (distribution has begun)
    Mutations: unlock_session.status = Cancelled, cancelled_at = now; vault.status = Active
    Emits: UnlockCancelled { vault, unlock_session, cancelled_by: owner }

H4. open_dispute

    Signer: owner OR arbiter
    Accounts: Vault, UnlockSession (mut), DisputeCase (init)
    Validation:
        unlock_session.status is Approved or Executing
        DisputeCase does not already exist
        vault.arbiter is Some(pubkey) and signer is owner or arbiter
    Mutations: Initializes DisputeCase; unlock_session.status = Disputed
    Emits: DisputeOpened

H5. resolve_dispute

    Signer: arbiter
    Accounts: Vault (mut), UnlockSession (mut), DisputeCase (mut)
    Args: resolution: DisputeStatus (ResolvedCancel or ResolvedProceed), resolution_note_hash: Option<[u8; 64]>
    Validation:
        Signer == vault.arbiter.unwrap()
        dispute_case.status == Open
    Mutations:
        dispute_case.status = resolution, resolved_at = now, resolved_by = signer
        If ResolvedCancel: unlock_session.status = Cancelled; vault.status = Active
        If ResolvedProceed: unlock_session.status = Executing
    Emits: DisputeResolved

MODULE I — Distribution

This module is the most compute-sensitive. All distribution instructions use remaining accounts with a canonical layout defined below.
Canonical beneficiary ordering rule:

    All distribution batches MUST process beneficiaries in ascending order of their beneficiary_wallet pubkey bytes (lexicographic sort on [u8; 32]). This ordering is computed off-chain by the tx-builder and enforced on-chain by verifying that each beneficiary entry's wallet address sorts after the previous one within a batch and that start_index matches the current session cursor.

Remaining accounts layout — SOL batch:

text

For each beneficiary in batch (2 accounts each):
  [2i]     BeneficiaryEntry PDA (read-only)
  [2i+1]   Beneficiary wallet (mut, receives lamports)

Remaining accounts layout — SPL batch:

text

For each beneficiary in batch (3 accounts each):
  [3i]     BeneficiaryEntry PDA (read-only)
  [3i+1]   Beneficiary wallet (read-only, used to derive ATA)
  [3i+2]   Beneficiary ATA for mint (mut, receives tokens)
  
  If createMissingAtas = true, also pass:
  Associated Token Program + System Program in fixed positions after batch accounts

I1. init_sol_distribution

    Signer: owner
    Accounts: Vault, UnlockSession, SolDistributionSession (init)
    Validation:
        vault.status == Executing (i.e., timelock elapsed: now >= unlock_session.timelock_ends_at)
        unlock_session.status == Approved
        vault.total_bps == 10_000 (shares must sum to exactly 10,000)
        No existing SolDistributionSession for this unlock session
    Mutations:
        unlock_session.status = Executing
        Initializes SolDistributionSession with cursor = 0, total_beneficiaries = vault.beneficiary_count (active), total_lamports = VaultAuthority.lamports - rent_reserve
    Emits: SolDistributionInitialized

I2. execute_sol_batch

    Signer: owner (or designated executor — defined in future release)
    Accounts: Vault, VaultAuthority (mut), UnlockSession, SolDistributionSession (mut), system_program + remaining accounts (per layout above)
    Args: start_index: u8, batch_size: u8
    Validation:
        start_index == sol_dist_session.cursor (must continue from cursor; no gaps)
        start_index + batch_size <= sol_dist_session.total_beneficiaries
        Each BeneficiaryEntry in remaining accounts is active and belongs to this vault
        Beneficiary wallets in remaining accounts sort correctly (ascending pubkey order)
        Vault not Frozen
    Mutations:
        For each beneficiary:
            Compute share: lamports = (entry.share_bps as u64 * total_lamports) / 10_000
            Remainder (rounding) allocated to last beneficiary in final batch only
            Transfer lamports from VaultAuthority to beneficiary wallet via PDA CPI
            Accumulate sol_dist_session.distributed_lamports
        Advance sol_dist_session.cursor += batch_size
        If cursor == total_beneficiaries: sol_dist_session.completed_at = now
    Emits: SolBatchExecuted { start_index, batch_size, amount_distributed }

I3. init_spl_distribution

    Signer: owner
    Accounts: Vault, UnlockSession, VaultAuthority, vault_token_account (for mint), SplDistributionSession (init), mint, token_program
    Args: mint: Pubkey, create_missing_atas: bool
    Validation:
        vault.status == Executing
        unlock_session.status == Executing (already set by init_sol_distribution or directly)
        No existing SplDistributionSession for this unlock session + mint
        vault.total_bps == 10_000
    Mutations: Initializes SplDistributionSession with cursor = 0, total_amount = vault_token_account.amount, create_missing_atas
    Emits: SplDistributionInitialized { mint }

I4. execute_spl_batch

    Signer: owner
    Accounts: Vault, VaultAuthority, UnlockSession, SplDistributionSession (mut), vault_token_account (mut), mint, token_program, (if createMissingAtas: ata_program, system_program) + remaining accounts (per layout above)
    Args: start_index: u8, batch_size: u8
    Validation:
        Same cursor, ordering, and vault checks as execute_sol_batch
        If create_missing_atas = true and ATA does not exist: creates it (charges payer = signer)
        For each beneficiary: check AssetRule for this mint; apply override mode if exists, else use share_bps
    Mutations:
        For each beneficiary: compute amount per AssetRule/share; transfer tokens via PDA CPI
        Remainder allocated to last beneficiary in final batch (same as SOL)
        Advance cursor; set completed_at if done
    Emits: SplBatchExecuted { mint, start_index, batch_size, amount_distributed }

I5. finalize_unlock

    Signer: owner
    Accounts: Vault (mut), UnlockSession (mut), SolDistributionSession, all SplDistributionSessions (remaining accounts), optional DisputeCase
    Validation:
        unlock_session.status == Executing
        sol_dist_session.completed_at is Some(_) (SOL fully distributed)
        All SplDistributionSessions passed in remaining accounts have completed_at is Some(_)
        No open DisputeCase (dispute_case.status != Open) if DisputeCase account is passed
    Mutations:
        vault.status = Distributed
        unlock_session.status = Executed
        unlock_session.executed_at = now
    Emits: UnlockFinalized { vault, unlock_session, executed_at }

MODULE J — Subscription
J1. set_subscription

    Signer: owner
    Accounts: Vault (mut), SubscriptionState (mut), GlobalConfig, fee_receiver (mut)
    Args: tier: SubscriptionTier, duration_seconds: i64
    Validation:
        Signer == vault.owner
        Fee matches tier × duration
        If downgrading: current guardian/beneficiary counts must not exceed new tier limits
    Mutations: Updates SubscriptionState; transfers fee; updates vault.subscription_tier
    Emits: SubscriptionUpdated

MODULE K — Professional guardians
K1. register_professional_guardian

    Signer: guardian
    Accounts: ProfessionalGuardianProfile (init)
    Args: name_hash: [u8; 64], profile_uri: [u8; 256]
    Mutations: Initializes profile with kyc_status = Unverified
    Emits: ProfessionalGuardianRegistered

K2. set_kyc_status

    Signer: admin
    Accounts: GlobalConfig, ProfessionalGuardianProfile (mut)
    Args: status: KycStatus
    Mutations: Updates kyc_status and kyc_updated_at
    Emits: ProfessionalGuardianKycUpdated

K3. bond_for_vault

    Signer: guardian
    Accounts: Vault, GuardianEntry, ProfessionalGuardianBond (init), VaultAuthority
    Args: bond_lamports: u64
    Validation: GuardianEntry exists, role = Professional, KYC = Verified
    Mutations: Transfers lamports from guardian to a bond escrow (PDA); initializes ProfessionalGuardianBond
    Emits: GuardianBonded

K4. slash_bond

    Signer: admin
    Accounts: GlobalConfig, ProfessionalGuardianBond (mut), fee_receiver (mut)
    Args: slash_reason_hash: [u8; 64]
    Mutations: Transfers bond lamports to fee_receiver; sets slashed = true
    Emits: GuardianSlashed

8.6 Error codes

Rust

#[error_code]
pub enum LegacyVaultError {
    // Auth
    Unauthorized,                    // 6000
    SignerIsNotOwner,                // 6001
    SignerIsNotGuardian,             // 6002
    SignerIsNotArbiter,              // 6003
    SignerIsNotAdmin,                // 6004

    // Program state
    ProgramPaused,                   // 6005

    // Vault state
    VaultNotActive,                  // 6006
    VaultNotUnlocking,               // 6007
    VaultNotExecuting,               // 6008
    VaultFrozen,                     // 6009
    VaultAlreadyDistributed,         // 6010
    VaultAlreadyExists,              // 6011

    // Thresholds & bounds
    InactivityThresholdTooLow,       // 6012
    InactivityThresholdTooHigh,      // 6013
    TimelockTooShort,                // 6014
    TimelockTooLong,                 // 6015
    GuardianThresholdZero,           // 6016
    GuardianThresholdExceedsCount,   // 6017
    SharesNotTenThousand,            // 6018
    InvalidShareBps,                 // 6019
    InvalidFixedBps,                 // 6020

    // Subscription limits
    GuardianLimitReached,            // 6021
    BeneficiaryLimitReached,         // 6022
    VaultLimitReached,               // 6023
    SubscriptionExpired,             // 6024
    DowngradeExceedsLimits,         // 6025

    // Guardian / unlock
    GuardianNotActive,               // 6026
    GuardianAlreadyApproved,         // 6027
    DelegateCannotApprove,           // 6028
    UnlockNotEligible,               // 6029  (inactivity threshold not met)
    UnlockSessionNotProposed,        // 6030
    UnlockSessionNotApproved,        // 6031
    TimelockNotElapsed,              // 6032
    UnlockAlreadyExecuting,          // 6033
    CannotCancelExecuting,           // 6034

    // Distribution
    SolSessionNotComplete,           // 6035
    SplSessionNotComplete,           // 6036
    OpenDisputeBlocksFinalize,       // 6037
    InvalidBatchCursor,              // 6038
    InvalidBeneficiaryOrder,         // 6039
    InvalidRemainingAccounts,        // 6040
    AtaCreationFailed,               // 6041
    InsufficientFunds,               // 6042

    // Math
    MathOverflow,                    // 6043
    MathUnderflow,                   // 6044
    DivisionByZero,                  // 6045

    // Token
    InvalidTokenProgram,             // 6046
    InvalidTokenAccount,             // 6047
    InvalidMint,                     // 6048

    // Documents
    DocumentHashEmpty,               // 6049
    DocumentUriTooLong,              // 6050
    NoDocumentCommitment,            // 6051

    // Professional guardians
    KycNotVerified,                  // 6052
    GuardianNotProfessional,         // 6053
    AlreadySlashed,                  // 6054

    // Dispute
    DisputeAlreadyOpen,              // 6055
    DisputeNotOpen,                  // 6056
    NoArbiterConfigured,             // 6057
    InvalidDisputeResolution,        // 6058

    // General
    StringTooLong,                   // 6059
    InvalidPda,                      // 6060
    AccountAlreadyInitialized,       // 6061
    InvalidFeePaid,                  // 6062
}

8.7 Events (on-chain — emitted via emit!())

Every event is indexed by the indexer and mapped to an activity log entry or notification trigger.

Rust

// Global
#[event] pub struct GlobalConfigInitialized { pub admin: Pubkey }
#[event] pub struct GlobalConfigUpdated { pub admin: Pubkey }
#[event] pub struct ProgramPaused { pub admin: Pubkey, pub timestamp: i64 }
#[event] pub struct ProgramUnpaused { pub admin: Pubkey, pub timestamp: i64 }

// Vault
#[event] pub struct VaultCreated {
    pub vault: Pubkey, pub owner: Pubkey,
    pub inactivity_threshold: i64, pub timelock_duration: i64,
    pub guardian_threshold: u8, pub timestamp: i64
}
#[event] pub struct VaultSettingsUpdated {
    pub vault: Pubkey, pub owner: Pubkey, pub timestamp: i64
}
#[event] pub struct VaultFrozen {
    pub vault: Pubkey, pub frozen_by: Pubkey, pub timestamp: i64
}
#[event] pub struct VaultUnfrozen {
    pub vault: Pubkey, pub unfrozen_by: Pubkey, pub timestamp: i64
}

// Guardians
#[event] pub struct GuardianAdded {
    pub vault: Pubkey, pub guardian: Pubkey,
    pub role: GuardianRole, pub timestamp: i64
}
#[event] pub struct GuardianAccepted {
    pub vault: Pubkey, pub guardian: Pubkey, pub timestamp: i64
}
#[event] pub struct GuardianRemoved {
    pub vault: Pubkey, pub guardian: Pubkey, pub timestamp: i64
}
#[event] pub struct GuardianThresholdUpdated {
    pub vault: Pubkey, pub new_threshold: u8, pub timestamp: i64
}

// Beneficiaries
#[event] pub struct BeneficiaryAdded {
    pub vault: Pubkey, pub beneficiary: Pubkey,
    pub share_bps: u16, pub timestamp: i64
}
#[event] pub struct BeneficiaryUpdated {
    pub vault: Pubkey, pub beneficiary: Pubkey,
    pub share_bps: u16, pub active: bool, pub timestamp: i64
}
#[event] pub struct BeneficiaryRemoved {
    pub vault: Pubkey, pub beneficiary: Pubkey, pub timestamp: i64
}
#[event] pub struct AssetRuleSet {
    pub vault: Pubkey, pub beneficiary: Pubkey,
    pub mint: Pubkey, pub mode: AssetRuleMode, pub timestamp: i64
}
#[event] pub struct AssetRuleCleared {
    pub vault: Pubkey, pub beneficiary: Pubkey,
    pub mint: Pubkey, pub timestamp: i64
}

// Assets
#[event] pub struct Deposited {
    pub vault: Pubkey, pub depositor: Pubkey,
    pub asset_type: String, pub mint: Option<Pubkey>,
    pub amount: u64, pub timestamp: i64
}
#[event] pub struct Withdrawn {
    pub vault: Pubkey, pub owner: Pubkey,
    pub asset_type: String, pub mint: Option<Pubkey>,
    pub amount: u64, pub timestamp: i64
}

// Liveness
#[event] pub struct CheckIn {
    pub vault: Pubkey, pub signed_by: Pubkey, pub timestamp: i64
}
#[event] pub struct LivenessDelegateAdded {
    pub vault: Pubkey, pub delegate: Pubkey, pub timestamp: i64
}
#[event] pub struct LivenessDelegateRemoved {
    pub vault: Pubkey, pub delegate: Pubkey, pub timestamp: i64
}

// Documents
#[event] pub struct DocumentSet {
    pub vault: Pubkey, pub doc_hash: [u8; 64],
    pub doc_uri: [u8; 256], pub timestamp: i64
}
#[event] pub struct DocumentRevoked {
    pub vault: Pubkey, pub timestamp: i64
}

// Unlock
#[event] pub struct UnlockInitiated {
    pub vault: Pubkey, pub unlock_session: Pubkey,
    pub initiated_by: Pubkey, pub timestamp: i64
}
#[event] pub struct UnlockApproved {
    pub vault: Pubkey, pub unlock_session: Pubkey,
    pub guardian: Pubkey, pub approval_count: u8, pub timestamp: i64
}
#[event] pub struct UnlockThresholdMet {
    pub vault: Pubkey, pub unlock_session: Pubkey,
    pub timelock_ends_at: i64, pub timestamp: i64
}
#[event] pub struct UnlockCancelled {
    pub vault: Pubkey, pub unlock_session: Pubkey,
    pub cancelled_by: Pubkey, pub timestamp: i64
}
#[event] pub struct DisputeOpened {
    pub vault: Pubkey, pub unlock_session: Pubkey,
    pub opened_by: Pubkey, pub timestamp: i64
}
#[event] pub struct DisputeResolved {
    pub vault: Pubkey, pub unlock_session: Pubkey,
    pub resolved_by: Pubkey, pub resolution: DisputeStatus, pub timestamp: i64
}

// Distribution
#[event] pub struct SolDistributionInitialized {
    pub vault: Pubkey, pub unlock_session: Pubkey,
    pub total_beneficiaries: u8, pub total_lamports: u64, pub timestamp: i64
}
#[event] pub struct SolBatchExecuted {
    pub vault: Pubkey, pub start_index: u8,
    pub batch_size: u8, pub amount_distributed: u64, pub timestamp: i64
}
#[event] pub struct SplDistributionInitialized {
    pub vault: Pubkey, pub unlock_session: Pubkey, pub mint: Pubkey,
    pub total_beneficiaries: u8, pub total_amount: u64, pub timestamp: i64
}
#[event] pub struct SplBatchExecuted {
    pub vault: Pubkey, pub mint: Pubkey, pub start_index: u8,
    pub batch_size: u8, pub amount_distributed: u64, pub timestamp: i64
}
#[event] pub struct UnlockFinalized {
    pub vault: Pubkey, pub unlock_session: Pubkey,
    pub executed_at: i64
}

// Subscription
#[event] pub struct SubscriptionUpdated {
    pub vault: Pubkey, pub tier: SubscriptionTier,
    pub expires_at: i64, pub timestamp: i64
}

// Professional guardians
#[event] pub struct ProfessionalGuardianRegistered {
    pub guardian: Pubkey, pub timestamp: i64
}
#[event] pub struct ProfessionalGuardianKycUpdated {
    pub guardian: Pubkey, pub status: KycStatus, pub timestamp: i64
}
#[event] pub struct GuardianBonded {
    pub vault: Pubkey, pub guardian: Pubkey,
    pub bond_lamports: u64, pub timestamp: i64
}
#[event] pub struct GuardianSlashed {
    pub vault: Pubkey, pub guardian: Pubkey,
    pub slash_amount: u64, pub timestamp: i64
}

Section 9 — Off-Chain Services

The dashboard cannot display charts, enriched asset metadata, notification histories, or portfolio analytics from on-chain accounts alone. The following off-chain services bridge that gap. All services are advisory — none hold private keys or submit transactions on behalf of users.
9.1 Service map

text

┌──────────────────────────────────────────────────────────────────────────┐
│                         OFF-CHAIN SERVICES                               │
│                                                                          │
│  [Dashboard UI]                                                          │
│       │                                                                  │
│       ▼                                                                  │
│  [API Gateway]  ◄──── Auth: SIWS (Sign-In With Solana)                  │
│       │                                                                  │
│       ├──► [Indexer]         ← listens to Solana logs / events          │
│       ├──► [Doc Service]     ← manages encrypted blob storage           │
│       ├──► [Notifier]        ← email / SMS / push / wallet alerts       │
│       ├──► [Market Data]     ← token prices, metadata, history          │
│       └──► [Tx Builder]      ← builds unsigned txs for wallet signing   │
│                                                                          │
│  [Postgres] [Redis] [Object Storage (S3/Arweave)] [Analytics Store]     │
└──────────────────────────────────────────────────────────────────────────┘

9.2 Authentication: SIWS (Sign-In With Solana)

All API endpoints that read user-scoped data or build transactions require authentication.

Flow:

    Client calls GET /v1/auth/nonce?wallet=<pubkey> → server returns a one-time nonce
    Client signs a structured SIWS message containing: domain, nonce, issued-at, expiry, and statement
    Client calls POST /v1/auth/verify with { pubkey, signature, message } → server verifies, issues a JWT (short-lived, 15 min) + refresh token (long-lived, 7 days)
    All subsequent requests include Authorization: Bearer <jwt>
    Server resolves wallet from JWT; applies role-based access control (Owner / Guardian / Beneficiary / Viewer)

Role resolution:

    If wallet == vault.owner → role = Owner (full access)
    If wallet in active GuardianEntry for vault → role = Guardian
    If wallet in active BeneficiaryEntry for vault → role = Beneficiary
    Else → role = Viewer (public data only)

9.3 API Gateway — complete endpoint specification

Base URL: https://api.legacyvault.xyz/v1

All endpoints return JSON. Error responses follow the shape:

JSON

{ "error": { "code": "VAULT_NOT_FOUND", "message": "...", "details": {} } }

9.3.1 Auth endpoints

text

GET  /v1/auth/nonce?wallet=<pubkey>
  → { nonce: string, expiresAt: number }

POST /v1/auth/verify
  Body: { pubkey, signature, message }
  → { accessToken, refreshToken, expiresIn }

POST /v1/auth/refresh
  Body: { refreshToken }
  → { accessToken, expiresIn }

DELETE /v1/auth/logout
  → 204 No Content

9.3.2 Vault read endpoints

text

GET /v1/vaults/:vaultPubkey/summary
  Auth: any role
  → VaultSummaryResponse:
    {
      pubkey, ownerPubkey, status,          // "locked" | "unlocking" | "unlocked" | "frozen" | "distributed"
      createdAt, lastCheckIn, timelockStart,
      inactivityThreshold, timelockDuration,
      guardianThreshold, totalGuardians,
      totalBeneficiaries, totalBps,
      subscriptionTier, subscriptionExpiry,
      daysSinceCheckIn, daysRemaining,
      checkInHealth,                        // "healthy" | "warning" | "danger"
      approvedGuardians,                    // count with approved = true in current unlock session
      totalUsdValue,
      unlockSession: UnlockSessionView | null
    }

text

GET /v1/vaults/:vaultPubkey/assets?filter=all|SOL|SPL|NFT|POSITION
  Auth: Owner | Guardian
  → VaultAsset[]
    Each asset: { type, mint, symbol, name, icon, balance, usdValue, change24h }

text

GET /v1/vaults/:vaultPubkey/guardians
  Auth: Owner | Guardian
  → Guardian[]
    Each guardian: { pubkey, role, status, approved, approvalTime,
                     name, avatar, lastContact, reputation, bondAmount }

text

GET /v1/vaults/:vaultPubkey/beneficiaries
  Auth: Owner | Guardian | Beneficiary (own record only for Beneficiary role)
  → Beneficiary[]
    Each: { pubkey, shareBps, active, name, avatar, assetOverrides[] }

text

GET /v1/vaults/:vaultPubkey/liveness/summary
  Auth: Owner | Guardian
  → {
      lastCheckIn, daysSinceCheckIn, daysRemaining,
      checkInHealth, inactivityThreshold, delegates: LivenessDelegate[]
    }

GET /v1/vaults/:vaultPubkey/liveness/history?range=30d|90d|1y
  Auth: Owner | Guardian
  → LivenessRecord[]
    Each: { timestamp, signedBy, txSignature }

text

GET /v1/vaults/:vaultPubkey/distribution/state
  Auth: Owner | Guardian | Beneficiary
  → {
      unlockSession: UnlockSessionView | null,
      solSession: SolDistributionSessionView | null,
      splSessions: SplDistributionSessionView[],
      availableMints: string[],   // mints with non-zero vault balance
      canFinalize: boolean
    }

    UnlockSessionView: {
      pubkey, status, initiatedBy, initiatedAt, approvedAt,
      timelockStartedAt, timelockEndsAt, executedAt,
      approvalCount, threshold, timeRemaining
    }

    SolDistributionSessionView: {
      pubkey, totalBeneficiaries, cursor, totalLamports,
      distributedLamports, completed, batches: DistributionBatch[]
    }

    SplDistributionSessionView: {
      pubkey, mint, symbol, totalBeneficiaries, cursor,
      totalAmount, distributedAmount, completed,
      createMissingAtas, batches: DistributionBatch[]
    }

text

GET /v1/vaults/:vaultPubkey/documents
  Auth: Owner (full list); Guardian | Beneficiary (limited metadata, no URI)
  → VaultDocument[]

GET /v1/vaults/:vaultPubkey/documents/:docId/download-url
  Auth: Owner
  → { url: string, expiresAt: number }  // presigned URL valid 5 min

text

GET /v1/vaults/:vaultPubkey/activity?limit=50&offset=0&type=<activityType>
  Auth: Owner | Guardian (filtered by role)
  → ActivityLog[]

GET /v1/vaults/:vaultPubkey/notifications?limit=50&unread=true
  Auth: Owner | Guardian | Beneficiary (own notifications only)
  → Notification[]

PATCH /v1/vaults/:vaultPubkey/notifications/:notifId/read
  Auth: same wallet as notification target
  → 204 No Content

PATCH /v1/vaults/:vaultPubkey/notifications/read-all
  → 204 No Content

text

GET /v1/vaults/:vaultPubkey/portfolio/summary
  Auth: Owner | Guardian
  → { totalUsdValue, breakdown: { sol: number, spl: number, nft: number, position: number } }

GET /v1/vaults/:vaultPubkey/portfolio/history?range=30d|90d|1y
  Auth: Owner | Guardian
  → PortfolioSnapshot[]
    Each: { timestamp, totalUsdValue }

GET /v1/vaults/:vaultPubkey/portfolio/distribution
  Auth: Owner | Guardian
  → AssetDistributionSlice[]
    Each: { symbol, name, usdValue, percentage }

9.3.3 User metadata endpoints (off-chain enrichment)

text

GET  /v1/users/:wallet/profile
  → { wallet, name, avatar, email (masked), smsEnabled }

POST /v1/users/:wallet/profile
  Auth: wallet == caller
  Body: { name?, avatar? }
  → Updated profile

GET  /v1/users/:wallet/notification-preferences
  Auth: wallet == caller
  → { emailEnabled, smsEnabled, pushEnabled, channels: string[] }

PUT  /v1/users/:wallet/notification-preferences
  Auth: wallet == caller
  Body: { emailEnabled, smsEnabled, pushEnabled }
  → Updated preferences

9.3.4 Document service endpoints

text

POST /v1/vaults/:vaultPubkey/documents/upload-url
  Auth: Owner
  Body: { filename, mimeType, sizeBytes, documentType, hash }
  → { uploadUrl: string, docId: string, expiresAt: number }

POST /v1/vaults/:vaultPubkey/documents/:docId/confirm
  Auth: Owner
  Body: { onChainTxSignature }
  → VaultDocument

DELETE /v1/vaults/:vaultPubkey/documents/:docId
  Auth: Owner
  → 204 No Content
  Note: removes blob from storage; on-chain revocation must be done separately
        via tx builder endpoint

9.3.5 Professional guardian marketplace endpoints

text

GET /v1/pro-guardians?page=1&limit=20&minReputation=5000&kycStatus=verified
  Auth: none (public)
  → ProfessionalGuardianProfile[]

GET /v1/pro-guardians/:wallet
  Auth: none
  → ProfessionalGuardianProfile (public fields only)

9.3.6 Tx builder endpoints (all return unsigned serialized transactions for wallet signing)

All tx builder endpoints accept a feePayer: string (wallet pubkey) in the body and return:

JSON

{
  "transaction": "<base64 serialized unsigned VersionedTransaction>",
  "estimatedFee": 5000,
  "computeUnits": 200000,
  "warnings": []
}

The warnings array surfaces things like "ATA creation increases fee", "timelock not yet elapsed", or "shares do not sum to 10,000".

text

POST /v1/tx/create-vault
  Body: { owner, vaultNonce, inactivityThreshold, timelockDuration, guardianThreshold }

POST /v1/tx/update-vault-settings
  Body: { vault, owner, inactivityThreshold?, timelockDuration?, guardianThreshold?, arbiter? }

POST /v1/tx/freeze-vault
  Body: { vault, owner }

POST /v1/tx/unfreeze-vault
  Body: { vault, owner }

POST /v1/tx/add-guardian
  Body: { vault, owner, guardianWallet, role }

POST /v1/tx/remove-guardian
  Body: { vault, owner, guardianWallet }

POST /v1/tx/set-guardian-threshold
  Body: { vault, owner, threshold }

POST /v1/tx/accept-guardian-invitation
  Body: { vault, guardianWallet }

POST /v1/tx/add-beneficiary
  Body: { vault, owner, beneficiaryWallet, shareBps, active }

POST /v1/tx/update-beneficiary
  Body: { vault, owner, beneficiaryWallet, shareBps?, active? }

POST /v1/tx/remove-beneficiary
  Body: { vault, owner, beneficiaryWallet }

POST /v1/tx/set-asset-rule
  Body: { vault, owner, beneficiaryWallet, mint, mode, fixedBps? }

POST /v1/tx/clear-asset-rule
  Body: { vault, owner, beneficiaryWallet, mint }

POST /v1/tx/deposit-sol
  Body: { vault, depositor, lamports }

POST /v1/tx/deposit-spl
  Body: { vault, depositor, mint, amount, tokenProgram }

POST /v1/tx/withdraw-sol
  Body: { vault, owner, lamports }

POST /v1/tx/withdraw-spl
  Body: { vault, owner, mint, amount, tokenProgram }

POST /v1/tx/check-in
  Body: { vault, signer }  // signer = owner or delegate

POST /v1/tx/add-liveness-delegate
  Body: { vault, owner, delegateWallet }

POST /v1/tx/remove-liveness-delegate
  Body: { vault, owner, delegateWallet }

POST /v1/tx/set-document-commitment
  Body: { vault, owner, docHash, docUri }

POST /v1/tx/revoke-document-commitment
  Body: { vault, owner }

POST /v1/tx/initiate-unlock
  Body: { vault, guardianWallet }

POST /v1/tx/approve-unlock
  Body: { vault, guardianWallet, unlockSession }

POST /v1/tx/cancel-unlock
  Body: { vault, owner, unlockSession }

POST /v1/tx/open-dispute
  Body: { vault, opener, unlockSession }

POST /v1/tx/resolve-dispute
  Body: { vault, arbiter, unlockSession, resolution, resolutionNoteHash? }

POST /v1/tx/init-dist-sol
  Body: { vault, owner, unlockSession }

POST /v1/tx/exec-dist-sol-batch
  Body: { vault, owner, unlockSession, startIndex, batchSize }
  Note: server sorts beneficiaries, derives remaining accounts, checks cursor

POST /v1/tx/init-dist-spl
  Body: { vault, owner, unlockSession, mint, createMissingAtas, tokenProgram }

POST /v1/tx/exec-dist-spl-batch
  Body: { vault, owner, unlockSession, mint, startIndex, batchSize,
          createMissingAtas, tokenProgram }

POST /v1/tx/finalize-unlock
  Body: { vault, owner, unlockSession }

POST /v1/tx/set-subscription
  Body: { vault, owner, tier, durationSeconds }

POST /v1/tx/register-pro-guardian
  Body: { guardianWallet, nameHash, profileUri }

POST /v1/tx/bond-for-vault
  Body: { vault, guardianWallet, bondLamports }

9.4 Indexer specification

The indexer is the backbone of the "no mock data" requirement. It transforms on-chain events into the read models the dashboard consumes.
9.4.1 Indexer responsibilities

    Subscribe to Solana transaction logs for the LegacyVault program ID via WebSocket (logsSubscribe) or a webhook (Helius/QuickNode).
    Decode each emit!() event using the program's IDL.
    Upsert Postgres read model tables based on event payload.
    Trigger Notifier for relevant events (see Section 9.5).
    Trigger Portfolio snapshot job on deposit/withdrawal events.
    Handle re-orgs by listening for slot confirmations and rolling back unconfirmed events.

9.4.2 Event → action mapping
Event	Indexer action
VaultCreated	Insert vault row; insert activity log; init subscription row
VaultSettingsUpdated	Update vault row; insert activity log
VaultFrozen	Update vault status; insert activity log; trigger Notifier
VaultUnfrozen	Update vault status; insert activity log
GuardianAdded	Upsert guardian row; insert activity log; trigger guardian invite notification
GuardianAccepted	Update guardian row status
GuardianRemoved	Update guardian row; insert activity log
BeneficiaryAdded	Upsert beneficiary row; insert activity log
BeneficiaryUpdated	Update beneficiary row; recalculate totalBps in vault summary
BeneficiaryRemoved	Remove beneficiary row; insert activity log
AssetRuleSet	Upsert asset rule row
AssetRuleCleared	Remove asset rule row
Deposited	Insert asset event; trigger portfolio snapshot job; insert activity log
Withdrawn	Insert asset event; trigger portfolio snapshot job; insert activity log
CheckIn	Update vault lastCheckIn; insert liveness record; insert activity log; reset Notifier reminder timers
UnlockInitiated	Insert unlock session row; update vault status; insert activity log; trigger unlock initiated notification to all guardians
UnlockApproved	Upsert guardian approval row; update unlock session approvalCount; insert activity log
UnlockThresholdMet	Update unlock session status; set timelockEndsAt; trigger timelock notifications
UnlockCancelled	Update unlock session and vault status; insert activity log
DisputeOpened	Insert dispute row; update unlock session status; trigger notification
DisputeResolved	Update dispute and unlock session rows
SolDistributionInitialized	Insert SOL dist session row; insert activity log
SolBatchExecuted	Update SOL dist session cursor; insert batch record with txSig; insert activity log
SplDistributionInitialized	Insert SPL dist session row
SplBatchExecuted	Update SPL dist session cursor; insert batch record
UnlockFinalized	Update vault status to Distributed; update unlock session; insert activity log; trigger distribution complete notifications to all beneficiaries
DocumentSet	Upsert document row; insert activity log
DocumentRevoked	Update document status; insert activity log
SubscriptionUpdated	Update subscription row; update vault subscription tier
ProfessionalGuardianRegistered	Insert pro guardian profile row
ProfessionalGuardianKycUpdated	Update KYC status row
GuardianBonded	Insert bond row
GuardianSlashed	Update bond row
9.5 Notifier specification
9.5.1 Notification triggers and timing
Trigger	Timing	Channels	Recipients
check_in_reminder	T-7d before inactivity deadline	Email + push	Owner
check_in_reminder	T-1d before deadline	Email + SMS + push	Owner
check_in_overdue	At inactivity threshold elapsed	Email + SMS + push	Owner + all guardians
unlock_eligible	At inactivity threshold elapsed	Email + push	All active guardians
unlock_initiated	On UnlockInitiated event	Email + SMS + push	All active guardians + owner
unlock_approved	On UnlockThresholdMet	Email + push	Owner + all guardians
timelock_ending	T-24h before timelockEndsAt	Email + SMS + push	Owner
distribution_complete	On UnlockFinalized	Email + push	All beneficiaries + owner
distribution_failed	On failed batch (API error / tx failure)	Email + push	Owner
guardian_invite	On GuardianAdded	Email + push	Invited guardian wallet
subscription_expiring	T-7d before expiry	Email	Owner
vault_frozen	On VaultFrozen	Email + SMS	Owner
9.5.2 Channel delivery rules

    All channels respect user notification preferences (/v1/users/:wallet/notification-preferences).
    SMS is only sent for critical severity events when opt-in is active.
    Push notifications require a registered device token (via POST /v1/users/:wallet/push-token).
    Email uses templates (HTML) rendered per notification type.
    Delivery failures are retried up to 3 times with exponential backoff then marked failed.

9.6 Document service specification
9.6.1 Encryption protocol (client-side, browser)

    Generate a random 256-bit AES-GCM key (the "document key") per file using crypto.getRandomValues.
    Encrypt the file using WebCrypto AES-GCM (12-byte IV, 128-bit auth tag).
    Compute SHA-256 of the ciphertext using WebCrypto SubtleCrypto.digest.
    Call POST /v1/vaults/:vault/documents/upload-url with the hash.
    Upload the ciphertext to the presigned URL.
    The document key must be stored securely by the owner (hardware wallet encryption, key management service, or a key-wrapping scheme). The API does not receive the document key.
    Call POST /v1/tx/set-document-commitment with the ciphertext hash + storage URI to anchor on-chain.

9.6.2 Integrity verification (client-side, on download)

    Download the ciphertext from the doc service.
    Compute SHA-256 of the ciphertext.
    Compare with vault.doc_hash from on-chain commitment.
    If they match: decrypt with the document key and display.
    If they don't match: surface a clear integrity warning to the user — do not display the file.

9.6.3 Storage backends (in priority order)

    Arweave (preferred for permanent commitments — no ongoing fees)
    Shadow Drive (Solana-native, pays with SHDW)
    S3-compatible (fallback; requires ongoing hosting)

The doc service must be backend-agnostic and configurable per environment.
9.7 Market data service specification
9.7.1 Responsibilities

    Return USD price and 24h change for any SPL token mint or SOL.
    Return token metadata: symbol, name, icon URL, decimals.
    Return historical price snapshots for portfolio history chart.

9.7.2 Data sources (in order of preference)

    Jupiter Price API v2 (real-time price in USDC per token)
    Birdeye API (metadata + history)
    Helius DAS API (token metadata, NFT metadata)
    Internal snapshot store (Redis cache + Postgres history table for historical series)

9.7.3 Portfolio snapshot job

Triggered by: deposit, withdrawal events; also run on a cron schedule (every 4 hours).

    Enumerate all vault authority token accounts.
    Get current balances.
    Get current USD prices.
    Compute total vault value.
    Write a PortfolioSnapshot row to Postgres.
    This powers both the Dashboard KPI and the portfolio history chart.

9.8 Postgres schema (minimum viable — production tables)

SQL

-- Vaults
CREATE TABLE vaults (
  pubkey              TEXT PRIMARY KEY,
  owner_pubkey        TEXT NOT NULL,
  status              TEXT NOT NULL,  -- active|unlocking|executing|distributed|frozen
  created_at          BIGINT NOT NULL,
  last_check_in       BIGINT NOT NULL,
  inactivity_threshold BIGINT NOT NULL,
  timelock_duration   BIGINT NOT NULL,
  guardian_threshold  SMALLINT NOT NULL,
  guardian_count      SMALLINT NOT NULL DEFAULT 0,
  beneficiary_count   SMALLINT NOT NULL DEFAULT 0,
  total_bps           SMALLINT NOT NULL DEFAULT 0,
  subscription_tier   TEXT NOT NULL DEFAULT 'free',
  subscription_expiry BIGINT,
  doc_hash            TEXT,
  doc_uri             TEXT,
  doc_updated_at      BIGINT,
  panic_freeze        BOOLEAN NOT NULL DEFAULT FALSE,
  frozen_by           TEXT,
  frozen_at           BIGINT,
  arbiter             TEXT,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Guardians
CREATE TABLE guardians (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_pubkey        TEXT NOT NULL REFERENCES vaults(pubkey),
  guardian_wallet     TEXT NOT NULL,
  role                TEXT NOT NULL,  -- personal|professional|delegate
  status              TEXT NOT NULL,  -- pending|active|inactive|removed
  added_at            BIGINT NOT NULL,
  accepted_at         BIGINT,
  removed_at          BIGINT,
  UNIQUE (vault_pubkey, guardian_wallet)
);

-- Guardian approvals (per unlock session)
CREATE TABLE guardian_approvals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unlock_session_pubkey TEXT NOT NULL,
  guardian_wallet     TEXT NOT NULL,
  approved_at         BIGINT NOT NULL,
  tx_signature        TEXT NOT NULL,
  UNIQUE (unlock_session_pubkey, guardian_wallet)
);

-- Beneficiaries
CREATE TABLE beneficiaries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_pubkey        TEXT NOT NULL REFERENCES vaults(pubkey),
  beneficiary_wallet  TEXT NOT NULL,
  share_bps           SMALLINT NOT NULL,
  active              BOOLEAN NOT NULL DEFAULT TRUE,
  added_at            BIGINT NOT NULL,
  updated_at          BIGINT NOT NULL,
  UNIQUE (vault_pubkey, beneficiary_wallet)
);

-- Asset rules
CREATE TABLE asset_rules (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_pubkey        TEXT NOT NULL,
  beneficiary_wallet  TEXT NOT NULL,
  mint                TEXT NOT NULL,
  mode                TEXT NOT NULL,  -- pro-rata|fixed-bps|entire-to-beneficiary
  fixed_bps           SMALLINT,
  UNIQUE (vault_pubkey, beneficiary_wallet, mint)
);

-- Unlock sessions
CREATE TABLE unlock_sessions (
  pubkey              TEXT PRIMARY KEY,
  vault_pubkey        TEXT NOT NULL REFERENCES vaults(pubkey),
  status              TEXT NOT NULL,
  initiated_by        TEXT NOT NULL,
  initiated_at        BIGINT NOT NULL,
  approved_at         BIGINT,
  timelock_started_at BIGINT,
  timelock_ends_at    BIGINT,
  executed_at         BIGINT,
  cancelled_at        BIGINT,
  approval_count      SMALLINT NOT NULL DEFAULT 0
);

-- Distribution sessions (SOL)
CREATE TABLE sol_distribution_sessions (
  pubkey              TEXT PRIMARY KEY,
  unlock_session_pubkey TEXT NOT NULL,
  vault_pubkey        TEXT NOT NULL,
  total_beneficiaries SMALLINT NOT NULL,
  cursor              SMALLINT NOT NULL DEFAULT 0,
  total_lamports      BIGINT NOT NULL,
  distributed_lamports BIGINT NOT NULL DEFAULT 0,
  initialized_at      BIGINT NOT NULL,
  completed_at        BIGINT
);

-- Distribution sessions (SPL)
CREATE TABLE spl_distribution_sessions (
  pubkey              TEXT PRIMARY KEY,
  unlock_session_pubkey TEXT NOT NULL,
  vault_pubkey        TEXT NOT NULL,
  mint                TEXT NOT NULL,
  total_beneficiaries SMALLINT NOT NULL,
  cursor              SMALLINT NOT NULL DEFAULT 0,
  total_amount        BIGINT NOT NULL,
  distributed_amount  BIGINT NOT NULL DEFAULT 0,
  create_missing_atas BOOLEAN NOT NULL DEFAULT FALSE,
  initialized_at      BIGINT NOT NULL,
  completed_at        BIGINT
);

-- Distribution batches (both SOL and SPL, for UI DistributionBatch[])
CREATE TABLE distribution_batches (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_pubkey      TEXT NOT NULL,
  session_type        TEXT NOT NULL,  -- sol|spl
  mint                TEXT,
  start_index         SMALLINT NOT NULL,
  batch_size          SMALLINT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending',
  tx_signature        TEXT,
  processed_at        BIGINT,
  error_message       TEXT
);

-- Documents
CREATE TABLE documents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_pubkey        TEXT NOT NULL REFERENCES vaults(pubkey),
  document_type       TEXT NOT NULL,
  name                TEXT NOT NULL,
  size_bytes          BIGINT NOT NULL,
  hash                TEXT NOT NULL,
  storage_uri         TEXT NOT NULL,
  storage_backend     TEXT NOT NULL,
  encrypted           BOOLEAN NOT NULL DEFAULT TRUE,
  uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked             BOOLEAN NOT NULL DEFAULT FALSE,
  revoked_at          TIMESTAMPTZ,
  on_chain_tx         TEXT
);

-- Activity log
CREATE TABLE activity_log (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_pubkey        TEXT NOT NULL,
  activity_type       TEXT NOT NULL,
  description         TEXT NOT NULL,
  actor_wallet        TEXT,
  tx_signature        TEXT,
  timestamp           BIGINT NOT NULL,
  metadata            JSONB
);
CREATE INDEX idx_activity_vault ON activity_log(vault_pubkey, timestamp DESC);

-- Notifications
CREATE TABLE notifications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_pubkey        TEXT,
  target_wallet       TEXT NOT NULL,
  notification_type   TEXT NOT NULL,
  title               TEXT NOT NULL,
  message             TEXT NOT NULL,
  severity            TEXT NOT NULL DEFAULT 'info',
  read                BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_via       TEXT[],
  delivery_status     TEXT NOT NULL DEFAULT 'pending'
);
CREATE INDEX idx_notif_wallet ON notifications(target_wallet, read, created_at DESC);

-- Portfolio snapshots
CREATE TABLE portfolio_snapshots (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_pubkey        TEXT NOT NULL,
  total_usd_value     NUMERIC(20, 6) NOT NULL,
  breakdown           JSONB NOT NULL,
  captured_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_portfolio_vault ON portfolio_snapshots(vault_pubkey, captured_at DESC);

-- User profiles (off-chain enrichment)
CREATE TABLE user_profiles (
  wallet              TEXT PRIMARY KEY,
  name                TEXT,
  avatar_url          TEXT,
  email               TEXT,
  email_verified      BOOLEAN DEFAULT FALSE,
  sms_number          TEXT,
  sms_verified        BOOLEAN DEFAULT FALSE,
  push_tokens         TEXT[],
  notification_prefs  JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Professional guardian profiles (off-chain extended data)
CREATE TABLE pro_guardian_profiles (
  wallet              TEXT PRIMARY KEY,
  kyc_status          TEXT NOT NULL DEFAULT 'unverified',
  reputation_score    SMALLINT NOT NULL DEFAULT 0,
  name                TEXT,
  profile_uri         TEXT,
  active_vault_count  INT NOT NULL DEFAULT 0,
  total_vaults_served INT NOT NULL DEFAULT 0,
  registered_at       BIGINT NOT NULL,
  kyc_updated_at      BIGINT,
  on_chain_synced_at  TIMESTAMPTZ
);

-- Subscriptions
CREATE TABLE subscriptions (
  vault_pubkey        TEXT PRIMARY KEY REFERENCES vaults(pubkey),
  tier                TEXT NOT NULL DEFAULT 'free',
  started_at          BIGINT NOT NULL,
  expires_at          BIGINT NOT NULL,
  auto_renew          BOOLEAN NOT NULL DEFAULT FALSE,
  last_payment_at     BIGINT,
  payment_tx          TEXT
);

-- Auth nonces (for SIWS)
CREATE TABLE auth_nonces (
  wallet              TEXT NOT NULL,
  nonce               TEXT NOT NULL,
  expires_at          TIMESTAMPTZ NOT NULL,
  used                BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (wallet, nonce)
);

9.9 Redis usage
Key pattern	Purpose	TTL
vault:summary:<pubkey>	Cached VaultSummaryResponse	10s
vault:assets:<pubkey>:<filter>	Cached asset inventory	30s
price:<mint>	Cached USD price per mint	60s
portfolio:dist:<pubkey>	Cached pie chart data	60s
rate:<wallet>	API rate limiting (sliding window)	60s
auth:nonce:<wallet>	SIWS nonce (short TTL)	5 min
session:<jti>	JWT invalidation set	JWT expiry

→ End of Phase 2



LEGACYVAULT — MASTERDOC.MD (Remastered v1.1)
Phase 3 of 3 — SDK, Frontend Wiring, Security, Testing, Deployment & Roadmap

Version: 1.1 Date: 2026-05-06 Continues from: Phase 1 (Product Definition, Principles, Actors, UI Contract, Flows, State Machine) + Phase 2 (On-Chain Program, Off-Chain Services)
PHASE 3 — SDK, FRONTEND WIRING, SECURITY, TESTING, DEPLOYMENT & ROADMAP
Section 10 — SDK & Frontend Hook Replacement

This section is the direct bridge between Phases 1 & 2 and the actual Legacyvaultdashboardbuild/ codebase. It defines exactly how every mock artifact is replaced with real data and real transaction flows, while preserving the component tree, visual language, and UX behavior of the existing dashboard build exactly as-is.
10.1 Repository & project structure (target state)

The dashboard must be restructured to cleanly separate mock scaffolding (dev only) from production data layers. The target src/ layout is:

text

src/
├── main.tsx                          // unchanged
├── index.css                         // unchanged (vault theme tokens, glass components)
├── App.tsx                           // unchanged structure; data source changes only
├── types.ts                          // unchanged (frozen as UI contract per Phase 1 Section 4)
│
├── config/
│   ├── constants.ts                  // program ID, cluster, API base URL, env flags
│   └── walletConfig.ts               // wallet adapter provider config
│
├── lib/
│   ├── api.ts                        // typed fetch wrapper (auto-attaches JWT, handles errors)
│   ├── auth.ts                       // SIWS sign-in flow, JWT storage, refresh logic
│   ├── pda.ts                        // client-side PDA derivation (mirrors program seeds exactly)
│   ├── crypto.ts                     // WebCrypto AES-GCM encrypt/decrypt, SHA-256 hash
│   └── format.ts                     // number formatters, pubkey truncation, timestamp helpers
│
├── hooks/
│   ├── useAuth.ts                    // SIWS session state + sign-in/sign-out
│   ├── useVault.ts                   // master vault context (replaces useVaultState)
│   ├── useVaultSummary.ts            // Dashboard + Sidebar vault state
│   ├── useAssets.ts                  // VaultPanel asset inventory
│   ├── useGuardians.ts               // GuardiansPanel
│   ├── useBeneficiaries.ts           // BeneficiariesPanel
│   ├── useLiveness.ts                // LivenessPanel
│   ├── useDistributionState.ts       // DistributionPanel
│   ├── useDocuments.ts               // DocumentsPanel
│   ├── useNotifications.ts           // Topbar badge + Dashboard notifications list
│   ├── useActivity.ts                // Dashboard activity feed
│   ├── usePortfolio.ts               // Dashboard charts
│   ├── useSettings.ts                // SettingsPanel
│   └── useTxBuilder.ts               // Generic tx build → sign → send → confirm pattern
│
├── data/
│   └── mockData.ts                   // DEV ONLY — gated behind import.meta.env.DEV
│
├── components/
│   ├── Sidebar.tsx                   // unchanged
│   ├── panels/
│   │   ├── Dashboard.tsx             // data props replaced by real hook outputs
│   │   ├── VaultPanel.tsx            // unchanged structure
│   │   ├── GuardiansPanel.tsx        // unchanged structure
│   │   ├── BeneficiariesPanel.tsx    // unchanged structure
│   │   ├── LivenessPanel.tsx         // unchanged structure
│   │   ├── DistributionPanel.tsx     // unchanged structure
│   │   ├── DocumentsPanel.tsx        // unchanged structure
│   │   └── SettingsPanel.tsx         // unchanged structure
│   └── shared/
│       ├── TxStatusModal.tsx         // new: shows build → sign → confirm lifecycle
│       ├── WalletButton.tsx          // wallet connect/disconnect
│       ├── ErrorBoundary.tsx         // catches and surfaces hook/API errors gracefully
│       └── LoadingSkeleton.tsx       // skeleton loaders for each panel (replaces instant mock render)

Rule: Component files in panels/ must not be modified structurally. Only their data props change — from mock constants to hook outputs. This preserves the visual parity requirement completely.
10.2 Wallet adapter integration
10.2.1 src/config/walletConfig.ts

TypeScript

import {
  PhantomWalletAdapter,
  BackpackWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

export const CLUSTER = import.meta.env.VITE_CLUSTER ?? 'devnet';
export const RPC_ENDPOINT =
  import.meta.env.VITE_RPC_ENDPOINT ?? clusterApiUrl(CLUSTER);

export const SUPPORTED_WALLETS = [
  new PhantomWalletAdapter(),
  new BackpackWalletAdapter(),
  new SolflareWalletAdapter(),
];

10.2.2 src/main.tsx (updated to wrap with providers)

TypeScript

import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { RPC_ENDPOINT, SUPPORTED_WALLETS } from './config/walletConfig';
import { AuthProvider } from './hooks/useAuth';
import { VaultProvider } from './hooks/useVault';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConnectionProvider endpoint={RPC_ENDPOINT}>
      <WalletProvider wallets={SUPPORTED_WALLETS} autoConnect>
        <WalletModalProvider>
          <AuthProvider>
            <VaultProvider>
              <App />
            </VaultProvider>
          </AuthProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </React.StrictMode>
);

10.3 Authentication hook: useAuth.ts

This hook manages the full SIWS lifecycle. Every API call that requires auth uses the JWT issued by this hook.
Responsibilities

    Detect wallet connection state changes
    Trigger SIWS sign-in automatically on wallet connect (or on demand)
    Store JWT + refresh token in sessionStorage (not localStorage — avoids persistent token exposure)
    Auto-refresh the JWT before expiry using the refresh token
    Expose signOut() which clears tokens and disconnects wallet
    Expose role (Owner / Guardian / Beneficiary / Viewer) for the currently loaded vault

State shape

TypeScript

interface AuthState {
  isAuthenticated: boolean;
  wallet: string | null;         // connected wallet pubkey (base58)
  role: 'owner' | 'guardian' | 'beneficiary' | 'viewer' | null;
  isSigningIn: boolean;
  error: string | null;
}

Sign-in flow (internal)

text

1. wallet.connected becomes true
2. GET /v1/auth/nonce?wallet=<pubkey>  →  { nonce }
3. Build SIWS message string:
     "LegacyVault wants you to sign in with your Solana account:\n
      <pubkey>\n\nNonce: <nonce>\nIssued At: <iso8601>\nExpiration Time: <+5min>"
4. wallet.signMessage(encode(message))  →  signature (Uint8Array)
5. POST /v1/auth/verify { pubkey, signature (base64), message }  →  { accessToken, refreshToken }
6. Store tokens in sessionStorage
7. Set isAuthenticated = true
8. Resolve role from vault context (once vault is loaded)

Auto-refresh

text

- Decode JWT exp claim on load
- Set a setTimeout for (exp - now - 60s) to call POST /v1/auth/refresh
- On refresh success: replace accessToken in sessionStorage
- On refresh failure: signOut()

10.4 PDA derivation: src/lib/pda.ts

This file mirrors the program's canonical seed definitions (Phase 2 Section 8.2) in TypeScript so the frontend can derive addresses without an API call.

TypeScript

import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from '../config/constants';

const pid = new PublicKey(PROGRAM_ID);

export function findVaultPda(owner: PublicKey, nonce: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), owner.toBuffer(), Buffer.from([nonce])],
    pid
  );
}

export function findVaultAuthorityPda(vault: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault_auth'), vault.toBuffer()],
    pid
  );
}

export function findGuardianEntryPda(vault: PublicKey, guardian: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('guardian'), vault.toBuffer(), guardian.toBuffer()],
    pid
  );
}

export function findBeneficiaryEntryPda(vault: PublicKey, beneficiary: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('beneficiary'), vault.toBuffer(), beneficiary.toBuffer()],
    pid
  );
}

export function findUnlockSessionPda(vault: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('unlock_session'), vault.toBuffer()],
    pid
  );
}

export function findGuardianApprovalPda(
  unlockSession: PublicKey, guardian: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('approval'), unlockSession.toBuffer(), guardian.toBuffer()],
    pid
  );
}

export function findSolDistSessionPda(unlockSession: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('dist_sol'), unlockSession.toBuffer()],
    pid
  );
}

export function findSplDistSessionPda(
  unlockSession: PublicKey, mint: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('dist_spl'), unlockSession.toBuffer(), mint.toBuffer()],
    pid
  );
}

export function findAssetRulePda(
  vault: PublicKey, beneficiary: PublicKey, mint: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('asset_rule'), vault.toBuffer(), beneficiary.toBuffer(), mint.toBuffer()],
    pid
  );
}

export function findSubscriptionStatePda(vault: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('subscription'), vault.toBuffer()],
    pid
  );
}

10.5 Encryption library: src/lib/crypto.ts

This powers the Documents panel encryption promise (Phase 1 Section 5.6, Phase 2 Section 9.6).

TypeScript

// All operations use the browser's native WebCrypto API — no third-party crypto deps

const ALG = { name: 'AES-GCM', length: 256 };
const IV_LENGTH = 12;

export async function generateDocumentKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(ALG, true, ['encrypt', 'decrypt']);
}

export async function encryptFile(
  file: ArrayBuffer,
  key: CryptoKey
): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, file);
  return { ciphertext, iv };
}

export async function decryptFile(
  ciphertext: ArrayBuffer,
  iv: Uint8Array,
  key: CryptoKey
): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
}

export async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function exportKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

export async function importKey(b64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return crypto.subtle.importKey('raw', raw, ALG, true, ['encrypt', 'decrypt']);
}

Key storage rule: The exported base64 key is shown to the user once at upload time with a "Save this key — it cannot be recovered" warning. The app must never store the raw key in localStorage, sessionStorage, or any API-accessible store. Advanced v2 option: wrap the key with the owner's wallet public key via hybrid encryption.
10.6 Generic transaction hook: useTxBuilder.ts

This is the foundation of all state-changing actions. Every button in every panel that triggers a transaction uses this hook. It replaces the setTimeout fake-signature pattern in useVaultState.
Tx lifecycle states

TypeScript

type TxStatus =
  | 'idle'
  | 'building'     // calling tx-builder API
  | 'awaiting_signature'  // wallet modal open
  | 'sending'      // submitting to RPC
  | 'confirming'   // polling for confirmation
  | 'confirmed'    // success
  | 'failed';      // error at any step

Hook interface

TypeScript

interface UseTxBuilderReturn {
  status: TxStatus;
  txSignature: string | null;
  error: string | null;
  execute: (endpoint: string, body: Record<string, unknown>) => Promise<string | null>;
  reset: () => void;
}

Internal flow

text

execute(endpoint, body):
  1. status = 'building'
     POST /v1/tx/<endpoint>  { feePayer: wallet.publicKey, ...body }
     → { transaction: base64, warnings[] }
     Surface warnings in TxStatusModal if any
  
  2. status = 'awaiting_signature'
     const tx = VersionedTransaction.deserialize(base64decode(transaction))
     const signed = await wallet.signTransaction(tx)
  
  3. status = 'sending'
     const sig = await connection.sendRawTransaction(signed.serialize())
  
  4. status = 'confirming'
     await connection.confirmTransaction({ signature: sig, ...latestBlockhash }, 'confirmed')
  
  5. status = 'confirmed'
     txSignature = sig
     Invalidate relevant React Query cache keys (see 10.7.x hooks)
     Return sig
  
  On any error:
     status = 'failed'
     error = parsed error message (LegacyVaultError code → human string)
     Return null

TxStatusModal (shared component)

A modal that shows the current TxStatus visually. Must overlay the triggering panel without unmounting it, and must match the existing glass-card aesthetic. States map to:

    building → spinner + "Preparing transaction..."
    awaiting_signature → wallet icon + "Approve in your wallet"
    sending → spinner + "Sending to Solana..."
    confirming → pulse + "Confirming..."
    confirmed → green check + "Done!" + explorer link
    failed → red X + error message + retry button

10.7 Per-panel data hooks (replacing useVaultState and mockData.ts)

All hooks use React Query (@tanstack/react-query) for:

    caching and background refetch,
    stale-while-revalidate,
    cache invalidation after confirmed transactions.

The queryClient must be provided at the VaultProvider level.
10.7.1 useVaultSummary (Dashboard, Sidebar, all panels)

TypeScript

// Fetches: GET /v1/vaults/:vault/summary
// Refetch interval: 15s (fast enough to catch state changes)
// Cache key: ['vault', 'summary', vaultPubkey]

interface UseVaultSummaryReturn {
  summary: VaultSummaryResponse | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Replaces: vault state, daysSinceCheckIn, daysRemaining, checkInHealth,
//           approvedGuardians, totalValue — all previously from useVaultState

Invalidated by: any confirmed transaction that mutates vault state (check-in, settings update, freeze, unfreeze, unlock lifecycle, finalize).
10.7.2 useAssets (VaultPanel)

TypeScript

// Fetches: GET /v1/vaults/:vault/assets?filter=<filter>
// Refetch interval: 30s
// Cache key: ['vault', 'assets', vaultPubkey, filter]

interface UseAssetsReturn {
  assets: VaultAsset[];
  isLoading: boolean;
  filter: 'all' | 'SOL' | 'SPL' | 'NFT' | 'POSITION';
  setFilter: (f: typeof filter) => void;
  error: Error | null;
}

// Replaces: mockAssets (local state in VaultPanel)

VaultPanel changes: the local mockAssets state and stateColors are kept; only the asset data source changes. The filter state moves to this hook.
10.7.3 useGuardians (GuardiansPanel)

TypeScript

// Fetches: GET /v1/vaults/:vault/guardians
// Cache key: ['vault', 'guardians', vaultPubkey]

interface UseGuardiansReturn {
  guardians: Guardian[];
  isLoading: boolean;
  approvedCount: number;
  thresholdMet: boolean;
  // Actions (all use useTxBuilder internally):
  addGuardian: (wallet: string, role: GuardianRole) => Promise<void>;
  removeGuardian: (wallet: string) => Promise<void>;
  approveUnlock: (wallet: string, unlockSession: string) => Promise<void>;
  setThreshold: (threshold: number) => Promise<void>;
}

// Replaces: guardians state + onToggleApproval in useVaultState

GuardiansPanel changes: onToggleApproval prop is replaced by approveUnlock from this hook. The toggle is disabled and shows a spinner during tx lifecycle.
10.7.4 useBeneficiaries (BeneficiariesPanel)

TypeScript

// Fetches: GET /v1/vaults/:vault/beneficiaries
// Cache key: ['vault', 'beneficiaries', vaultPubkey]

interface UseBeneficiariesReturn {
  beneficiaries: Beneficiary[];
  isLoading: boolean;
  allocatedBps: number;
  remainingBps: number;
  planIsValid: boolean;  // allocatedBps === 10000 and at least 1 active beneficiary
  // Actions:
  addBeneficiary: (wallet: string, shareBps: number) => Promise<void>;
  updateBeneficiary: (wallet: string, shareBps?: number, active?: boolean) => Promise<void>;
  removeBeneficiary: (wallet: string) => Promise<void>;
  setAssetRule: (wallet: string, mint: string, mode: AssetRuleMode, fixedBps?: number) => Promise<void>;
  clearAssetRule: (wallet: string, mint: string) => Promise<void>;
}

// Replaces: beneficiaries state + onToggleBeneficiary + onUpdateShare in useVaultState

BeneficiariesPanel changes: the local share editing state remains local UI state; onUpdateShare calls updateBeneficiary only on blur/confirm (not on every keystroke). The UI shows an inline warning "Plan invalid — shares must total 10,000 bps" when !planIsValid.
10.7.5 useLiveness (LivenessPanel)

TypeScript

// Fetches:
//   Summary: GET /v1/vaults/:vault/liveness/summary
//   History: GET /v1/vaults/:vault/liveness/history?range=<range>
// Cache keys: ['vault', 'liveness', 'summary', vaultPubkey]
//             ['vault', 'liveness', 'history', vaultPubkey, range]

interface UseLivenessReturn {
  lastCheckIn: number | null;           // ms timestamp
  daysSinceCheckIn: number;
  daysRemaining: number;
  checkInHealth: 'healthy' | 'warning' | 'danger';
  inactivityThresholdDays: number;
  historyRecords: LivenessRecord[];
  historyRange: '30d' | '90d' | '1y';
  setHistoryRange: (r: typeof historyRange) => void;
  isLoading: boolean;
  // Action:
  checkIn: () => Promise<void>;   // calls /v1/tx/check-in → sign → confirm
  isCheckingIn: boolean;
}

// Replaces: onCheckIn in useVaultState + mock liveness chart data

LivenessPanel changes: the liveness BarChart dataset comes from historyRecords. The "Check In" button uses checkIn() and is disabled + shows spinner during isCheckingIn.
10.7.6 useDistributionState (DistributionPanel)

TypeScript

// Fetches: GET /v1/vaults/:vault/distribution/state
// Cache key: ['vault', 'distribution', vaultPubkey]
// Refetch interval: 10s (active during distribution to catch cursor progress)

interface UseDistributionStateReturn {
  unlockSession: UnlockSessionView | null;
  solSession: SolDistributionSessionView | null;
  splSessions: SplDistributionSessionView[];
  availableMints: string[];
  selectedMints: string[];
  setSelectedMints: (mints: string[]) => void;
  createMissingAtas: boolean;
  setCreateMissingAtas: (v: boolean) => void;
  activeSection: 'unlock' | 'sol' | 'spl' | 'finalize';
  canFinalize: boolean;
  isLoading: boolean;
  // Actions:
  initiateUnlock: () => Promise<void>;
  cancelUnlock: () => Promise<void>;
  approveUnlock: () => Promise<void>;
  freeze: () => Promise<void>;
  unfreeze: () => Promise<void>;
  initSolDistribution: () => Promise<void>;
  processSolBatch: (startIndex: number, batchSize: number) => Promise<void>;
  processAllSolBatches: () => Promise<void>;
  initSplDistribution: (mint: string) => Promise<void>;
  processSplBatch: (mint: string, startIndex: number, batchSize: number) => Promise<void>;
  processAllSplBatches: (mint: string) => Promise<void>;
  finalizeUnlock: () => Promise<void>;
}

// Replaces: all distribution-related state and handlers in useVaultState
//           + fake setTimeout distribution simulation

processAllSolBatches implementation:

text

1. Fetch current cursor from solSession
2. While cursor < totalBeneficiaries:
     await processSolBatch(cursor, DEFAULT_SOL_BATCH_SIZE)
     await refetch()  // re-read new cursor from API
     cursor = solSession.cursor  // updated after refetch
3. Done — cache invalidated, UI shows all batches completed

activeSection derivation (server-computed, not client-guessed):

TypeScript

function deriveActiveSection(state: DistributionState): ActiveSection {
  if (!state.unlockSession || state.unlockSession.status === 'cancelled') return 'unlock';
  if (state.unlockSession.status === 'proposed' || state.unlockSession.status === 'approved') return 'unlock';
  if (!state.solSession || !state.solSession.completed) return 'sol';
  const allSplDone = state.splSessions.every(s => s.completed);
  if (!allSplDone) return 'spl';
  return 'finalize';
}

10.7.7 useDocuments (DocumentsPanel)

TypeScript

// Fetches: GET /v1/vaults/:vault/documents
// Cache key: ['vault', 'documents', vaultPubkey]

interface UseDocumentsReturn {
  documents: VaultDocument[];
  isLoading: boolean;
  isUploading: boolean;
  uploadProgress: number;
  // Actions:
  uploadDocument: (file: File, type: DocumentType, key: CryptoKey) => Promise<void>;
  downloadDocument: (docId: string, key: CryptoKey) => Promise<void>;
  revokeDocument: (docId: string) => Promise<void>;
  verifyIntegrity: (docId: string, downloadedCiphertext: ArrayBuffer) => Promise<boolean>;
}

// Replaces: mock documents in useVaultState

uploadDocument full flow:

text

1. Read file as ArrayBuffer
2. encryptFile(buffer, key)  →  { ciphertext, iv }
3. sha256Hex(ciphertext)  →  hash
4. POST /v1/vaults/:vault/documents/upload-url { filename, mimeType, sizeBytes, documentType, hash }
   →  { uploadUrl, docId }
5. PUT uploadUrl  (direct S3/Arweave upload with ciphertext)
   Track progress via XHR for uploadProgress state
6. POST /v1/tx/set-document-commitment { vault, owner, docHash: hash, docUri: storageUri }
   →  sign → send → confirm
7. POST /v1/vaults/:vault/documents/:docId/confirm { onChainTxSignature }
8. Invalidate ['vault', 'documents', vaultPubkey]

10.7.8 useNotifications (Topbar, Dashboard)

TypeScript

// Fetches: GET /v1/vaults/:vault/notifications?limit=50
// Cache key: ['vault', 'notifications', vaultPubkey]
// Refetch interval: 30s + WebSocket push (if Notifier supports WS events)

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

// Replaces: notifications state in useVaultState

Topbar badge: unreadCount from this hook replaces the mock unreadCount computed from hardcoded notification objects.
10.7.9 useActivity (Dashboard)

TypeScript

// Fetches: GET /v1/vaults/:vault/activity?limit=10
// Cache key: ['vault', 'activity', vaultPubkey]

interface UseActivityReturn {
  activities: ActivityLog[];
  isLoading: boolean;
  loadMore: () => void;
  hasMore: boolean;
}

// Replaces: mock activity entries in useVaultState

10.7.10 usePortfolio (Dashboard charts)

TypeScript

// Fetches:
//   Summary:     GET /v1/vaults/:vault/portfolio/summary
//   History:     GET /v1/vaults/:vault/portfolio/history?range=<range>
//   Distribution: GET /v1/vaults/:vault/portfolio/distribution
// Cache keys: ['vault', 'portfolio', 'summary', vaultPubkey]
//             ['vault', 'portfolio', 'history', vaultPubkey, range]
//             ['vault', 'portfolio', 'distribution', vaultPubkey]

interface UsePortfolioReturn {
  totalUsdValue: number;
  breakdown: { sol: number; spl: number; nft: number; position: number };
  historyData: PortfolioSnapshot[];           // feeds area chart
  distributionData: AssetDistributionSlice[]; // feeds pie chart
  historyRange: '30d' | '90d' | '1y';
  setHistoryRange: (r: typeof historyRange) => void;
  isLoading: boolean;
}

// Replaces: hard-coded totalValue = 103701 + mock assetDistribution + mock portfolioHistory

Dashboard.tsx changes: totalValue, assetDistribution, and portfolioHistory props all come from usePortfolio. The Recharts PieChart and AreaChart datasets are fed directly from distributionData and historyData.
10.7.11 useSettings (SettingsPanel)

TypeScript

// Reads from: useVaultSummary (no separate fetch needed)
// Actions use useTxBuilder

interface UseSettingsReturn {
  inactivityDays: number;
  timelockDays: number;
  guardianThreshold: number;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiry: number;
  notificationPrefs: NotificationPreferences;
  // Actions:
  updateCustodySettings: (
    inactivityDays?: number,
    timelockDays?: number,
    guardianThreshold?: number
  ) => Promise<void>;
  updateNotificationPrefs: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  upgradeSubscription: (tier: SubscriptionTier) => Promise<void>;
  isSaving: boolean;
}

// Replaces: local useState sliders/toggles in SettingsPanel

SettingsPanel changes: sliders and toggles remain local UI state during editing; values are committed on explicit "Save" button click which calls updateCustodySettings or updateNotificationPrefs. This prevents a transaction being built on every slider tick.
10.8 App.tsx wiring (final state)

App.tsx must be refactored to use the real hooks instead of the single useVaultState call. The structure below preserves the exact same renderContent() switch and Sidebar + topbar layout:

TypeScript

// App.tsx (sketch — structure unchanged, data sources replaced)

export default function App() {
  const { summary, isLoading: summaryLoading } = useVaultSummary();
  const { unreadCount } = useNotifications();
  const { activities } = useActivity();
  const portfolio = usePortfolio();
  const { role } = useAuth();

  // activeTab remains local UI state — no backend needed
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return (
        <Dashboard
          summary={summary}
          portfolio={portfolio}
          activities={activities}
          isLoading={summaryLoading}
        />
      );
      case 'vault':          return <VaultPanel />;
      case 'guardians':      return <GuardiansPanel />;
      case 'beneficiaries':  return <BeneficiariesPanel />;
      case 'liveness':       return <LivenessPanel />;
      case 'distribution':   return <DistributionPanel />;
      case 'documents':      return <DocumentsPanel />;
      case 'settings':       return <SettingsPanel />;
    }
  };

  return (
    <div className="flex h-screen bg-vault-950 text-white">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        vaultStatus={summary?.status ?? 'locked'}
        guardianThreshold={summary?.guardianThreshold ?? 0}
        approvedGuardians={summary?.approvedGuardians ?? 0}
        unreadCount={unreadCount}
        collapsed={/* local state */}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* topbar: wallet button, notifications, profile — unchanged structure */}
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
      <TxStatusModal />
    </div>
  );
}

10.9 Cache invalidation strategy (React Query)

After every confirmed transaction, the following cache keys must be invalidated (causing automatic background refetch):
Transaction	Invalidated cache keys
create-vault	['vault', 'summary', vault]
update-vault-settings	['vault', 'summary', vault]
freeze-vault, unfreeze-vault	['vault', 'summary', vault]
add-guardian, remove-guardian, set-guardian-threshold	['vault', 'guardians', vault], ['vault', 'summary', vault]
add-beneficiary, update-beneficiary, remove-beneficiary	['vault', 'beneficiaries', vault], ['vault', 'summary', vault]
set-asset-rule, clear-asset-rule	['vault', 'beneficiaries', vault]
deposit-sol, deposit-spl, withdraw-sol, withdraw-spl	['vault', 'assets', vault], ['vault', 'portfolio', ...]
check-in	['vault', 'summary', vault], ['vault', 'liveness', ...]
set-document-commitment, revoke-document-commitment	['vault', 'documents', vault]
initiate-unlock, cancel-unlock, approve-unlock	['vault', 'distribution', vault], ['vault', 'summary', vault], ['vault', 'guardians', vault]
init-dist-sol, exec-dist-sol-batch	['vault', 'distribution', vault]
init-dist-spl, exec-dist-spl-batch	['vault', 'distribution', vault]
finalize-unlock	['vault', 'summary', vault], ['vault', 'distribution', vault]
set-subscription	['vault', 'summary', vault]
10.10 Error handling & user feedback rules

All errors must be mapped from raw Anchor error codes (6000–6062 defined in Phase 2 Section 8.6) to human-readable UI messages. A centralized error map must live at src/lib/errorMessages.ts:

TypeScript

export const ERROR_MESSAGES: Record<string, string> = {
  'VaultNotActive':           'This action requires the vault to be in Active state.',
  'UnlockNotEligible':        'The inactivity threshold has not been reached yet.',
  'TimelockNotElapsed':       'The timelock period has not ended. Please wait before distributing.',
  'SharesNotTenThousand':     'Beneficiary shares must total exactly 10,000 basis points.',
  'GuardianLimitReached':     'You have reached the maximum guardians for your subscription tier.',
  'BeneficiaryLimitReached':  'You have reached the maximum beneficiaries for your subscription tier.',
  'CannotCancelExecuting':    'Distribution has already begun and cannot be cancelled.',
  'OpenDisputeBlocksFinalize':'A dispute must be resolved before the vault can be finalized.',
  'InvalidBatchCursor':       'Batch index mismatch. Please refresh and try again.',
  'MathOverflow':             'A calculation error occurred. Please contact support.',
  'AtaCreationFailed':        'Could not create a token account for a beneficiary. Check network fees.',
  // ... all 63 error codes
};

Errors surface in the TxStatusModal and as dismissible inline banners in each panel (using the existing design system's color tokens for error states).
Section 11 — Security & Threat Model
11.1 On-chain threats and mitigations
T1: Guardian collusion to steal funds prematurely

Attack: M-of-N guardians collude and initiate + approve an unlock while the owner is alive. Mitigations:

    Inactivity threshold enforced on-chain: initiate_unlock fails if now < last_check_in + inactivity_threshold (error: UnlockNotEligible).
    Timelock window: owner can observe the unlock session and call cancel_unlock during timelockDuration. The Notifier sends SMS + email immediately on UnlockInitiated.
    Optional bonding: professional guardians post a bond that is slashable on malicious behavior.
    Optional arbiter: can cancel the unlock session.
    Recommended defaults: 90-day inactivity threshold + 30-day timelock = 120-day window before any funds move.

T2: False-positive unlock (owner is alive but missed check-in)

Attack: Owner forgets to check in; guardian legitimately (by protocol) initiates unlock. Mitigations:

    Multi-channel reminders at T-7d and T-1d before deadline.
    Owner can cancel during the full timelock window (up to 90 days).
    Owner can add liveness delegates (trusted persons who can check in on the owner's behalf).
    Owner check-in works from any connected device; no hardware requirement.

T3: Single guardian key compromise

Attack: One guardian's private key is stolen; attacker uses it to try to steal. Mitigations:

    M-of-N threshold means one key alone cannot approve. Even M=1, the attacker must still pass the inactivity threshold check.
    Owner can remove a compromised guardian before inactivity threshold is met.
    Guardian removal during Unlocking is blocked only if removal would leave approvals below threshold — this prevents an attacker from removing valid approvals.

T4: Program upgrade attack

Attack: A malicious actor upgrades the program to drain all vaults. Mitigations:

    Upgrade authority must be a multisig (Squads) before mainnet. Require M-of-N admin keys for any upgrade.
    Program upgrade should be time-locked (announce → delay → execute) to give users time to withdraw.
    Publish upgrade proposals publicly on-chain and via social channels.
    Long-term: migrate to immutable program with a proxy pattern (Anchor discriminator-based versioning).

T5: PDA signer forgery

Attack: Attacker constructs a fake vault authority PDA to drain token accounts. Mitigations:

    All vault authority CPI calls validate the PDA seeds + bump against the vault account's stored authority_bump.
    Token accounts must be owned by the canonical VaultAuthority PDA.
    Anchor's #[account(seeds = ..., bump = vault.authority_bump)] constraint enforces this.

T6: Batch cursor manipulation (distribution order attack)

Attack: Attacker submits exec_dist_sol_batch with start_index != current cursor, skipping some beneficiaries or processing others twice. Mitigations:

    On-chain check: require!(start_index == sol_dist_session.cursor, InvalidBatchCursor).
    Beneficiary ordering validated on-chain: each entry in remaining accounts must sort strictly after the previous one.
    Session cursor is the only authoritative progress tracker — it cannot be reset without closing the session.

T7: Beneficiary share rounding exploitation

Attack: Carefully chosen share allocations exploit integer division to accumulate extra lamports in the vault. Mitigations:

    Distribution is: amount = (share_bps * total) / 10000.
    Remainder (from rounding) is added to the last beneficiary in the final batch only.
    Session tracks distributed_lamports; final batch sends total_lamports - distributed_lamports to the last beneficiary (not re-computed from share_bps), eliminating rounding residue.

T8: Re-entrancy via CPI

Attack: A malicious SPL token program (Token-2022 hook) calls back into LegacyVault mid-distribution. Mitigations:

    Validate token_program is exactly spl-token or spl-token-2022 program ID at instruction entry.
    Anchor's account model prevents re-entrancy at the account level (accounts are locked for the duration of the transaction).
    Avoid calling back into the LegacyVault program from within distribution CPIs.

T9: Frozen state bypass

Attack: An attacker calls distribution instructions while vault is Frozen. Mitigations:

    Every distribution instruction checks vault.status != Frozen (and != Distributed).
    Freeze sets vault.status = Frozen atomically; no distribution instruction can proceed while frozen.

11.2 Off-chain / application threats and mitigations
T10: API JWT theft → impersonation

Mitigation:

    JWTs stored in sessionStorage (cleared on tab close).
    Short JWT TTL (15 min) + refresh token rotation.
    Refresh tokens are single-use and rotated on each use.
    CORS policy restricts API to known dashboard origins.
    All sensitive endpoints re-verify wallet ownership (SIWS signature) for high-risk operations (subscription changes, document upload).

T11: Phishing / malicious tx builder

Attack: A fake API or compromised tx-builder returns a transaction that drains the wallet instead of checking in. Mitigations:

    Dashboard must display transaction simulation results before presenting to wallet for signing.
    Use connection.simulateTransaction() with sigVerify: false and display a human-readable account change summary in TxStatusModal before the "Approve in wallet" step.
    Open-source the tx-builder endpoint logic so community can audit expected account mutations.
    Encourage hardware wallets (Ledger/Trezor) for vault owners, as they display account changes on-device.

T12: Document key loss

Attack: Owner loses the AES-GCM document key; encrypted documents become permanently inaccessible. Mitigations:

    At upload time: prominently display the base64 key with copy + download options.
    Warning: "This key cannot be recovered. Store it in a password manager or hardware device."
    Optional v2: key escrow (owner encrypts key to their wallet pubkey using hybrid encryption; key is stored encrypted in DB — recoverable only by wallet signing, not by the API).

T13: Notifier failure (missed check-in reminder)

Attack: Notifier service fails silently; owner misses check-in reminders and a guardian triggers unlock. Mitigations:

    Multiple channels (email + SMS + push) reduce single-channel failure risk.
    Dashboard itself shows check-in health and countdown prominently on every visit.
    The danger health state (>80% of inactivity window elapsed) shows a full-screen warning banner.
    Audit: all notification delivery attempts are logged with status in Postgres.

T14: Indexer lag → stale UI state

Attack: Indexer is slow or down; UI shows outdated state and user makes decisions on bad data. Mitigations:

    API responses include indexedAt timestamp; UI shows "Data as of X seconds ago" when lag > 30s.
    Critical state (vault status, unlock eligibility) is always re-fetched from RPC directly for distribution panel actions before building any tx.
    React Query's stale-while-revalidate keeps the UI responsive; background refetch surfaces fresh data within seconds.

11.3 Admin & operations security

    Admin multisig requires M-of-N of the core team's hardware wallets.
    pause_program is a break-glass mechanism: any admin can pause; unpause requires M-of-N.
    Fee receiver is a cold wallet, not a hot API key.
    Slash bond requires admin multisig — cannot be triggered by a single admin.
    All admin actions emit on-chain events and are publicly auditable.

Section 12 — Testing Strategy
12.1 Testing layers

text

Layer 1: Anchor protocol tests        (on-chain logic correctness)
Layer 2: API unit tests               (endpoint logic, auth, validation)
Layer 3: Indexer unit tests           (event decoding, read model upserts)
Layer 4: Hook / integration tests     (hooks + mock API server)
Layer 5: E2E scenario tests           (full flow on localnet/devnet)

12.2 Layer 1: Anchor protocol tests

These tests run on a local validator using Anchor's test framework. Each test group covers one instruction module. Every test must use real PDA derivation, real token mints, and real CPI calls (not mocked).
Test group A — Vault lifecycle

text

✓ create_vault: initializes vault with correct fields
✓ create_vault: rejects inactivity_threshold below MIN
✓ create_vault: rejects inactivity_threshold above MAX
✓ create_vault: rejects timelock below MIN
✓ create_vault: enforces subscription tier guardian/vault limits
✓ update_vault_settings: owner can update; non-owner cannot
✓ update_vault_settings: blocked when vault is Unlocking
✓ freeze_vault: sets status to Frozen; blocks deposit instructions
✓ unfreeze_vault: restores prior status; re-allows deposits

Test group B — Guardian management

text

✓ add_guardian: owner can add; non-owner cannot
✓ add_guardian: enforces guardian count limit per tier
✓ add_guardian: professional role requires verified KYC profile
✓ remove_guardian: owner can remove; threshold re-validated
✓ remove_guardian: cannot reduce below achievable threshold
✓ approve_unlock: guardian approves; approval count increments
✓ approve_unlock: same guardian cannot approve twice (PDA collision)
✓ approve_unlock: delegate role cannot approve
✓ approve_unlock: threshold met → session transitions to Approved

Test group C — Beneficiaries

text

✓ add_beneficiary: creates entry; updates vault.total_bps
✓ remove_beneficiary: closes entry; updates vault.total_bps
✓ update_beneficiary: share_bps updated; vault.total_bps recalculated
✓ set_asset_rule: FixedBps mode requires fixed_bps value
✓ set_asset_rule: EntireToBeneficiary mode ignores fixed_bps
✓ clear_asset_rule: closes account; rent returned to owner

Test group D — Liveness

text

✓ check_in: owner updates last_check_in to current timestamp
✓ check_in: active delegate can check in on behalf of owner
✓ check_in: inactive delegate cannot check in
✓ check_in: blocked when vault is Frozen
✓ initiate_unlock: fails when inactivity threshold not met
✓ initiate_unlock: succeeds when threshold met; vault → Unlocking

Test group E — Distribution (most critical)

text

✓ init_sol_distribution: fails when total_bps != 10000
✓ init_sol_distribution: fails when timelock not elapsed
✓ exec_dist_sol_batch: cursor advances by batch_size
✓ exec_dist_sol_batch: invalid start_index (gap) rejected
✓ exec_dist_sol_batch: invalid beneficiary order rejected
✓ exec_dist_sol_batch: last batch sends remainder to last beneficiary
✓ exec_dist_sol_batch: correct lamport amounts per share_bps
✓ exec_dist_sol_batch: blocked when vault is Frozen
✓ exec_dist_spl_batch: respects AssetRule overrides (FixedBps, EntireToBeneficiary)
✓ exec_dist_spl_batch: creates ATAs when createMissingAtas = true
✓ exec_dist_spl_batch: fails gracefully when ATA creation limit would exceed compute
✓ finalize_unlock: fails when SOL session not complete
✓ finalize_unlock: fails when any SPL session not complete
✓ finalize_unlock: fails when dispute is open
✓ finalize_unlock: succeeds → vault.status = Distributed
✓ Distribution math: 5 beneficiaries with unequal shares, no lamport residue
✓ Distribution math: 100 beneficiaries across 20 batches of 5; sum = total

Test group F — Edge cases & invariants

text

✓ Cannot withdraw during Unlocking/Executing/Frozen/Distributed
✓ Cannot add guardian after vault is Distributed
✓ Cannot check in during Unlocking/Executing/Frozen
✓ Cancel unlock restores vault to Active
✓ Freeze during distribution: all batch instructions blocked
✓ Dispute blocks finalize; arbiter resolves → finalize proceeds
✓ Math: 1 beneficiary (100% = 10000 bps) receives full balance
✓ Math: rounding at 3333/3333/3334 bps split sums to exactly total

12.3 Layer 2: API unit tests

Framework: Jest + Supertest. Each endpoint group has its own test file.
Auth tests

text

✓ GET /v1/auth/nonce: returns nonce; invalid wallet format rejected
✓ POST /v1/auth/verify: valid SIWS → JWT issued; invalid sig → 401
✓ POST /v1/auth/refresh: valid refresh → new access token; expired → 401
✓ Rate limit: >10 nonce requests per minute per IP → 429

Vault read endpoint tests

text

✓ GET /v1/vaults/:vault/summary: returns correct mapped VaultSummaryResponse
✓ GET /v1/vaults/:vault/summary: checkInHealth computed correctly per tier
✓ GET /v1/vaults/:vault/assets: filter=SOL returns only SOL; filter=SPL returns SPL
✓ GET /v1/vaults/:vault/guardians: approved field correct per unlock session
✓ GET /v1/vaults/:vault/distribution/state: canFinalize logic correct
✓ Role access control: Beneficiary cannot access guardian list
✓ Role access control: Viewer cannot access asset list

Tx builder endpoint tests

text

✓ POST /v1/tx/check-in: builds valid unsigned tx with correct accounts
✓ POST /v1/tx/exec-dist-sol-batch: beneficiaries sorted ascending; remaining accounts correct
✓ POST /v1/tx/exec-dist-spl-batch: createMissingAtas=true adds ATA program to accounts
✓ POST /v1/tx/exec-dist-spl-batch: batchSize reduced to 3 when createMissingAtas=true
✓ POST /v1/tx/finalize-unlock: includes all SPL sessions in remaining accounts
✓ All endpoints: feePayer not provided → 400
✓ All endpoints: vault in wrong state for action → 422 with clear error

12.4 Layer 3: Indexer unit tests

text

✓ VaultCreated event: inserts vault row with correct fields
✓ CheckIn event: updates vault.last_check_in; inserts liveness record; activity log entry
✓ UnlockInitiated: vault status → 'unlocking'; unlock_session row inserted
✓ UnlockThresholdMet: unlock_session timelock_ends_at computed correctly
✓ UnlockCancelled: vault status → 'active'; session → 'cancelled'
✓ SolBatchExecuted: cursor advanced; distribution_batch row inserted with txSig
✓ UnlockFinalized: vault status → 'distributed'; all beneficiary notifications triggered
✓ Re-org handling: unconfirmed events rolled back on slot revert
✓ Idempotency: processing same event twice does not duplicate rows
✓ Notifier trigger: CheckIn event resets reminder timers correctly

12.5 Layer 4: Hook / integration tests

Framework: Vitest + React Testing Library + MSW (Mock Service Worker) to intercept API calls.

text

✓ useVaultSummary: loads summary; renders checkInHealth badge correctly
✓ useGuardians: approveUnlock dispatches correct endpoint; optimistic update
✓ useLiveness: checkIn calls /v1/tx/check-in; invalidates summary cache on confirm
✓ useDistributionState: activeSection derived correctly for each session state
✓ useDistributionState: processAllSolBatches loops until cursor = totalBeneficiaries
✓ useDocuments: uploadDocument encrypts before API call; hash sent matches ciphertext
✓ useDocuments: verifyIntegrity returns false when hash mismatch
✓ useTxBuilder: 'building' → 'awaiting_signature' → 'confirming' → 'confirmed' states
✓ useTxBuilder: failed tx sets status='failed' and surfaces error message
✓ useNotifications: unreadCount increments on new notification; markAllRead sets to 0

12.6 Layer 5: E2E scenario tests

Run against localnet (full validator) using a scripted test harness. Each scenario is a complete user journey.
Scenario 1: Happy path (full lifecycle)

text

1.  Create vault (90d inactivity, 30d timelock, 3-of-5 threshold)
2.  Add 5 guardians (3 personal, 1 professional, 1 delegate)
3.  Add 3 beneficiaries (50/30/20 bps)
4.  Deposit 10 SOL + 1000 USDC + 1 NFT
5.  Upload 1 encrypted document; verify on-chain hash matches
6.  Check in (owner)
7.  Assert checkInHealth = 'healthy'
8.  Time-travel: advance clock past inactivity threshold (localnet clock manipulation)
9.  Guardian 1 initiates unlock → vault = 'unlocking'
10. Guardians 2, 3, 4 approve → threshold met → timelock starts
11. Assert cancel_unlock works during timelock (owner cancels → vault = 'locked')
12. Guardians re-initiate and re-approve
13. Time-travel past timelock → vault = 'unlocked' (Executing)
14. init_sol_distribution → exec_dist_sol_batch (all 3 beneficiaries in 1 batch)
15. Assert beneficiary 1 received 5 SOL; beneficiary 2 received 3 SOL; beneficiary 3 received 2 SOL
16. init_spl_distribution (USDC) → exec_dist_spl_batch
17. Assert beneficiary ATAs received correct USDC amounts
18. init_spl_distribution (NFT) → set asset rule: EntireToBeneficiary → exec_dist_spl_batch
19. Assert NFT sent to beneficiary 1 entirely
20. finalize_unlock → vault = 'distributed'
21. Assert all subsequent deposit/withdraw/check-in instructions fail with VaultAlreadyDistributed

Scenario 2: Owner cancel during timelock

text

1.  Create vault; add guardians; add beneficiaries; deposit
2.  Time-travel past inactivity threshold
3.  Initiate unlock; collect M approvals → timelock starts
4.  Owner sends cancel_unlock during timelock → vault = 'locked'
5.  Assert all guardian approvals are invalidated (approval PDAs still exist but session is Cancelled)
6.  Owner checks in → deadline reset
7.  Assert new unlock initiation requires new inactivity window

Scenario 3: Dispute resolution

text

1.  Full setup; time-travel; initiate; approve; timelock elapses
2.  init_sol_distribution; owner opens dispute
3.  Assert exec_dist_sol_batch fails while dispute is open (via UnlockSession.status = Disputed)
4.  Arbiter resolves with ResolvedProceed
5.  Distribution resumes; finalizes successfully

Scenario 4: Large-scale distribution (compute stress test)

text

1.  Create vault with 20 beneficiaries (equal 500 bps each)
2.  Deposit SOL + 5 SPL tokens
3.  Full unlock flow
4.  Execute SOL distribution in batches of 5 (4 batches)
5.  Execute SPL distribution for all 5 mints (4 batches each)
6.  Assert sum of all distributed amounts = initial balances (no residue)
7.  Assert cursor reaches totalBeneficiaries on all sessions
8.  Finalize → assert vault = 'distributed'

Scenario 5: Subscription enforcement

text

1.  Create vault with Free tier
2.  Assert add_guardian fails after 2nd guardian (GuardianLimitReached)
3.  Upgrade subscription to Pro
4.  Assert add_guardian succeeds up to 5th guardian
5.  Attempt downgrade to Free while 3 guardians exist → assert DowngradeExceedsLimits
6.  Remove 1 guardian → downgrade succeeds

Scenario 6: Document integrity

text

1.  Upload encrypted document; record ciphertext hash
2.  Fetch download URL; download ciphertext
3.  Compute SHA-256 of downloaded ciphertext → assert matches on-chain vault.doc_hash
4.  Tamper with 1 byte of ciphertext in storage (simulated)
5.  Re-download; assert verifyIntegrity returns false
6.  Revoke document; assert vault.doc_hash is zeroed on-chain

Section 13 — Deployment, Environments & Operations
13.1 Environments
Environment	Cluster	Purpose	Upgrade Authority
local	localnet (solana-test-validator)	Development + E2E tests	Single developer key
devnet	Solana devnet	Integration testing, guardian/beneficiary staging flows	2-of-3 team multisig
staging	Solana devnet	Pre-release QA; UI parity validation	2-of-3 team multisig
mainnet	Solana mainnet-beta	Production	3-of-5 hardware wallet multisig (Squads)
13.2 Program deployment
First deployment

Bash

# 1. Build and verify
anchor build
anchor verify <program-id> --provider.cluster mainnet-beta

# 2. Deploy (requires multisig to co-sign if using Squads upgrade authority)
anchor deploy --provider.cluster mainnet-beta

# 3. Initialize GlobalConfig (admin multisig signs)
anchor run initialize-global-config --provider.cluster mainnet-beta

# 4. Verify on-chain
anchor idl init --filepath target/idl/legacyvault.json \
  --provider.cluster mainnet-beta <program-id>

Upgrade process (mandatory for mainnet)

text

1. Announce upgrade on Discord/Twitter with change summary
2. Publish upgrade proposal to Squads multisig (requires 3-of-5 approvals)
3. Wait minimum 72-hour delay (ample time for community to notice + react)
4. Co-sign upgrade tx with hardware wallets
5. Execute: anchor upgrade <buffer-id> --program-id <program-id>
6. Verify IDL matches new binary
7. Announce completion

13.3 Off-chain service deployment
Infrastructure stack (recommended)

text

API Gateway:  Docker → Kubernetes (or Railway/Fly.io for early stage)
Indexer:      Docker → long-running Node.js process with Helius webhook receiver
Notifier:     Docker → scheduled jobs (BullMQ + Redis)
Doc Service:  Serverless functions (Cloudflare Workers or AWS Lambda)
Database:     Managed Postgres (PlanetScale/Supabase/RDS)
Cache:        Managed Redis (Upstash/ElastiCache)
Object store: S3 + Arweave

Environment variables (per service)

Bash

# Shared
PROGRAM_ID=<legacyvault-program-id>
RPC_ENDPOINT=https://mainnet.helius-rpc.com/?api-key=<key>
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=<256-bit random secret>
REFRESH_TOKEN_SECRET=<separate 256-bit secret>

# Indexer
HELIUS_WEBHOOK_AUTH_TOKEN=<token>
INDEXER_POLL_INTERVAL_MS=3000

# Notifier
SENDGRID_API_KEY=<key>
TWILIO_ACCOUNT_SID=<sid>
TWILIO_AUTH_TOKEN=<token>
FCM_SERVICE_ACCOUNT_JSON=<path>

# Doc service
S3_BUCKET=legacyvault-documents
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
ARWEAVE_KEY_FILE=<path>

# Market data
BIRDEYE_API_KEY=<key>
HELIUS_API_KEY=<key>

13.4 Dashboard deployment

The vite-plugin-singlefile plugin produces a single self-contained HTML file. Deployment options:
Option	Description
Static host (Vercel/Netlify/Cloudflare Pages)	Build on CI; push dist/ on every tag
IPFS/Arweave (decentralized)	Upload dist/index.html to Arweave for censorship resistance
Self-hosted (Nginx/Caddy)	Simple static serving
Build pipeline

YAML

# .github/workflows/deploy.yml (sketch)
on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run build
        env:
          VITE_PROGRAM_ID: ${{ secrets.PROGRAM_ID }}
          VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
          VITE_CLUSTER: mainnet-beta
          VITE_RPC_ENDPOINT: ${{ secrets.RPC_ENDPOINT }}
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          accountId: ${{ secrets.CF_ACCOUNT_ID }}
          projectName: legacyvault-dashboard
          directory: dist

13.5 Operations runbook
Monitoring & alerting
Metric	Alert threshold	Action
Vault status transitions to Unlocking	Any	Alert ops team + auto-notify vault owner
Distribution batch failure rate	>5% over 5 min	Alert ops team; pause automation worker
Indexer lag (events unprocessed)	>60s	Alert + restart indexer pod
API error rate (5xx)	>1% over 5 min	Alert + check RPC health
Notification delivery failure	>20% for a type	Alert + check channel provider
Solana RPC latency	>2s p95	Switch to backup RPC endpoint
Unlock sessions with no activity	>7 days	Ops review — may indicate stuck session
Runbook: stuck distribution session

text

1. Identify: cursor < total_beneficiaries AND completed_at IS NULL AND last batch > 24h ago
2. Check: are all beneficiary ATAs created? (SPL sessions)
3. Check: is the vault Frozen? (check vault.status on-chain)
4. If frozen: notify owner; they must unfreeze
5. If ATA issue: owner/executor resubmits exec_dist_spl_batch with createMissingAtas=true
6. If RPC issue: retry with a different RPC endpoint
7. If program error: escalate to engineering; consider program pause if exploit suspected

Runbook: indexer gap (missing events)

text

1. Detect: activity_log timestamps have gap > 10 min
2. Identify start slot of gap from last processed event
3. Run backfill script:
     node scripts/backfill-events.ts --from-slot <slot> --to-slot <slot>
4. Script fetches transaction logs from RPC getSignaturesForAddress,
   decodes events, and upserts read models
5. Verify: activity_log has no gaps; vault summaries re-checked

13.6 Key management
Key	Storage	Access	Usage
Admin multisig keys	Hardware wallets (team)	Physical + PIN	Program upgrade, global config
Fee receiver	Cold wallet	Hardware wallet	Withdrawing fees quarterly
API JWT secret	AWS Secrets Manager / Doppler	API service only	JWT signing
Notifier credentials	AWS Secrets Manager	Notifier service only	Email/SMS/push
Indexer RPC API key	AWS Secrets Manager	Indexer service only	RPC access
Doc service S3 credentials	AWS IAM roles	Doc service only	Object storage

Rule: No private keys are stored in .env files in version control. All secrets are injected at runtime via a secrets manager or CI/CD secret store.
Section 14 — Phased Execution Roadmap
Phase 0 — Spec & foundations (Weeks 1–2)

text

□ Finalize and commit MASTERDOC.MD v1.1 (this document) to repo
□ Anchor workspace scaffolded; constants, seeds, enums committed
□ TypeScript types in types.ts frozen as UI contract
□ Postgres schema migrations written and reviewed
□ CI pipeline: lint + build + test matrix configured
□ Devnet program ID reserved (keypair generated, not yet deployed)
□ Wallet adapter + SIWS auth flow implemented and tested (useAuth.ts)
□ API skeleton (Express/Fastify): SIWS endpoints only, JWT middleware
□ src/lib/pda.ts implemented and unit-tested (all seeds)
□ src/lib/crypto.ts implemented and tested (encrypt/decrypt roundtrip)
□ mockData.ts moved behind import.meta.env.DEV guard

Phase 1 — Core protocol (Weeks 3–6)

text

□ Modules A, B, C, D, E implemented in Anchor program
□ Anchor tests: groups A, B, C, D (vault lifecycle, guardians, beneficiaries, assets)
□ Program deployed to devnet
□ IDL published; pda.ts verified against deployed program
□ Indexer: event listener + basic event → DB upsert for all Phase 1 events
□ API: vault read endpoints (summary, assets, guardians, beneficiaries)
□ useTxBuilder.ts implemented; TxStatusModal component built
□ useVaultSummary, useAssets, useGuardians, useBeneficiaries hooks live
□ GuardiansPanel + BeneficiariesPanel + VaultPanel wired to real data
□ Dashboard KPI cards (vault value, guardian count, beneficiary count) real
□ All mock data for these panels disabled in dev build

Phase 2 — Liveness & documents (Weeks 7–9)

text

□ Module F (liveness) + G (documents) implemented in Anchor
□ Anchor tests: groups D (liveness check-in, delegate), and document commitment
□ Indexer: CheckIn events → liveness_records table; DocumentSet events
□ API: liveness endpoints (summary, history chart); document endpoints
□ Doc service: presigned upload URLs, encrypted blob storage (S3 first)
□ src/lib/crypto.ts integrated into useDocuments upload/download flow
□ useLiveness, useDocuments hooks live
□ LivenessPanel wired (check-in button, health indicator, real chart)
□ DocumentsPanel wired (upload with encryption, view/download with decrypt, integrity check)
□ Portfolio snapshot job: cron + trigger on deposit/withdraw events
□ usePortfolio hook live; Dashboard area chart + pie chart real
□ useActivity + useNotifications hooks live; Dashboard activity feed + notif badge real
□ Notifier: check-in reminder rules wired (T-7d, T-1d, overdue)

Phase 3 — Unlock & distribution (Weeks 10–14)

text

□ Module H (unlock) + I (distribution) implemented in Anchor
□ Anchor tests: groups E (full distribution), F (edge cases + invariants)
□ E2E scenario tests: Scenario 1 (happy path), Scenario 2 (cancel), Scenario 4 (stress)
□ Indexer: all unlock + distribution events → read models
□ API: distribution/state endpoint; all unlock + distribution tx-builder endpoints
□ useDistributionState hook live
□ DistributionPanel fully wired:
     - Unlock initiation + approval + cancel + freeze/unfreeze
     - SOL batch distribution (single + process all)
     - SPL batch distribution with mint selection + createMissingAtas
     - Finalize with canFinalize validation
□ Notifier: unlock-triggered notifications (initiated, approved, timelock ending)
□ Settings panel wired: custody settings (on-chain), notification prefs (off-chain)
□ All mock data removed; VITE_DEV=false build tested end-to-end on devnet

Phase 4 — Safety systems & disputes (Weeks 15–17)

text

□ Dispute case module (H4, H5) implemented + tested
□ Slashing module (K4) implemented + tested
□ E2E scenario test: Scenario 3 (dispute resolution)
□ Freeze/unfreeze full integration test across all states
□ Arbiter management UI integrated into SettingsPanel
□ Dispute status surface in DistributionPanel (blocks finalize; shows resolution state)
□ API: open-dispute + resolve-dispute tx-builder endpoints
□ Indexer: dispute events → read models
□ Security audit: internal review of all Anchor constraints; PDA signer checks
□ Tx simulation surface: TxStatusModal shows account delta before signing

Phase 5 — Professional guardians & subscription (Weeks 18–21)

text

□ Module J (subscription) + K (professional guardians) implemented + tested
□ E2E scenario test: Scenario 5 (subscription enforcement)
□ Professional guardian marketplace: API endpoints + basic listing UI in GuardiansPanel
□ KYC adapter: off-chain KYC flow → admin sets kyc_status on-chain
□ Bonding flow: GuardiansPanel shows bond amount; bond-for-vault tx wired
□ Subscription upgrade flow in SettingsPanel fully wired (on-chain tx + billing record)
□ Subscription limits enforced in all add-guardian + add-beneficiary instructions
□ Downgrade validation (DowngradeExceedsLimits error) surfaced in SettingsPanel
□ Professional guardian profile page (read-only marketplace listing)

Phase 6 — Audit, beta & staged rollout (Weeks 22–28)

text

□ External security audit (Anchor program): minimum 2 independent auditors
□ External security audit (API + auth layer)
□ Bug bounty program launched (Immunefi or similar)
□ All audit findings addressed; audit reports published publicly
□ Devnet beta: invite-only cohort (50–100 vault owners)
□ Feedback loop: weekly review of error rates, notification delivery, UX friction
□ Indexer backfill script tested on devnet history
□ Operations runbook validated against simulated incidents
□ Mainnet deployment to Squads multisig upgrade authority
□ Staged rollout: Free tier only → Pro tier → Enterprise tier over 4-week window
□ Public launch announcement

Phase 7 — Scale & enterprise (Months 7–12)

text

□ Arweave document storage (in addition to S3)
□ Multi-vault dashboard view (owner with multiple vaults)
□ Beneficiary dashboard (beneficiary-role view of their expected inheritance)
□ Advanced document key management (wallet-pubkey-wrapped key escrow)
□ Guardian reputation system (aggregate scores, on-chain reviews)
□ Formal verification of distribution math invariants (Certora or similar)
□ Modularization: Anchor program split into separate composable programs
   (custody, liveness, distribution, pro-guardian registry)
□ Multi-jurisdiction compliance posture documentation
□ Enterprise integrations: trust company APIs, legal workflow webhooks
□ DAO governance for protocol parameter changes (replace admin multisig with token vote)

Appendix A — Complete dependency list (frontend additions required)

The following packages must be added to Legacyvaultdashboardbuild/package.json beyond what currently exists:

JSON

{
  "dependencies": {
    "@solana/wallet-adapter-react":        "latest",
    "@solana/wallet-adapter-react-ui":     "latest",
    "@solana/wallet-adapter-wallets":      "latest",
    "@solana/web3.js":                     "latest",
    "@coral-xyz/anchor":                   "latest",
    "@tanstack/react-query":               "latest",
    "@tanstack/react-query-devtools":      "latest"
  }
}

No existing dependencies (recharts, lucide-react, clsx, tailwind-merge, React 19, Vite 7, Tailwind 4) are removed or modified. This ensures visual parity is preserved entirely.
Appendix B — File deletion / migration checklist

Before any production deployment the following must be completed:

text

□ src/data/mockData.ts     → guarded by import.meta.env.DEV; not bundled in production
□ useVaultState.ts         → replaced by per-panel hooks in src/hooks/; file can be
                             archived to src/dev/useVaultState.ts for reference
□ Hard-coded totalValue    → removed; usePortfolio().totalUsdValue used
□ setTimeout fake sigs     → removed; useTxBuilder confirms via RPC
□ Mock liveness records    → removed; useLiveness().historyRecords from API
□ Mock portfolio history   → removed; usePortfolio().historyData from API
□ Mock asset distribution  → removed; usePortfolio().distributionData from API
□ Mock activity entries    → removed; useActivity().activities from API
□ Mock notifications       → removed; useNotifications().notifications from API

Appendix C — Glossary
Term	Definition
BPS	Basis points; 1/100th of a percent. 10,000 BPS = 100%. Used for all share calculations.
PDA	Program Derived Address; a deterministic Solana address controlled by a program, not a private key.
Vault Authority	The PDA that holds all vault assets (SOL + token accounts).
Inactivity Threshold	The duration of owner inactivity (no check-in) after which guardians may initiate an unlock.
Timelock	A waiting period after M-of-N guardian approvals during which the owner can cancel the unlock.
M-of-N	Threshold signature scheme; M approvals required out of N total guardians.
Cursor	An integer tracking distribution progress (next beneficiary index to process in a session).
CPI	Cross-Program Invocation; a Solana mechanism for one program to call another.
SIWS	Sign-In With Solana; a standard for wallet-based authentication (analogous to Sign-In With Ethereum).
ATA	Associated Token Account; a deterministic SPL token account for a given wallet + mint pair.
IDL	Interface Definition Language; Anchor's JSON schema describing a program's instructions and accounts.
Glass panel	The frosted-glass visual component style defined in src/index.css using .glass-panel / .glass-card.
Vault color scale	Custom Tailwind v4 theme tokens vault-50 through vault-950 defining the app's color palette.

→ End of Phase 3 — MASTERDOC.MD v1.1 Complete




