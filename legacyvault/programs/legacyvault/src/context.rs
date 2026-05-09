use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token,
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};
use crate::{
    constants::*,
    errors::LegacyVaultError,
    state::*,
    *,
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE A — GLOBAL ADMIN
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Accounts)]
pub struct InitializeGlobalConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer  = admin,
        space  = GlobalConfig::SIZE,
        seeds  = [b"global_config"],
        bump,
    )]
    pub global_config: Account<'info, GlobalConfig>,

    pub system_program: Program<'info, System>,
}

// ─────────────────────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(args: UpdateGlobalConfigArgs)]
pub struct UpdateGlobalConfig<'info> {
    #[account(
        constraint = admin.key() == global_config.admin
            @ LegacyVaultError::SignerIsNotAdmin
    )]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"global_config"],
        bump  = global_config.bump,
    )]
    pub global_config: Account<'info, GlobalConfig>,
}

// ─────────────────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct PauseProgram<'info> {
    #[account(
        constraint = admin.key() == global_config.admin
            @ LegacyVaultError::SignerIsNotAdmin
    )]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"global_config"],
        bump  = global_config.bump,
    )]
    pub global_config: Account<'info, GlobalConfig>,
}

#[derive(Accounts)]
pub struct UnpauseProgram<'info> {
    #[account(
        constraint = admin.key() == global_config.admin
            @ LegacyVaultError::SignerIsNotAdmin
    )]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"global_config"],
        bump  = global_config.bump,
    )]
    pub global_config: Account<'info, GlobalConfig>,
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE B — VAULT LIFECYCLE
// ═══════════════════════════════════════════════════════════════════════════════
#[derive(Accounts)]
#[instruction(args: CreateVaultArgs)]
pub struct CreateVault<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        seeds = [b"global_config"],
        bump  = global_config.bump,
        constraint = !global_config.paused @ LegacyVaultError::ProgramPaused,
    )]
    pub global_config: Box<Account<'info, GlobalConfig>>,

    /// CHECK: Must match global_config.fee_receiver
    #[account(
        mut,
        constraint = fee_receiver.key() == global_config.fee_receiver
            @ LegacyVaultError::InvalidPda,
    )]
    pub fee_receiver: UncheckedAccount<'info>,

    #[account(
        init,
        payer = owner,
        space = Vault::SIZE,
        seeds = [b"vault", owner.key().as_ref(), &[args.vault_nonce]],
        bump,
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(
        seeds = [b"vault_auth", vault.key().as_ref()],
        bump,
    )]
    pub vault_authority: SystemAccount<'info>,

    #[account(
        init,
        payer = owner,
        space = SubscriptionState::SIZE,
        seeds = [b"subscription", vault.key().as_ref()],
        bump,
    )]
    pub subscription_state: Box<Account<'info, SubscriptionState>>,

    #[account(
        init_if_needed,
        payer = owner,
        space = OwnerState::SIZE,
        seeds = [b"owner_state", owner.key().as_ref()],
        bump,
    )]
    pub owner_state: Box<Account<'info, OwnerState>>,

    pub system_program: Program<'info, System>,
}
// ─────────────────────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(args: UpdateVaultSettingsArgs)]
pub struct UpdateVaultSettings<'info> {
    #[account(
        constraint = owner.key() == vault.owner
            @ LegacyVaultError::SignerIsNotOwner
    )]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
        constraint = vault.status == VaultStatus::Active
            @ LegacyVaultError::VaultNotActive,
        constraint = vault.status != VaultStatus::Frozen
            @ LegacyVaultError::VaultFrozen,
    )]
    pub vault: Account<'info, Vault>,
}

// ─────────────────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct FreezeVault<'info> {
    #[account(
        constraint = owner.key() == vault.owner
            @ LegacyVaultError::SignerIsNotOwner
    )]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
        constraint = vault.status != VaultStatus::Distributed
            @ LegacyVaultError::VaultAlreadyDistributed,
    )]
    pub vault: Account<'info, Vault>,
}

// ─────────────────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct UnfreezeVault<'info> {
    #[account(
        constraint = owner.key() == vault.owner
            @ LegacyVaultError::SignerIsNotOwner
    )]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
        constraint = vault.status == VaultStatus::Frozen
            @ LegacyVaultError::VaultNotActive,
    )]
    pub vault: Account<'info, Vault>,

    // Need the unlock session to decide which status to restore to
    // (Active if no active session; Unlocking if a Proposed/Approved session exists)
    #[account(
        seeds = [b"unlock_session", vault.key().as_ref()],
        bump,
    )]
    pub unlock_session: Option<Account<'info, UnlockSession>>,
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE C — GUARDIANS
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Accounts)]
#[instruction(args: AddGuardianArgs)]
pub struct AddGuardian<'info> {
    #[account(
        mut,
        constraint = owner.key() == vault.owner
            @ LegacyVaultError::SignerIsNotOwner
    )]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
        constraint = vault.status != VaultStatus::Distributed
            @ LegacyVaultError::VaultAlreadyDistributed,
        constraint = vault.status != VaultStatus::Frozen
            @ LegacyVaultError::VaultFrozen,
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(
        init,
        payer  = owner,
        space  = GuardianEntry::SIZE,
        seeds  = [b"guardian", vault.key().as_ref(), args.guardian_wallet.as_ref()],
        bump,
    )]
    pub guardian_entry: Box<Account<'info, GuardianEntry>>,

    #[account(
        seeds = [b"global_config"],
        bump  = global_config.bump,
        constraint = !global_config.paused @ LegacyVaultError::ProgramPaused,
    )]
    pub global_config: Box<Account<'info, GlobalConfig>>,

    /// Optional: only required when adding a Professional-role guardian.
    /// Must have kyc_status == Verified.
    pub pro_guardian_profile: Option<Box<Account<'info, ProfessionalGuardianProfile>>>,

    pub system_program: Program<'info, System>,
}

// ─────────────────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct AcceptGuardianInvitation<'info> {
    #[account(
        constraint = guardian.key() == guardian_entry.guardian_wallet
            @ LegacyVaultError::SignerIsNotGuardian
    )]
    pub guardian: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"guardian",
            guardian_entry.vault.as_ref(),
            guardian.key().as_ref(),
        ],
        bump = guardian_entry.bump,
        constraint = guardian_entry.status == GuardianStatus::Pending
            @ LegacyVaultError::GuardianNotActive,
    )]
    pub guardian_entry: Account<'info, GuardianEntry>,

    #[account(
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
        constraint = vault.key() == guardian_entry.vault
            @ LegacyVaultError::InvalidPda,
    )]
    pub vault: Account<'info, Vault>,
}

// ─────────────────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct RemoveGuardian<'info> {
    #[account(
        constraint = owner.key() == vault.owner
            @ LegacyVaultError::SignerIsNotOwner
    )]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [
            b"guardian",
            vault.key().as_ref(),
            guardian_entry.guardian_wallet.as_ref(),
        ],
        bump  = guardian_entry.bump,
        constraint = guardian_entry.vault == vault.key()
            @ LegacyVaultError::InvalidPda,
        // close = owner returns rent to owner after removal
        close = owner,
    )]
    pub guardian_entry: Account<'info, GuardianEntry>,
}

// ─────────────────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct SetGuardianThreshold<'info> {
    #[account(
        constraint = owner.key() == vault.owner
            @ LegacyVaultError::SignerIsNotOwner
    )]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
        constraint = vault.status == VaultStatus::Active
            @ LegacyVaultError::VaultNotActive,
    )]
    pub vault: Account<'info, Vault>,
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE D — BENEFICIARIES
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Accounts)]
#[instruction(args: AddBeneficiaryArgs)]
pub struct AddBeneficiary<'info> {
    #[account(
        mut,
        constraint = owner.key() == vault.owner
            @ LegacyVaultError::SignerIsNotOwner
    )]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
        constraint = vault.status == VaultStatus::Active
            @ LegacyVaultError::VaultNotActive,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        init,
        payer  = owner,
        space  = BeneficiaryEntry::SIZE,
        seeds  = [b"beneficiary", vault.key().as_ref(), args.beneficiary_wallet.as_ref()],
        bump,
    )]
    pub beneficiary_entry: Account<'info, BeneficiaryEntry>,

    #[account(
        seeds = [b"global_config"],
        bump  = global_config.bump,
        constraint = !global_config.paused @ LegacyVaultError::ProgramPaused,
    )]
    pub global_config: Account<'info, GlobalConfig>,

    pub system_program: Program<'info, System>,
}

// ─────────────────────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(args: UpdateBeneficiaryArgs)]
pub struct UpdateBeneficiary<'info> {
    #[account(
        constraint = owner.key() == vault.owner
            @ LegacyVaultError::SignerIsNotOwner
    )]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
        constraint = vault.status != VaultStatus::Distributed
            @ LegacyVaultError::VaultAlreadyDistributed,
        constraint = vault.status != VaultStatus::Frozen
            @ LegacyVaultError::VaultFrozen,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [
            b"beneficiary",
            vault.key().as_ref(),
            beneficiary_entry.beneficiary_wallet.as_ref(),
        ],
        bump  = beneficiary_entry.bump,
        constraint = beneficiary_entry.vault == vault.key()
            @ LegacyVaultError::InvalidPda,
    )]
    pub beneficiary_entry: Account<'info, BeneficiaryEntry>,
}

// ─────────────────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct RemoveBeneficiary<'info> {
    #[account(
        mut,
        constraint = owner.key() == vault.owner
            @ LegacyVaultError::SignerIsNotOwner
    )]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
        constraint = vault.status == VaultStatus::Active
            @ LegacyVaultError::VaultNotActive,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [
            b"beneficiary",
            vault.key().as_ref(),
            beneficiary_entry.beneficiary_wallet.as_ref(),
        ],
        bump  = beneficiary_entry.bump,
        constraint = beneficiary_entry.vault == vault.key()
            @ LegacyVaultError::InvalidPda,
        close = owner,
    )]
    pub beneficiary_entry: Account<'info, BeneficiaryEntry>,
}

// ─────────────────────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(args: SetAssetRuleArgs)]
pub struct SetAssetRule<'info> {
    #[account(
        mut,
        constraint = owner.key() == vault.owner
            @ LegacyVaultError::SignerIsNotOwner
    )]
    pub owner: Signer<'info>,

    #[account(
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
        constraint = vault.status != VaultStatus::Distributed
            @ LegacyVaultError::VaultAlreadyDistributed,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        seeds = [
            b"beneficiary",
            vault.key().as_ref(),
            beneficiary_entry.beneficiary_wallet.as_ref(),
        ],
        bump = beneficiary_entry.bump,
        constraint = beneficiary_entry.vault == vault.key()
            @ LegacyVaultError::InvalidPda,
    )]
    pub beneficiary_entry: Account<'info, BeneficiaryEntry>,

    #[account(
        init_if_needed,
        payer  = owner,
        space  = AssetRule::SIZE,
        seeds  = [
            b"asset_rule",
            vault.key().as_ref(),
            beneficiary_entry.beneficiary_wallet.as_ref(),
            args.mint.as_ref(),
        ],
        bump,
    )]
    pub asset_rule: Account<'info, AssetRule>,

    pub system_program: Program<'info, System>,
}

// ─────────────────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct ClearAssetRule<'info> {
    #[account(
        mut,
        constraint = owner.key() == vault.owner
            @ LegacyVaultError::SignerIsNotOwner
    )]
    pub owner: Signer<'info>,

    #[account(
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [
            b"asset_rule",
            vault.key().as_ref(),
            asset_rule.beneficiary_wallet.as_ref(),
            asset_rule.mint.as_ref(),
        ],
        bump  = asset_rule.bump,
        constraint = asset_rule.vault == vault.key()
            @ LegacyVaultError::InvalidPda,
        close = owner,
    )]
    pub asset_rule: Account<'info, AssetRule>,
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE E — ASSET DEPOSITS & WITHDRAWALS
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Accounts)]
pub struct DepositSol<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,

    #[account(
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
        constraint = vault.status != VaultStatus::Frozen
            @ LegacyVaultError::VaultFrozen,
        constraint = vault.status != VaultStatus::Distributed
            @ LegacyVaultError::VaultAlreadyDistributed,
    )]
    pub vault: Account<'info, Vault>,

    /// CHECK: Vault authority PDA that receives the SOL.
    #[account(
        mut,
        seeds = [b"vault_auth", vault.key().as_ref()],
        bump  = vault.authority_bump,
    )]
    pub vault_authority: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

// ─────────────────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct DepositSpl<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,

    #[account(
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
        constraint = vault.status != VaultStatus::Frozen
            @ LegacyVaultError::VaultFrozen,
        constraint = vault.status != VaultStatus::Distributed
            @ LegacyVaultError::VaultAlreadyDistributed,
    )]
    pub vault: Account<'info, Vault>,

    /// CHECK: Vault authority PDA — token account owner.
    #[account(
        seeds = [b"vault_auth", vault.key().as_ref()],
        bump  = vault.authority_bump,
    )]
    pub vault_authority: UncheckedAccount<'info>,

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        token::mint      = mint,
        token::authority = depositor,
        token::token_program = token_program,
    )]
    pub depositor_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        token::mint      = mint,
        token::authority = vault_authority,
        token::token_program = token_program,
    )]
    pub vault_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

// ─────────────────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct WithdrawSol<'info> {
    #[account(
        constraint = owner.key() == vault.owner
            @ LegacyVaultError::SignerIsNotOwner
    )]
    pub owner: Signer<'info>,

    #[account(
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
        constraint = vault.status == VaultStatus::Active
            @ LegacyVaultError::VaultNotActive,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [b"vault_auth", vault.key().as_ref()],
        bump  = vault.authority_bump,
    )]
    pub vault_authority: SystemAccount<'info>,

    /// CHECK: Recipient; must be the owner's wallet.
    #[account(
        mut,
        constraint = owner_wallet.key() == vault.owner
            @ LegacyVaultError::SignerIsNotOwner,
    )]
    pub owner_wallet: UncheckedAccount<'info>,

    #[account(
        seeds = [b"global_config"],
        bump  = global_config.bump,
        constraint = !global_config.paused @ LegacyVaultError::ProgramPaused,
    )]
    pub global_config: Account<'info, GlobalConfig>,

    pub system_program: Program<'info, System>,
}

// ─────────────────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct WithdrawSpl<'info> {
    #[account(
        constraint = owner.key() == vault.owner
            @ LegacyVaultError::SignerIsNotOwner
    )]
    pub owner: Signer<'info>,

    #[account(
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
        constraint = vault.status == VaultStatus::Active
            @ LegacyVaultError::VaultNotActive,
    )]
    pub vault: Account<'info, Vault>,

    /// CHECK: Vault authority PDA — signs the transfer CPI.
    #[account(
        seeds = [b"vault_auth", vault.key().as_ref()],
        bump  = vault.authority_bump,
    )]
    pub vault_authority: UncheckedAccount<'info>,

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        token::mint      = mint,
        token::authority = vault_authority,
        token::token_program = token_program,
    )]
    pub vault_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        token::mint      = mint,
        token::authority = owner,
        token::token_program = token_program,
    )]
    pub owner_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE F — LIVENESS
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Accounts)]
pub struct CheckIn<'info> {
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
        constraint = vault.status == VaultStatus::Active
            @ LegacyVaultError::VaultNotActive,
    )]
    pub vault: Account<'info, Vault>,

    /// Optional: only required when signer != vault.owner.
    /// Must be an active LivenessDelegate for this vault.
    pub liveness_delegate: Option<Account<'info, LivenessDelegate>>,
}

// ─────────────────────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(args: AddLivenessDelegateArgs)]
pub struct AddLivenessDelegate<'info> {
    #[account(
        mut,
        constraint = owner.key() == vault.owner
            @ LegacyVaultError::SignerIsNotOwner
    )]
    pub owner: Signer<'info>,

    #[account(
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
        constraint = vault.status != VaultStatus::Distributed
            @ LegacyVaultError::VaultAlreadyDistributed,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        init,
        payer  = owner,
        space  = LivenessDelegate::SIZE,
        seeds  = [b"delegate", vault.key().as_ref(), args.delegate_wallet.as_ref()],
        bump,
    )]
    pub liveness_delegate: Account<'info, LivenessDelegate>,

    pub system_program: Program<'info, System>,
}

// ─────────────────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct RemoveLivenessDelegate<'info> {
    #[account(
        mut,
        constraint = owner.key() == vault.owner
            @ LegacyVaultError::SignerIsNotOwner
    )]
    pub owner: Signer<'info>,

    #[account(
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [
            b"delegate",
            vault.key().as_ref(),
            liveness_delegate.delegate_wallet.as_ref(),
        ],
        bump  = liveness_delegate.bump,
        constraint = liveness_delegate.vault == vault.key()
            @ LegacyVaultError::InvalidPda,
        close = owner,
    )]
    pub liveness_delegate: Account<'info, LivenessDelegate>,
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE G — DOCUMENTS
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Accounts)]
#[instruction(args: SetDocumentCommitmentArgs)]
pub struct SetDocumentCommitment<'info> {
    #[account(
        constraint = owner.key() == vault.owner
            @ LegacyVaultError::SignerIsNotOwner
    )]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
        constraint = vault.status != VaultStatus::Distributed
            @ LegacyVaultError::VaultAlreadyDistributed,
    )]
    pub vault: Account<'info, Vault>,
}

// ─────────────────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct RevokeDocumentCommitment<'info> {
    #[account(
        constraint = owner.key() == vault.owner
            @ LegacyVaultError::SignerIsNotOwner
    )]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
    )]
    pub vault: Account<'info, Vault>,
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE H — UNLOCK
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Accounts)]
pub struct InitiateUnlock<'info> {
    #[account(mut)]
    pub guardian: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
        constraint = vault.status == VaultStatus::Active
            @ LegacyVaultError::VaultNotActive,
        constraint = !vault.panic_freeze
            @ LegacyVaultError::VaultFrozen,
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(
        seeds = [
            b"guardian",
            vault.key().as_ref(),
            guardian.key().as_ref(),
        ],
        bump  = guardian_entry.bump,
        constraint = guardian_entry.vault    == vault.key()
            @ LegacyVaultError::InvalidPda,
        constraint = guardian_entry.guardian_wallet == guardian.key()
            @ LegacyVaultError::SignerIsNotGuardian,
        constraint = guardian_entry.status   == GuardianStatus::Active
            @ LegacyVaultError::GuardianNotActive,
        constraint = guardian_entry.role     != GuardianRole::Delegate
            @ LegacyVaultError::DelegateCannotApprove,
    )]
    pub guardian_entry: Box<Account<'info, GuardianEntry>>,

    #[account(
        init,
        payer  = guardian,
        space  = UnlockSession::SIZE,
        seeds  = [b"unlock_session", vault.key().as_ref()],
        bump,
    )]
    pub unlock_session: Box<Account<'info, UnlockSession>>,

    #[account(
        seeds = [b"global_config"],
        bump  = global_config.bump,
        constraint = !global_config.paused @ LegacyVaultError::ProgramPaused,
    )]
    pub global_config: Box<Account<'info, GlobalConfig>>,

    pub system_program: Program<'info, System>,
}

// ─────────────────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct ApproveUnlock<'info> {
    #[account(mut)]
    pub guardian: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
        constraint = vault.status == VaultStatus::Unlocking
            @ LegacyVaultError::VaultNotUnlocking,
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(
        seeds = [
            b"guardian",
            vault.key().as_ref(),
            guardian.key().as_ref(),
        ],
        bump  = guardian_entry.bump,
        constraint = guardian_entry.vault           == vault.key()
            @ LegacyVaultError::InvalidPda,
        constraint = guardian_entry.guardian_wallet == guardian.key()
            @ LegacyVaultError::SignerIsNotGuardian,
        constraint = guardian_entry.status          == GuardianStatus::Active
            @ LegacyVaultError::GuardianNotActive,
        constraint = guardian_entry.role            != GuardianRole::Delegate
            @ LegacyVaultError::DelegateCannotApprove,
    )]
    pub guardian_entry: Box<Account<'info, GuardianEntry>>,

    #[account(
        mut,
        seeds = [b"unlock_session", vault.key().as_ref()],
        bump  = unlock_session.bump,
        constraint = unlock_session.vault  == vault.key()
            @ LegacyVaultError::InvalidPda,
        constraint = unlock_session.status == UnlockSessionStatus::Proposed
            @ LegacyVaultError::UnlockSessionNotProposed,
    )]
    pub unlock_session: Box<Account<'info, UnlockSession>>,

    #[account(
        init,
        payer  = guardian,
        space  = GuardianApproval::SIZE,
        // PDA uniqueness enforces one approval per guardian per session
        seeds  = [
            b"approval",
            unlock_session.key().as_ref(),
            guardian.key().as_ref(),
        ],
        bump,
    )]
    pub guardian_approval: Box<Account<'info, GuardianApproval>>,

    pub system_program: Program<'info, System>,
}

// ─────────────────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct CancelUnlock<'info> {
    #[account(
        constraint = owner.key() == vault.owner
            @ LegacyVaultError::SignerIsNotOwner
    )]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
        constraint = vault.status == VaultStatus::Unlocking
            @ LegacyVaultError::VaultNotUnlocking,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [b"unlock_session", vault.key().as_ref()],
        bump  = unlock_session.bump,
        constraint = unlock_session.vault == vault.key()
            @ LegacyVaultError::InvalidPda,
        // Cannot cancel once distribution is executing
        constraint = unlock_session.status != UnlockSessionStatus::Executing
            @ LegacyVaultError::CannotCancelExecuting,
    )]
    pub unlock_session: Account<'info, UnlockSession>,
}

// ─────────────────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct OpenDispute<'info> {
    /// Can be the vault owner OR the configured arbiter.
    #[account(mut)]
    pub opener: Signer<'info>,

    #[account(
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [b"unlock_session", vault.key().as_ref()],
        bump  = unlock_session.bump,
        constraint = unlock_session.vault == vault.key()
            @ LegacyVaultError::InvalidPda,
    )]
    pub unlock_session: Account<'info, UnlockSession>,

    #[account(
        init,
        payer  = opener,
        space  = DisputeCase::SIZE,
        seeds  = [b"dispute", unlock_session.key().as_ref()],
        bump,
    )]
    pub dispute_case: Account<'info, DisputeCase>,

    pub system_program: Program<'info, System>,
}

// ─────────────────────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(args: ResolveDisputeArgs)]
pub struct ResolveDispute<'info> {
    /// Must be vault.arbiter
    pub arbiter: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
        constraint = vault.arbiter == Some(arbiter.key())
            @ LegacyVaultError::SignerIsNotArbiter,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [b"unlock_session", vault.key().as_ref()],
        bump  = unlock_session.bump,
        constraint = unlock_session.vault == vault.key()
            @ LegacyVaultError::InvalidPda,
    )]
    pub unlock_session: Account<'info, UnlockSession>,

    #[account(
        mut,
        seeds = [b"dispute", unlock_session.key().as_ref()],
        bump  = dispute_case.bump,
        constraint = dispute_case.unlock_session == unlock_session.key()
            @ LegacyVaultError::InvalidPda,
        constraint = dispute_case.status == DisputeStatus::Open
            @ LegacyVaultError::DisputeNotOpen,
    )]
    pub dispute_case: Account<'info, DisputeCase>,
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE I — DISTRIBUTION
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Accounts)]
pub struct InitSolDistribution<'info> {
    #[account(
        mut,
        constraint = owner.key() == vault.owner
            @ LegacyVaultError::SignerIsNotOwner
    )]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
        constraint = vault.total_bps == BPS_DENOMINATOR
            @ LegacyVaultError::SharesNotTenThousand,
        constraint = vault.status != VaultStatus::Frozen
            @ LegacyVaultError::VaultFrozen,
    )]
    pub vault: Account<'info, Vault>,

    /// CHECK: Vault authority — we read its lamport balance to set total_lamports.
    #[account(
        seeds = [b"vault_auth", vault.key().as_ref()],
        bump  = vault.authority_bump,
    )]
    pub vault_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"unlock_session", vault.key().as_ref()],
        bump  = unlock_session.bump,
        constraint = unlock_session.vault == vault.key()
            @ LegacyVaultError::InvalidPda,
        constraint = unlock_session.status == UnlockSessionStatus::Approved
            @ LegacyVaultError::UnlockSessionNotApproved,
    )]
    pub unlock_session: Account<'info, UnlockSession>,

    #[account(
        init,
        payer  = owner,
        space  = SolDistributionSession::SIZE,
        seeds  = [b"dist_sol", unlock_session.key().as_ref()],
        bump,
    )]
    pub sol_distribution_session: Account<'info, SolDistributionSession>,

    pub system_program: Program<'info, System>,
}

// ─────────────────────────────────────────────────────────────────────────────

/// Remaining accounts layout (2 accounts per beneficiary):
///   [2i]   BeneficiaryEntry PDA  (read-only)
///   [2i+1] Beneficiary wallet    (mut, receives lamports)
#[derive(Accounts)]
#[instruction(args: ExecuteBatchArgs)]
pub struct ExecuteSolBatch<'info> {
    #[account(
        constraint = owner.key() == vault.owner
            @ LegacyVaultError::SignerIsNotOwner
    )]
    pub owner: Signer<'info>,

    #[account(
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
        constraint = vault.status != VaultStatus::Frozen
            @ LegacyVaultError::VaultFrozen,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [b"vault_auth", vault.key().as_ref()],
        bump  = vault.authority_bump,
    )]
    pub vault_authority: SystemAccount<'info>,

    #[account(
        seeds = [b"unlock_session", vault.key().as_ref()],
        bump  = unlock_session.bump,
        constraint = unlock_session.vault   == vault.key()
            @ LegacyVaultError::InvalidPda,
        constraint = unlock_session.status  == UnlockSessionStatus::Executing
            @ LegacyVaultError::UnlockAlreadyExecuting,
    )]
    pub unlock_session: Account<'info, UnlockSession>,

    #[account(
        mut,
        seeds = [b"dist_sol", unlock_session.key().as_ref()],
        bump  = sol_distribution_session.bump,
        constraint = sol_distribution_session.unlock_session == unlock_session.key()
            @ LegacyVaultError::InvalidPda,
    )]
    pub sol_distribution_session: Account<'info, SolDistributionSession>,

    #[account(
        seeds = [b"global_config"],
        bump  = global_config.bump,
        constraint = !global_config.paused @ LegacyVaultError::ProgramPaused,
    )]
    pub global_config: Account<'info, GlobalConfig>,

    pub system_program: Program<'info, System>,
    // remaining_accounts: [BeneficiaryEntry, BeneficiaryWallet] × batch_size
}

// ─────────────────────────────────────────────────────────────────────────────
#[derive(Accounts)]
#[instruction(args: InitSplDistributionArgs)]
pub struct InitSplDistribution<'info> {
    #[account(
        mut,
        constraint = owner.key() == vault.owner
            @ LegacyVaultError::SignerIsNotOwner
    )]
    pub owner: Signer<'info>,
    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
        constraint = vault.status != VaultStatus::Frozen
            @ LegacyVaultError::VaultFrozen,
    )]
    pub vault: Box<Account<'info, Vault>>,
    /// CHECK: Vault authority — owner of vault_token_account.
    #[account(
        seeds = [b"vault_auth", vault.key().as_ref()],
        bump  = vault.authority_bump,
    )]
    pub vault_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"unlock_session", vault.key().as_ref()],
        bump  = unlock_session.bump,
        constraint = unlock_session.vault  == vault.key()
            @ LegacyVaultError::InvalidPda,
        constraint = unlock_session.status == UnlockSessionStatus::Executing
            @ LegacyVaultError::UnlockAlreadyExecuting,
    )]
    pub unlock_session: Box<Account<'info, UnlockSession>>,

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        token::mint      = mint,
        token::authority = vault_authority,
        token::token_program = token_program,
    )]
    pub vault_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        init,
        payer  = owner,
        space  = SplDistributionSession::SIZE,
        seeds  = [
            b"dist_spl",
            unlock_session.key().as_ref(),
            mint.key().as_ref(),
        ],
        bump,
    )]
    pub spl_distribution_session: Box<Account<'info, SplDistributionSession>>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

// ─────────────────────────────────────────────────────────────────────────────

/// Remaining accounts layout (3 accounts per beneficiary):
///   [3i]   BeneficiaryEntry PDA       (read-only)
///   [3i+1] Beneficiary wallet         (read-only, used to derive ATA)
///   [3i+2] Beneficiary ATA for mint   (mut, receives tokens)
///   If createMissingAtas: AssociatedToken program + SystemProgram appended last.
#[derive(Accounts)]
#[instruction(args: ExecuteSplBatchArgs)]
pub struct ExecuteSplBatch<'info> {
    #[account(
        mut,
        constraint = owner.key() == vault.owner
            @ LegacyVaultError::SignerIsNotOwner
    )]
    pub owner: Signer<'info>,

    #[account(
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
        constraint = vault.status != VaultStatus::Frozen
            @ LegacyVaultError::VaultFrozen,
    )]
    pub vault: Box<Account<'info, Vault>>,

    /// CHECK: Signs the token transfer CPI.
    #[account(
        seeds = [b"vault_auth", vault.key().as_ref()],
        bump  = vault.authority_bump,
    )]
    pub vault_authority: UncheckedAccount<'info>,

    #[account(
        seeds = [b"unlock_session", vault.key().as_ref()],
        bump  = unlock_session.bump,
        constraint = unlock_session.vault  == vault.key()
            @ LegacyVaultError::InvalidPda,
        constraint = unlock_session.status == UnlockSessionStatus::Executing
            @ LegacyVaultError::UnlockAlreadyExecuting,
    )]
    pub unlock_session: Box<Account<'info, UnlockSession>>,

    #[account(
        mut,
        seeds = [
            b"dist_spl",
            unlock_session.key().as_ref(),
            spl_distribution_session.mint.as_ref(),
        ],
        bump  = spl_distribution_session.bump,
        constraint = spl_distribution_session.unlock_session == unlock_session.key()
            @ LegacyVaultError::InvalidPda,
    )]
    pub spl_distribution_session: Box<Account<'info, SplDistributionSession>>,

    #[account(
        mut,
        token::mint      = mint,
        token::authority = vault_authority,
        token::token_program = token_program,
    )]
    pub vault_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    pub mint: InterfaceAccount<'info, Mint>,

    pub token_program:            Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program:           Program<'info, System>,
    // remaining_accounts: [BeneficiaryEntry, BeneficiaryWallet, BeneficiaryATA] × batch_size
}

// ─────────────────────────────────────────────────────────────────────────────

/// All completed SplDistributionSessions passed in remaining_accounts
/// to prove each is complete before finalizing.
#[derive(Accounts)]
pub struct FinalizeUnlock<'info> {
    #[account(
        constraint = owner.key() == vault.owner
            @ LegacyVaultError::SignerIsNotOwner
    )]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [b"unlock_session", vault.key().as_ref()],
        bump  = unlock_session.bump,
        constraint = unlock_session.vault  == vault.key()
            @ LegacyVaultError::InvalidPda,
        constraint = unlock_session.status == UnlockSessionStatus::Executing
            @ LegacyVaultError::UnlockAlreadyExecuting,
    )]
    pub unlock_session: Account<'info, UnlockSession>,

    #[account(
        seeds = [b"dist_sol", unlock_session.key().as_ref()],
        bump  = sol_distribution_session.bump,
        constraint = sol_distribution_session.is_complete()
            @ LegacyVaultError::SolSessionNotComplete,
    )]
    pub sol_distribution_session: Account<'info, SolDistributionSession>,

    /// Optional: must be Open = false if provided. Enforced in handler.
    pub dispute_case: Option<Account<'info, DisputeCase>>,
    // remaining_accounts: all SplDistributionSession accounts (read-only)
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE J — SUBSCRIPTION
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Accounts)]
#[instruction(args: SetSubscriptionArgs)]
pub struct SetSubscription<'info> {
    #[account(
        mut,
        constraint = owner.key() == vault.owner
            @ LegacyVaultError::SignerIsNotOwner
    )]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [b"subscription", vault.key().as_ref()],
        bump  = subscription_state.bump,
        constraint = subscription_state.vault == vault.key()
            @ LegacyVaultError::InvalidPda,
    )]
    pub subscription_state: Account<'info, SubscriptionState>,

    #[account(
        seeds = [b"global_config"],
        bump  = global_config.bump,
    )]
    pub global_config: Account<'info, GlobalConfig>,

    /// CHECK: Must match global_config.fee_receiver
    #[account(
        mut,
        constraint = fee_receiver.key() == global_config.fee_receiver
            @ LegacyVaultError::InvalidPda,
    )]
    pub fee_receiver: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE K — PROFESSIONAL GUARDIANS
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Accounts)]
#[instruction(args: RegisterProGuardianArgs)]
pub struct RegisterProfessionalGuardian<'info> {
    #[account(mut)]
    pub guardian: Signer<'info>,

    #[account(
        init,
        payer  = guardian,
        space  = ProfessionalGuardianProfile::SIZE,
        seeds  = [b"pro_guardian", guardian.key().as_ref()],
        bump,
    )]
    pub pro_guardian_profile: Account<'info, ProfessionalGuardianProfile>,

    pub system_program: Program<'info, System>,
}

// ─────────────────────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(args: SetKycStatusArgs)]
pub struct SetKycStatus<'info> {
    #[account(
        constraint = admin.key() == global_config.admin
            @ LegacyVaultError::SignerIsNotAdmin
    )]
    pub admin: Signer<'info>,

    #[account(
        seeds = [b"global_config"],
        bump  = global_config.bump,
    )]
    pub global_config: Account<'info, GlobalConfig>,

    #[account(
        mut,
        seeds = [b"pro_guardian", pro_guardian_profile.guardian_wallet.as_ref()],
        bump  = pro_guardian_profile.bump,
    )]
    pub pro_guardian_profile: Account<'info, ProfessionalGuardianProfile>,
}

// ─────────────────────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(args: BondForVaultArgs)]
pub struct BondForVault<'info> {
    #[account(
        mut,
        constraint = guardian.key() == guardian_entry.guardian_wallet
            @ LegacyVaultError::SignerIsNotGuardian
    )]
    pub guardian: Signer<'info>,

    #[account(
        seeds = [b"vault", vault.owner.as_ref(), &[vault.vault_nonce]],
        bump  = vault.bump,
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(
        seeds = [
            b"guardian",
            vault.key().as_ref(),
            guardian.key().as_ref(),
        ],
        bump  = guardian_entry.bump,
        constraint = guardian_entry.vault           == vault.key()
            @ LegacyVaultError::InvalidPda,
        constraint = guardian_entry.role            == GuardianRole::Professional
            @ LegacyVaultError::GuardianNotProfessional,
        constraint = guardian_entry.status          == GuardianStatus::Active
            @ LegacyVaultError::GuardianNotActive,
    )]
    pub guardian_entry: Box<Account<'info, GuardianEntry>>,

    #[account(
        seeds = [b"pro_guardian", guardian.key().as_ref()],
        bump  = pro_guardian_profile.bump,
        constraint = pro_guardian_profile.is_kyc_verified()
            @ LegacyVaultError::KycNotVerified,
    )]
    pub pro_guardian_profile: Box<Account<'info, ProfessionalGuardianProfile>>,

    #[account(
        init,
        payer  = guardian,
        space  = ProfessionalGuardianBond::SIZE,
        seeds  = [b"pro_bond", vault.key().as_ref(), guardian.key().as_ref()],
        bump,
    )]
    pub guardian_bond: Box<Account<'info, ProfessionalGuardianBond>>,

    pub system_program: Program<'info, System>,
}

// ─────────────────────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(args: SlashBondArgs)]
pub struct SlashBond<'info> {
    #[account(
        constraint = admin.key() == global_config.admin
            @ LegacyVaultError::SignerIsNotAdmin
    )]
    pub admin: Signer<'info>,

    #[account(
        seeds = [b"global_config"],
        bump  = global_config.bump,
    )]
    pub global_config: Account<'info, GlobalConfig>,

    #[account(
        mut,
        seeds = [
            b"pro_bond",
            guardian_bond.vault.as_ref(),
            guardian_bond.guardian_wallet.as_ref(),
        ],
        bump  = guardian_bond.bump,
        constraint = !guardian_bond.slashed
            @ LegacyVaultError::AlreadySlashed,
    )]
    pub guardian_bond: Account<'info, ProfessionalGuardianBond>,

    /// CHECK: Must match global_config.fee_receiver
    #[account(
        mut,
        constraint = fee_receiver.key() == global_config.fee_receiver
            @ LegacyVaultError::InvalidPda,
    )]
    pub fee_receiver: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}
