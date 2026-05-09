use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use anchor_spl::token_interface::{transfer_checked, TransferChecked};

pub mod constants;
pub mod context;
pub mod errors;
pub mod events;
pub mod state;

use constants::*;
use context::*;
use errors::LegacyVaultError;
use events::*;
use state::*;

declare_id!("7vdXAgisK4CqAo7xgAQ2K5G8Tg6EiVhWrjToJWAWDoyH");

// ─────────────────────────────────────────────────────────────────────────────
// Instruction argument types
// ─────────────────────────────────────────────────────────────────────────────

/// Arguments for create_vault.
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateVaultArgs {
    pub vault_nonce: u8,
    pub inactivity_threshold: i64,
    pub timelock_duration: i64,
    pub guardian_threshold: u8,
}

/// Arguments for update_vault_settings — all fields are optional.
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateVaultSettingsArgs {
    pub inactivity_threshold: Option<i64>,
    pub timelock_duration:    Option<i64>,
    pub guardian_threshold:   Option<u8>,
    pub arbiter:              Option<Pubkey>,
}

/// Arguments for add_guardian.
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct AddGuardianArgs {
    pub guardian_wallet: Pubkey,
    pub role: GuardianRole,
}

/// Arguments for add_beneficiary.
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct AddBeneficiaryArgs {
    pub beneficiary_wallet: Pubkey,
    pub share_bps: u16,
    pub active: bool,
}

/// Arguments for update_beneficiary — all fields optional.
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateBeneficiaryArgs {
    pub share_bps: Option<u16>,
    pub active:    Option<bool>,
}

/// Arguments for set_asset_rule.
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct SetAssetRuleArgs {
    pub mint:      Pubkey,
    pub mode:      AssetRuleMode,
    pub fixed_bps: Option<u16>,
}

/// Arguments for set_document_commitment.
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct SetDocumentCommitmentArgs {
    pub doc_hash: [u8; 64],
    pub doc_uri:  [u8; 256],
}

/// Arguments for execute_sol_batch / execute_spl_batch.
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ExecuteBatchArgs {
    pub start_index: u8,
    pub batch_size:  u8,
}

/// Arguments for init_spl_distribution.
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitSplDistributionArgs {
    pub create_missing_atas: bool,
}

/// Arguments for execute_spl_batch.
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ExecuteSplBatchArgs {
    pub start_index: u8,
    pub batch_size:  u8,
}

/// Arguments for set_subscription.
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct SetSubscriptionArgs {
    pub tier:             SubscriptionTier,
    pub duration_seconds: i64,
}

/// Arguments for register_professional_guardian.
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct RegisterProGuardianArgs {
    pub name_hash:   [u8; 64],
    pub profile_uri: [u8; 256],
}

/// Arguments for set_kyc_status.
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct SetKycStatusArgs {
    pub status: KycStatus,
}

/// Arguments for bond_for_vault.
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct BondForVaultArgs {
    pub bond_lamports: u64,
}

/// Arguments for slash_bond.
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct SlashBondArgs {
    pub slash_reason_hash: [u8; 64],
}

/// Arguments for update_global_config — all fields optional.
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateGlobalConfigArgs {
    pub paused:                                Option<bool>,
    pub fee_receiver:                          Option<Pubkey>,
    pub creation_fee_lamports:                 Option<u64>,
    pub subscription_fee_pro_lamports:         Option<u64>,
    pub subscription_fee_enterprise_lamports:  Option<u64>,
    pub max_guardians_free:                    Option<u8>,
    pub max_guardians_pro:                     Option<u8>,
    pub max_guardians_enterprise:              Option<u8>,
    pub max_beneficiaries_free:                Option<u8>,
    pub max_beneficiaries_pro:                 Option<u8>,
    pub max_beneficiaries_enterprise:          Option<u8>,
}

/// Arguments for resolve_dispute.
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ResolveDisputeArgs {
    pub resolution:          DisputeStatus,
    pub resolution_note_hash: Option<[u8; 64]>,
}

/// Arguments for add_liveness_delegate.
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct AddLivenessDelegateArgs {
    pub delegate_wallet: Pubkey,
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRAM MODULE
// ─────────────────────────────────────────────────────────────────────────────

#[program]
pub mod legacyvault {
    use super::*;

    // ═══════════════════════════════════════════════════════════════════════
    // MODULE A — GLOBAL ADMIN
    // ═══════════════════════════════════════════════════════════════════════

    /// A1. Initialize the global configuration account.
    /// Called once at deployment by the deployer.
    pub fn initialize_global_config(
        ctx: Context<InitializeGlobalConfig>,
        fee_receiver: Pubkey,
        creation_fee_lamports: u64,
        subscription_fee_pro_lamports: u64,
        subscription_fee_enterprise_lamports: u64,
    ) -> Result<()> {
        let global = &mut ctx.accounts.global_config;
        let clock = Clock::get()?;

        global.admin = ctx.accounts.admin.key();
        global.paused = false;
        global.fee_receiver = fee_receiver;
        global.creation_fee_lamports = creation_fee_lamports;
        global.subscription_fee_pro_lamports = subscription_fee_pro_lamports;
        global.subscription_fee_enterprise_lamports = subscription_fee_enterprise_lamports;

        // Set default tier limits from constants
        global.max_guardians_free       = MAX_GUARDIANS_FREE;
        global.max_guardians_pro        = MAX_GUARDIANS_PRO;
        global.max_guardians_enterprise = MAX_GUARDIANS_ENTERPRISE;

        global.max_beneficiaries_free       = MAX_BENEFICIARIES_FREE;
        global.max_beneficiaries_pro        = MAX_BENEFICIARIES_PRO;
        global.max_beneficiaries_enterprise = MAX_BENEFICIARIES_ENTERPRISE;

        global.bump = ctx.bumps.global_config;

        emit!(GlobalConfigInitialized {
            admin: global.admin,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// A2. Update global configuration fields.
    pub fn update_global_config(
        ctx: Context<UpdateGlobalConfig>,
        args: UpdateGlobalConfigArgs,
    ) -> Result<()> {
        let global = &mut ctx.accounts.global_config;
        let clock = Clock::get()?;

        if let Some(paused) = args.paused {
            global.paused = paused;
        }
        if let Some(fee_receiver) = args.fee_receiver {
            global.fee_receiver = fee_receiver;
        }
        if let Some(creation_fee) = args.creation_fee_lamports {
            global.creation_fee_lamports = creation_fee;
        }
        if let Some(pro_fee) = args.subscription_fee_pro_lamports {
            global.subscription_fee_pro_lamports = pro_fee;
        }
        if let Some(ent_fee) = args.subscription_fee_enterprise_lamports {
            global.subscription_fee_enterprise_lamports = ent_fee;
        }
        if let Some(val) = args.max_guardians_free {
            global.max_guardians_free = val;
        }
        if let Some(val) = args.max_guardians_pro {
            global.max_guardians_pro = val;
        }
        if let Some(val) = args.max_guardians_enterprise {
            global.max_guardians_enterprise = val;
        }
        if let Some(val) = args.max_beneficiaries_free {
            global.max_beneficiaries_free = val;
        }
        if let Some(val) = args.max_beneficiaries_pro {
            global.max_beneficiaries_pro = val;
        }
        if let Some(val) = args.max_beneficiaries_enterprise {
            global.max_beneficiaries_enterprise = val;
        }

        emit!(GlobalConfigUpdated {
            admin: global.admin,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// A3. Pause all non-admin program instructions.
    pub fn pause_program(ctx: Context<PauseProgram>) -> Result<()> {
        let global = &mut ctx.accounts.global_config;
        let clock = Clock::get()?;

        global.paused = true;

        emit!(ProgramPaused {
            admin: ctx.accounts.admin.key(),
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// A4. Unpause the program.
    pub fn unpause_program(ctx: Context<UnpauseProgram>) -> Result<()> {
        let global = &mut ctx.accounts.global_config;
        let clock = Clock::get()?;

        global.paused = false;

        emit!(ProgramUnpaused {
            admin: ctx.accounts.admin.key(),
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MODULE B — VAULT LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════════

    /// B1. Create a new vault.
    pub fn create_vault(
        ctx: Context<CreateVault>,
        args: CreateVaultArgs,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let subscription = &mut ctx.accounts.subscription_state;
        let clock = Clock::get()?;

        // Validate inactivity threshold bounds
        require!(
            args.inactivity_threshold >= MIN_INACTIVITY_SECONDS,
            LegacyVaultError::InactivityThresholdTooLow
        );
        require!(
            args.inactivity_threshold <= MAX_INACTIVITY_SECONDS,
            LegacyVaultError::InactivityThresholdTooHigh
        );

        // Validate timelock bounds
        require!(
            args.timelock_duration >= MIN_TIMELOCK_SECONDS,
            LegacyVaultError::TimelockTooShort
        );
        require!(
            args.timelock_duration <= MAX_TIMELOCK_SECONDS,
            LegacyVaultError::TimelockTooLong
        );

        // Guardian threshold must be at least 1
        require!(
            args.guardian_threshold >= 1,
            LegacyVaultError::GuardianThresholdZero
        );

        // Initialize vault
        vault.owner = ctx.accounts.owner.key();
        vault.vault_nonce = args.vault_nonce;
        vault.status = VaultStatus::Active;
        vault.bump = ctx.bumps.vault;
        vault.authority_bump = ctx.bumps.vault_authority;

        vault.created_at = clock.unix_timestamp;
        vault.last_check_in = clock.unix_timestamp;
        vault.inactivity_threshold = args.inactivity_threshold;
        vault.timelock_duration = args.timelock_duration;

        vault.guardian_threshold = args.guardian_threshold;
        vault.guardian_count = 0;
        vault.beneficiary_count = 0;
        vault.total_bps = 0;

        vault.panic_freeze = false;
        vault.frozen_by = None;
        vault.frozen_at = None;

        vault.doc_hash = [0u8; 64];
        vault.doc_uri = [0u8; 256];
        vault.doc_updated_at = 0;

        vault.arbiter = None;
        vault.unlock_session_count = 0;
        vault.distribution_nonce = 0;
        vault.subscription_tier = SubscriptionTier::Free;
        vault.active_beneficiary_count = 0;
        vault._reserved = [0u8; 62];

        // Enforce OwnerState vault counts limit with manual initialization to save stack space
        let mut owner_state = if ctx.accounts.owner_state.data_is_empty() {
            let bump = ctx.bumps.owner_state;
            let signer_seeds: &[&[u8]] = &[
                b"owner_state",
                ctx.accounts.owner.key.as_ref(),
                &[bump],
            ];
            anchor_lang::solana_program::program::invoke_signed(
                &anchor_lang::solana_program::system_instruction::create_account(
                    ctx.accounts.owner.key,
                    ctx.accounts.owner_state.key,
                    Rent::get()?.minimum_balance(OwnerState::SIZE),
                    OwnerState::SIZE as u64,
                    ctx.program_id,
                ),
                &[
                    ctx.accounts.owner.to_account_info(),
                    ctx.accounts.owner_state.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
                &[signer_seeds],
            )?;
            OwnerState {
                owner: ctx.accounts.owner.key(),
                vault_count: 0,
                bump,
                _reserved: [0u8; 8],
            }
        } else {
            let data = ctx.accounts.owner_state.try_borrow_data()?;
            OwnerState::try_deserialize(&mut &data[..])?
        };

        owner_state.vault_count = owner_state.vault_count.checked_add(1).ok_or(LegacyVaultError::MathOverflow)?;
        require!(
            owner_state.vault_count <= MAX_VAULTS_FREE,
            LegacyVaultError::VaultLimitReached
        );

        let mut owner_state_data = ctx.accounts.owner_state.try_borrow_mut_data()?;
        let mut writer = &mut **owner_state_data;
        owner_state.try_serialize(&mut writer)?;

        // Initialize subscription with Free tier
        subscription.vault = vault.key();
        subscription.owner = ctx.accounts.owner.key();
        subscription.tier = SubscriptionTier::Free;
        subscription.started_at = clock.unix_timestamp;
        subscription.expires_at = i64::MAX; // Free tier never expires
        subscription.auto_renew = false;
        subscription.bump = ctx.bumps.subscription_state;
        subscription._reserved = [0u8; 8];

        // Charge creation fee
        let global = &ctx.accounts.global_config;
        if global.creation_fee_lamports > 0 {
            transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.owner.to_account_info(),
                        to: ctx.accounts.fee_receiver.to_account_info(),
                    },
                ),
                global.creation_fee_lamports,
            )?;
        }

        emit!(VaultCreated {
            vault: vault.key(),
            owner: vault.owner,
            vault_nonce: vault.vault_nonce,
            inactivity_threshold: vault.inactivity_threshold,
            timelock_duration: vault.timelock_duration,
            guardian_threshold: vault.guardian_threshold,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// B2. Update vault custody settings (inactivity threshold, timelock, threshold).
    pub fn update_vault_settings(
        ctx: Context<UpdateVaultSettings>,
        args: UpdateVaultSettingsArgs,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let clock = Clock::get()?;

        if let Some(threshold) = args.inactivity_threshold {
            require!(
                threshold >= MIN_INACTIVITY_SECONDS,
                LegacyVaultError::InactivityThresholdTooLow
            );
            require!(
                threshold <= MAX_INACTIVITY_SECONDS,
                LegacyVaultError::InactivityThresholdTooHigh
            );
            vault.inactivity_threshold = threshold;
        }

        if let Some(timelock) = args.timelock_duration {
            require!(
                timelock >= MIN_TIMELOCK_SECONDS,
                LegacyVaultError::TimelockTooShort
            );
            require!(
                timelock <= MAX_TIMELOCK_SECONDS,
                LegacyVaultError::TimelockTooLong
            );
            vault.timelock_duration = timelock;
        }

        if let Some(threshold) = args.guardian_threshold {
            require!(
                threshold >= 1,
                LegacyVaultError::GuardianThresholdZero
            );
            require!(
                threshold <= vault.guardian_count,
                LegacyVaultError::GuardianThresholdExceedsCount
            );
            vault.guardian_threshold = threshold;
        }

        if let Some(arbiter) = args.arbiter {
            vault.arbiter = Some(arbiter);
        }

        emit!(VaultSettingsUpdated {
            vault: vault.key(),
            owner: vault.owner,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// B3. Freeze the vault — blocks all distribution and unlock progression.
    pub fn freeze_vault(ctx: Context<FreezeVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let clock = Clock::get()?;

        vault.status = VaultStatus::Frozen;
        vault.panic_freeze = true;
        vault.frozen_by = Some(ctx.accounts.owner.key());
        vault.frozen_at = Some(clock.unix_timestamp);

        emit!(VaultFrozen {
            vault: vault.key(),
            frozen_by: ctx.accounts.owner.key(),
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// B4. Unfreeze the vault — restores prior status.
    pub fn unfreeze_vault(ctx: Context<UnfreezeVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let clock = Clock::get()?;

        // Determine which status to restore to
        let restored_status = if ctx.accounts.unlock_session.is_some() {
            // If an unlock session exists, restore to Unlocking
            VaultStatus::Unlocking
        } else {
            VaultStatus::Active
        };

        vault.status = restored_status;
        vault.panic_freeze = false;
        vault.frozen_by = None;
        vault.frozen_at = None;

        emit!(VaultUnfrozen {
            vault: vault.key(),
            unfrozen_by: ctx.accounts.owner.key(),
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MODULE C — GUARDIANS
    // ═══════════════════════════════════════════════════════════════════════

    /// C1. Add a guardian to the vault (owner-only).
    pub fn add_guardian(
        ctx: Context<AddGuardian>,
        args: AddGuardianArgs,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let guardian_entry = &mut ctx.accounts.guardian_entry;
        let global = &ctx.accounts.global_config;
        let clock = Clock::get()?;

        // Check subscription tier limit
        let max_guardians = vault.max_guardians(global);
        require!(
            vault.guardian_count < max_guardians,
            LegacyVaultError::GuardianLimitReached
        );

        // If role is Professional, verify KYC
        if args.role == GuardianRole::Professional {
            if let Some(profile) = &ctx.accounts.pro_guardian_profile {
                require!(
                    profile.is_kyc_verified(),
                    LegacyVaultError::KycNotVerified
                );
            } else {
                return Err(LegacyVaultError::KycNotVerified.into());
            }
        }

        // Initialize guardian entry
        guardian_entry.vault = vault.key();
        guardian_entry.guardian_wallet = args.guardian_wallet;
        guardian_entry.role = args.role.clone();
        guardian_entry.status = GuardianStatus::Pending;
        guardian_entry.added_at = clock.unix_timestamp;
        guardian_entry.accepted_at = None;
        guardian_entry.removed_at = None;
        guardian_entry.bump = ctx.bumps.guardian_entry;
        guardian_entry._reserved = [0u8; 16];

        // Increment guardian count
        vault.guardian_count = vault
            .guardian_count
            .checked_add(1)
            .ok_or(LegacyVaultError::MathOverflow)?;

        emit!(GuardianAdded {
            vault: vault.key(),
            guardian: args.guardian_wallet,
            role: args.role,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// C2. Accept a guardian invitation (guardian-signed).
    pub fn accept_guardian_invitation(
        ctx: Context<AcceptGuardianInvitation>,
    ) -> Result<()> {
        let guardian_entry = &mut ctx.accounts.guardian_entry;
        let clock = Clock::get()?;

        guardian_entry.status = GuardianStatus::Active;
        guardian_entry.accepted_at = Some(clock.unix_timestamp);

        emit!(GuardianAccepted {
            vault: ctx.accounts.vault.key(),
            guardian: guardian_entry.guardian_wallet,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// C3. Remove a guardian (owner-only).
    pub fn remove_guardian(ctx: Context<RemoveGuardian>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let guardian_entry = &ctx.accounts.guardian_entry;
        let clock = Clock::get()?;

        // Ensure resulting count can still meet threshold
        let new_count = vault
            .guardian_count
            .checked_sub(1)
            .ok_or(LegacyVaultError::MathUnderflow)?;
        
        require!(
            vault.guardian_threshold <= new_count,
            LegacyVaultError::GuardianThresholdExceedsCount
        );

        vault.guardian_count = new_count;

        emit!(GuardianRemoved {
            vault: vault.key(),
            guardian: guardian_entry.guardian_wallet,
            timestamp: clock.unix_timestamp,
        });

        // Account is closed via 'close = owner' constraint in context
        Ok(())
    }

    /// C4. Update the M-of-N guardian approval threshold.
    pub fn set_guardian_threshold(
        ctx: Context<SetGuardianThreshold>,
        threshold: u8,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let clock = Clock::get()?;

        require!(
            threshold >= 1,
            LegacyVaultError::GuardianThresholdZero
        );
        require!(
            threshold <= vault.guardian_count,
            LegacyVaultError::GuardianThresholdExceedsCount
        );

        vault.guardian_threshold = threshold;

        emit!(GuardianThresholdUpdated {
            vault: vault.key(),
            new_threshold: threshold,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MODULE D — BENEFICIARIES
    // ═══════════════════════════════════════════════════════════════════════

    /// D1. Add a beneficiary (owner-only).
    pub fn add_beneficiary(
        ctx: Context<AddBeneficiary>,
        args: AddBeneficiaryArgs,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let beneficiary_entry = &mut ctx.accounts.beneficiary_entry;
        let global = &ctx.accounts.global_config;
        let clock = Clock::get()?;

        // Check subscription tier limit
        let max_beneficiaries = vault.max_beneficiaries(global);
        require!(
            vault.beneficiary_count < max_beneficiaries,
            LegacyVaultError::BeneficiaryLimitReached
        );

        // Validate share_bps > 0
        require!(
            args.share_bps > 0,
            LegacyVaultError::InvalidShareBps
        );

        // Initialize beneficiary entry
        beneficiary_entry.vault = vault.key();
        beneficiary_entry.beneficiary_wallet = args.beneficiary_wallet;
        beneficiary_entry.share_bps = args.share_bps;
        beneficiary_entry.active = args.active;
        beneficiary_entry.added_at = clock.unix_timestamp;
        beneficiary_entry.updated_at = clock.unix_timestamp;
        beneficiary_entry.bump = ctx.bumps.beneficiary_entry;
        beneficiary_entry._reserved = [0u8; 16];

        // Update vault totals
        vault.beneficiary_count = vault
            .beneficiary_count
            .checked_add(1)
            .ok_or(LegacyVaultError::MathOverflow)?;

        if args.active {
            vault.total_bps = vault
                .total_bps
                .checked_add(args.share_bps)
                .ok_or(LegacyVaultError::MathOverflow)?;
            vault.active_beneficiary_count = vault
                .active_beneficiary_count
                .checked_add(1)
                .ok_or(LegacyVaultError::MathOverflow)?;
        }

        emit!(BeneficiaryAdded {
            vault: vault.key(),
            beneficiary: args.beneficiary_wallet,
            share_bps: args.share_bps,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// D2. Update a beneficiary's share or active status (owner-only).
    pub fn update_beneficiary(
        ctx: Context<UpdateBeneficiary>,
        args: UpdateBeneficiaryArgs,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let beneficiary_entry = &mut ctx.accounts.beneficiary_entry;
        let clock = Clock::get()?;

        let old_bps = beneficiary_entry.share_bps;
        let old_active = beneficiary_entry.active;

        // Update fields
        if let Some(share_bps) = args.share_bps {
            require!(share_bps > 0, LegacyVaultError::InvalidShareBps);
            beneficiary_entry.share_bps = share_bps;
        }
        if let Some(active) = args.active {
            beneficiary_entry.active = active;
        }

        beneficiary_entry.updated_at = clock.unix_timestamp;
        // Recalculate vault.total_bps and active_beneficiary_count
        // Subtract old contribution
        if old_active {
            vault.total_bps = vault
                .total_bps
                .checked_sub(old_bps)
                .ok_or(LegacyVaultError::MathUnderflow)?;
            vault.active_beneficiary_count = vault
                .active_beneficiary_count
                .checked_sub(1)
                .ok_or(LegacyVaultError::MathUnderflow)?;
        }
        // Add new contribution
        if beneficiary_entry.active {
            vault.total_bps = vault
                .total_bps
                .checked_add(beneficiary_entry.share_bps)
                .ok_or(LegacyVaultError::MathOverflow)?;
            vault.active_beneficiary_count = vault
                .active_beneficiary_count
                .checked_add(1)
                .ok_or(LegacyVaultError::MathOverflow)?;
        }
        emit!(BeneficiaryUpdated {
            vault: vault.key(),
            beneficiary: beneficiary_entry.beneficiary_wallet,
            share_bps: beneficiary_entry.share_bps,
            active: beneficiary_entry.active,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// D3. Remove a beneficiary and reclaim rent (owner-only).
    pub fn remove_beneficiary(ctx: Context<RemoveBeneficiary>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let beneficiary_entry = &ctx.accounts.beneficiary_entry;
        let clock = Clock::get()?;

        // Subtract from total_bps and active_beneficiary_count if active
        if beneficiary_entry.active {
            vault.total_bps = vault
                .total_bps
                .checked_sub(beneficiary_entry.share_bps)
                .ok_or(LegacyVaultError::MathUnderflow)?;
            vault.active_beneficiary_count = vault
                .active_beneficiary_count
                .checked_sub(1)
                .ok_or(LegacyVaultError::MathUnderflow)?;
        }

        vault.beneficiary_count = vault
            .beneficiary_count
            .checked_sub(1)
            .ok_or(LegacyVaultError::MathUnderflow)?;

        emit!(BeneficiaryRemoved {
            vault: vault.key(),
            beneficiary: beneficiary_entry.beneficiary_wallet,
            timestamp: clock.unix_timestamp,
        });

        // Account closed via 'close = owner' constraint
        Ok(())
    }

    /// D4. Set a per-asset distribution rule for a beneficiary (owner-only).
    pub fn set_asset_rule(
        ctx: Context<SetAssetRule>,
        args: SetAssetRuleArgs,
    ) -> Result<()> {
        let asset_rule = &mut ctx.accounts.asset_rule;
        let clock = Clock::get()?;

        // Validate: FixedBps mode requires fixed_bps value
        if args.mode == AssetRuleMode::FixedBps {
            require!(
                args.fixed_bps.is_some(),
                LegacyVaultError::InvalidFixedBps
            );
            let bps = args.fixed_bps.unwrap();
            require!(
                bps > 0 && bps <= BPS_DENOMINATOR,
                LegacyVaultError::InvalidFixedBps
            );
        }

        asset_rule.vault = ctx.accounts.vault.key();
        asset_rule.beneficiary_wallet = ctx.accounts.beneficiary_entry.beneficiary_wallet;
        asset_rule.mint = args.mint;
        asset_rule.mode = args.mode.clone();
        asset_rule.fixed_bps = args.fixed_bps;
        asset_rule.bump = ctx.bumps.asset_rule;
        asset_rule._reserved = [0u8; 8];

        emit!(AssetRuleSet {
            vault: asset_rule.vault,
            beneficiary: asset_rule.beneficiary_wallet,
            mint: asset_rule.mint,
            mode: args.mode,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// D5. Remove an asset rule and reclaim rent (owner-only).
    pub fn clear_asset_rule(ctx: Context<ClearAssetRule>) -> Result<()> {
        let asset_rule = &ctx.accounts.asset_rule;
        let clock = Clock::get()?;

        emit!(AssetRuleCleared {
            vault: asset_rule.vault,
            beneficiary: asset_rule.beneficiary_wallet,
            mint: asset_rule.mint,
            timestamp: clock.unix_timestamp,
        });

        // Account closed via 'close = owner' constraint
        Ok(())
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MODULE E — ASSET DEPOSITS & WITHDRAWALS
    // ═══════════════════════════════════════════════════════════════════════

    /// E1. Deposit SOL into the vault authority.
    pub fn deposit_sol(
        ctx: Context<DepositSol>,
        lamports: u64,
    ) -> Result<()> {
        let clock = Clock::get()?;

        require!(lamports > 0, LegacyVaultError::InvalidFeePaid);

        transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.depositor.to_account_info(),
                    to: ctx.accounts.vault_authority.to_account_info(),
                },
            ),
            lamports,
        )?;

        emit!(Deposited {
            vault: ctx.accounts.vault.key(),
            depositor: ctx.accounts.depositor.key(),
            asset_type: "SOL".to_string(),
            mint: None,
            amount: lamports,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// E2. Deposit SPL tokens (spl-token or token-2022) into the vault.
    pub fn deposit_spl(
        ctx: Context<DepositSpl>,
        amount: u64,
    ) -> Result<()> {
        let clock = Clock::get()?;

        require!(amount > 0, LegacyVaultError::InvalidFeePaid);

        transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.depositor_token_account.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.vault_token_account.to_account_info(),
                    authority: ctx.accounts.depositor.to_account_info(),
                },
            ),
            amount,
            ctx.accounts.mint.decimals,
        )?;

        emit!(Deposited {
            vault: ctx.accounts.vault.key(),
            depositor: ctx.accounts.depositor.key(),
            asset_type: "SPL".to_string(),
            mint: Some(ctx.accounts.mint.key()),
            amount,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// E3. Withdraw SOL (owner-only; only allowed in Active status).
    pub fn withdraw_sol(
        ctx: Context<WithdrawSol>,
        lamports: u64,
    ) -> Result<()> {
        let clock = Clock::get()?;
        let vault = &ctx.accounts.vault;

        require!(lamports > 0, LegacyVaultError::InvalidFeePaid);

        let vault_key = vault.key();
        let authority_bump = vault.authority_bump;
        let bump_slice = &[authority_bump];
        let seeds = &[
            b"vault_auth",
            vault_key.as_ref(),
            bump_slice,
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_authority.to_account_info(),
                to: ctx.accounts.owner_wallet.to_account_info(),
            },
            signer_seeds,
        );
        transfer(cpi_context, lamports)?;

        emit!(Withdrawn {
            vault: vault.key(),
            owner: vault.owner,
            asset_type: "SOL".to_string(),
            mint: None,
            amount: lamports,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// E4. Withdraw SPL tokens (owner-only; only allowed in Active status).
    pub fn withdraw_spl(
        ctx: Context<WithdrawSpl>,
        amount: u64,
    ) -> Result<()> {
        let clock = Clock::get()?;
        let vault = &ctx.accounts.vault;

        require!(amount > 0, LegacyVaultError::InvalidFeePaid);

        let vault_key = vault.key();
        let seeds = &[
            b"vault_auth",
            vault_key.as_ref(),
            &[vault.authority_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.vault_token_account.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.owner_token_account.to_account_info(),
                    authority: ctx.accounts.vault_authority.to_account_info(),
                },
                signer_seeds,
            ),
            amount,
            ctx.accounts.mint.decimals,
        )?;

        emit!(Withdrawn {
            vault: vault.key(),
            owner: vault.owner,
            asset_type: "SPL".to_string(),
            mint: Some(ctx.accounts.mint.key()),
            amount,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MODULE F — LIVENESS
    // ═══════════════════════════════════════════════════════════════════════

    /// F1. Owner (or active delegate) submits a liveness check-in.
    pub fn check_in(ctx: Context<CheckIn>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let signer = ctx.accounts.signer.key();
        let clock = Clock::get()?;

        // If signer is not owner, must be an active delegate
        if signer != vault.owner {
            let delegate = ctx
                .accounts
                .liveness_delegate
                .as_ref()
                .ok_or(LegacyVaultError::Unauthorized)?;
            
            require!(
                delegate.active,
                LegacyVaultError::GuardianNotActive
            );
            require!(
                delegate.delegate_wallet == signer,
                LegacyVaultError::Unauthorized
            );
        }

        vault.last_check_in = clock.unix_timestamp;

        emit!(LivenessCheckIn {
            vault: vault.key(),
            signed_by: signer,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// F2. Add a liveness delegate (owner-only).
    pub fn add_liveness_delegate(
        ctx: Context<AddLivenessDelegate>,
        args: AddLivenessDelegateArgs,
    ) -> Result<()> {
        let delegate = &mut ctx.accounts.liveness_delegate;
        let clock = Clock::get()?;

        delegate.vault = ctx.accounts.vault.key();
        delegate.delegate_wallet = args.delegate_wallet;
        delegate.added_at = clock.unix_timestamp;
        delegate.active = true;
        delegate.bump = ctx.bumps.liveness_delegate;

        emit!(LivenessDelegateAdded {
            vault: delegate.vault,
            delegate: delegate.delegate_wallet,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// F3. Remove a liveness delegate (owner-only).
    pub fn remove_liveness_delegate(
        ctx: Context<RemoveLivenessDelegate>,
    ) -> Result<()> {
        let delegate = &ctx.accounts.liveness_delegate;
        let clock = Clock::get()?;

        emit!(LivenessDelegateRemoved {
            vault: delegate.vault,
            delegate: delegate.delegate_wallet,
            timestamp: clock.unix_timestamp,
        });

        // Account closed via 'close = owner' constraint
        Ok(())
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MODULE G — DOCUMENTS
    // ═══════════════════════════════════════════════════════════════════════

    /// G1. Anchor an encrypted document's hash and URI on-chain.
    pub fn set_document_commitment(
        ctx: Context<SetDocumentCommitment>,
        args: SetDocumentCommitmentArgs,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let clock = Clock::get()?;

        // Validate hash is not all zeros
        require!(
            args.doc_hash != [0u8; 64],
            LegacyVaultError::DocumentHashEmpty
        );

        // Validate URI length (find first zero byte)
        let uri_len = args.doc_uri.iter().position(|&b| b == 0).unwrap_or(256);
        require!(
            uri_len <= MAX_URI_LEN,
            LegacyVaultError::DocumentUriTooLong
        );

        vault.doc_hash = args.doc_hash;
        vault.doc_uri = args.doc_uri;
        vault.doc_updated_at = clock.unix_timestamp;

        emit!(DocumentSet {
            vault: vault.key(),
            doc_hash: args.doc_hash,
            doc_uri_len: uri_len as u8,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// G2. Revoke the current document commitment (zeroes hash + URI).
    pub fn revoke_document_commitment(
        ctx: Context<RevokeDocumentCommitment>,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let clock = Clock::get()?;

        // Ensure there is a commitment to revoke
        require!(
            vault.doc_hash != [0u8; 64],
            LegacyVaultError::NoDocumentCommitment
        );

        vault.doc_hash = [0u8; 64];
        vault.doc_uri = [0u8; 256];
        vault.doc_updated_at = clock.unix_timestamp;

        emit!(DocumentRevoked {
            vault: vault.key(),
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MODULE H — UNLOCK
    // ═══════════════════════════════════════════════════════════════════════

    /// H1. Guardian initiates an unlock session (inactivity threshold must be met).
    pub fn initiate_unlock(ctx: Context<InitiateUnlock>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let unlock_session = &mut ctx.accounts.unlock_session;
        let clock = Clock::get()?;

        // Validate inactivity threshold has been reached
        require!(
            vault.inactivity_threshold_met(clock.unix_timestamp),
            LegacyVaultError::UnlockNotEligible
        );

        // Initialize unlock session
        unlock_session.vault = vault.key();
        unlock_session.initiated_by = ctx.accounts.guardian.key();
        unlock_session.status = UnlockSessionStatus::Proposed;
        unlock_session.initiated_at = clock.unix_timestamp;
        unlock_session.approved_at = None;
        unlock_session.timelock_started_at = None;
        unlock_session.timelock_ends_at = None;
        unlock_session.executed_at = None;
        unlock_session.cancelled_at = None;
        unlock_session.approval_count = 0;
        unlock_session.bump = ctx.bumps.unlock_session;
        unlock_session._reserved = [0u8; 16];

        // Update vault status
        vault.status = VaultStatus::Unlocking;
        vault.unlock_session_count = vault
            .unlock_session_count
            .checked_add(1)
            .ok_or(LegacyVaultError::MathOverflow)?;

        emit!(UnlockInitiated {
            vault: vault.key(),
            unlock_session: unlock_session.key(),
            initiated_by: ctx.accounts.guardian.key(),
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// H2. Guardian approves the active unlock session.
    pub fn approve_unlock(ctx: Context<ApproveUnlock>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let unlock_session = &mut ctx.accounts.unlock_session;
        let guardian_approval = &mut ctx.accounts.guardian_approval;
        let clock = Clock::get()?;

        // Initialize guardian approval (PDA uniqueness prevents double-approval)
        guardian_approval.unlock_session = unlock_session.key();
        guardian_approval.guardian_wallet = ctx.accounts.guardian.key();
        guardian_approval.approved_at = clock.unix_timestamp;
        guardian_approval.bump = ctx.bumps.guardian_approval;

        // Increment approval count
        unlock_session.approval_count = unlock_session
            .approval_count
            .checked_add(1)
            .ok_or(LegacyVaultError::MathOverflow)?;

        emit!(UnlockApproved {
            vault: vault.key(),
            unlock_session: unlock_session.key(),
            guardian: ctx.accounts.guardian.key(),
            approval_count: unlock_session.approval_count,
            timestamp: clock.unix_timestamp,
        });

        // Check if threshold is now met
        if unlock_session.approval_count >= vault.guardian_threshold {
            unlock_session.status = UnlockSessionStatus::Approved;
            unlock_session.approved_at = Some(clock.unix_timestamp);
            unlock_session.timelock_started_at = Some(clock.unix_timestamp);
            
            let timelock_ends = clock
                .unix_timestamp
                .checked_add(vault.timelock_duration)
                .ok_or(LegacyVaultError::MathOverflow)?;
            
            unlock_session.timelock_ends_at = Some(timelock_ends);

            emit!(UnlockThresholdMet {
                vault: vault.key(),
                unlock_session: unlock_session.key(),
                timelock_ends_at: timelock_ends,
                timestamp: clock.unix_timestamp,
            });
        }

        Ok(())
    }

    /// H3. Owner cancels the active unlock session (during Proposed or Approved).
    pub fn cancel_unlock(ctx: Context<CancelUnlock>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let unlock_session = &mut ctx.accounts.unlock_session;
        let clock = Clock::get()?;

        unlock_session.status = UnlockSessionStatus::Cancelled;
        unlock_session.cancelled_at = Some(clock.unix_timestamp);

        // Restore vault to Active status
        vault.status = VaultStatus::Active;

        emit!(UnlockCancelled {
            vault: vault.key(),
            unlock_session: unlock_session.key(),
            cancelled_by: ctx.accounts.owner.key(),
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// H4. Open a dispute blocking distribution finalization.
    pub fn open_dispute(ctx: Context<OpenDispute>) -> Result<()> {
        let vault = &ctx.accounts.vault;
        let unlock_session = &mut ctx.accounts.unlock_session;
        let dispute_case = &mut ctx.accounts.dispute_case;
        let clock = Clock::get()?;

        // Validate opener is owner or arbiter
        let opener = ctx.accounts.opener.key();
        require!(
            opener == vault.owner || vault.arbiter == Some(opener),
            LegacyVaultError::Unauthorized
        );

        // Initialize dispute
        dispute_case.unlock_session = unlock_session.key();
        dispute_case.vault = vault.key();
        dispute_case.opened_by = opener;
        dispute_case.status = DisputeStatus::Open;
        dispute_case.opened_at = clock.unix_timestamp;
        dispute_case.resolved_at = None;
        dispute_case.resolved_by = None;
        dispute_case.resolution_note_hash = None;
        dispute_case.bump = ctx.bumps.dispute_case;
        dispute_case._reserved = [0u8; 16];

        // Block unlock progression
        unlock_session.status = UnlockSessionStatus::Disputed;

        emit!(DisputeOpened {
            vault: vault.key(),
            unlock_session: unlock_session.key(),
            opened_by: opener,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// H5. Arbiter resolves an open dispute (cancel or proceed).
    pub fn resolve_dispute(
        ctx: Context<ResolveDispute>,
        args: ResolveDisputeArgs,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let unlock_session = &mut ctx.accounts.unlock_session;
        let dispute_case = &mut ctx.accounts.dispute_case;
        let clock = Clock::get()?;

        // Validate resolution value
        require!(
            args.resolution == DisputeStatus::ResolvedCancel 
                || args.resolution == DisputeStatus::ResolvedProceed,
            LegacyVaultError::InvalidDisputeResolution
        );

        dispute_case.status = args.resolution.clone();
        dispute_case.resolved_at = Some(clock.unix_timestamp);
        dispute_case.resolved_by = Some(ctx.accounts.arbiter.key());
        dispute_case.resolution_note_hash = args.resolution_note_hash;

        match args.resolution {
            DisputeStatus::ResolvedCancel => {
                unlock_session.status = UnlockSessionStatus::Cancelled;
                unlock_session.cancelled_at = Some(clock.unix_timestamp);
                vault.status = VaultStatus::Active;
            }
            DisputeStatus::ResolvedProceed => {
                unlock_session.status = UnlockSessionStatus::Executing;
                vault.status = VaultStatus::Executing;
            }
            _ => unreachable!(),
        }

        emit!(DisputeResolved {
            vault: vault.key(),
            unlock_session: unlock_session.key(),
            resolved_by: ctx.accounts.arbiter.key(),
            resolution: args.resolution,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MODULE I — DISTRIBUTION
    // ═══════════════════════════════════════════════════════════════════════

    /// I1. Initialize the SOL distribution session.
    /// Requires: vault.total_bps == 10_000 AND timelock elapsed.
    pub fn init_sol_distribution(
        ctx: Context<InitSolDistribution>,
    ) -> Result<()> {
        let vault = &ctx.accounts.vault;
        let unlock_session = &mut ctx.accounts.unlock_session;
        let sol_session = &mut ctx.accounts.sol_distribution_session;
        let clock = Clock::get()?;

        // Validate timelock has elapsed
        require!(
            unlock_session.timelock_elapsed(clock.unix_timestamp),
            LegacyVaultError::TimelockNotElapsed
        );
        // Enforce vault.total_bps == 10_000 (Item 4)
        require!(
            vault.total_bps == BPS_DENOMINATOR,
            LegacyVaultError::SharesNotTenThousand
        );

        let total_beneficiaries = vault.active_beneficiary_count as u8;

        // Get vault authority lamports balance
        let vault_authority_lamports = ctx.accounts.vault_authority.lamports();
        
        // Reserve enough for rent (rough estimate: leave 0.01 SOL)
        let rent_reserve = 10_000_000; // 0.01 SOL in lamports
        let distributable = vault_authority_lamports
            .checked_sub(rent_reserve)
            .ok_or(LegacyVaultError::InsufficientFunds)?;

        // Initialize SOL distribution session
        sol_session.unlock_session = unlock_session.key();
        sol_session.vault = vault.key();
        sol_session.total_beneficiaries = total_beneficiaries;
        sol_session.cursor = 0;
        sol_session.total_lamports = distributable;
        sol_session.distributed_lamports = 0;
        sol_session.initialized_at = clock.unix_timestamp;
        sol_session.completed_at = None;
        sol_session.last_processed_pubkey = None;
        sol_session.bump = ctx.bumps.sol_distribution_session;
        sol_session._reserved = [0u8; 8];
        // Transition unlock session to Executing
        unlock_session.status = UnlockSessionStatus::Executing;

        emit!(SolDistributionInitialized {
            vault: vault.key(),
            unlock_session: unlock_session.key(),
            total_beneficiaries,
            total_lamports: distributable,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// I2. Execute one batch of SOL distributions.
    /// Uses remaining_accounts: [BeneficiaryEntry, BeneficiaryWallet] × batch_size.
    pub fn execute_sol_batch<'info>(
        ctx: Context<'_, '_, '_, 'info, ExecuteSolBatch<'info>>,
        args: ExecuteBatchArgs,
    ) -> Result<()> {
        let vault = &ctx.accounts.vault;
        let sol_session = &mut ctx.accounts.sol_distribution_session;
        let clock = Clock::get()?;

        // Validate cursor matches start_index
        require!(
            args.start_index == sol_session.cursor,
            LegacyVaultError::InvalidBatchCursor
        );

        // Validate batch doesn't exceed total
        let end_index = args
            .start_index
            .checked_add(args.batch_size)
            .ok_or(LegacyVaultError::MathOverflow)?;
        
        require!(
            end_index <= sol_session.total_beneficiaries,
            LegacyVaultError::InvalidRemainingAccounts
        );
        // Parse remaining accounts: [BeneficiaryEntry, BeneficiaryWallet] per beneficiary
        let remaining = &ctx.remaining_accounts;
        require!(
            remaining.len() == (args.batch_size as usize) * 2,
            LegacyVaultError::InvalidRemainingAccounts
        );

        // Validate monotonic progress across batches (Item 5)
        let first_wallet_info = &remaining[1];
        if let Some(last_pub) = sol_session.last_processed_pubkey {
            require!(
                first_wallet_info.key().to_bytes() > last_pub.to_bytes(),
                LegacyVaultError::InvalidMonotonicOrder
            );
        }
        let vault_key = vault.key();
        let authority_bump = vault.authority_bump;
        let bump_slice = &[authority_bump];
        let seeds = &[
            b"vault_auth",
            vault_key.as_ref(),
            bump_slice,
        ];
        let signer_seeds = &[&seeds[..]];

        let mut batch_distributed = 0u64;
        let is_final_batch = end_index == sol_session.total_beneficiaries;

        for i in 0..args.batch_size as usize {
            let beneficiary_entry_info = &remaining[i * 2];
            let beneficiary_wallet_info = &remaining[i * 2 + 1];

            // Deserialize beneficiary entry
            let mut beneficiary_data: &[u8] = &beneficiary_entry_info.try_borrow_data()?;
            let beneficiary_entry = BeneficiaryEntry::try_deserialize(&mut beneficiary_data)?;

            // Validate beneficiary is active
            require!(
                beneficiary_entry.active,
                LegacyVaultError::InvalidRemainingAccounts
            );

            // Validate belongs to this vault
            require!(
                beneficiary_entry.vault == vault.key(),
                LegacyVaultError::InvalidPda
            );

            // Validate wallet matches
            require!(
                beneficiary_entry.beneficiary_wallet == beneficiary_wallet_info.key(),
                LegacyVaultError::InvalidRemainingAccounts
            );

            // Validate ascending order (determinism)
            if i > 0 {
                let prev_wallet_info = &remaining[(i - 1) * 2 + 1];
                require!(
                    beneficiary_wallet_info.key().to_bytes() > prev_wallet_info.key().to_bytes(),
                    LegacyVaultError::InvalidBeneficiaryOrder
                );
            }

            // Calculate amount
            let amount = if is_final_batch && i == (args.batch_size as usize - 1) {
                // Last beneficiary in final batch gets remainder
                sol_session
                    .total_lamports
                    .checked_sub(sol_session.distributed_lamports)
                    .ok_or(LegacyVaultError::MathUnderflow)?
            } else {
                // Pro-rata calculation
                (beneficiary_entry.share_bps as u64)
                    .checked_mul(sol_session.total_lamports)
                    .ok_or(LegacyVaultError::MathOverflow)?
                    .checked_div(BPS_DENOMINATOR as u64)
                    .ok_or(LegacyVaultError::DivisionByZero)?
            };

            // Transfer lamports from vault_authority to beneficiary using safe signed CPI transfer
            if amount > 0 {
                let cpi_context = CpiContext::new_with_signer(
                    ctx.accounts.system_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.vault_authority.to_account_info(),
                        to: beneficiary_wallet_info.to_account_info(),
                    },
                    signer_seeds,
                );
                transfer(cpi_context, amount)?;
            }

            batch_distributed = batch_distributed
                .checked_add(amount)
                .ok_or(LegacyVaultError::MathOverflow)?;
        }

        // Update session
        sol_session.distributed_lamports = sol_session
            .distributed_lamports
            .checked_add(batch_distributed)
            .ok_or(LegacyVaultError::MathOverflow)?;

        sol_session.cursor = end_index;

        let last_processed_wallet = &remaining[((args.batch_size - 1) as usize) * 2 + 1];
        sol_session.last_processed_pubkey = Some(last_processed_wallet.key());

        // Mark complete if final batch
        if is_final_batch {
            sol_session.completed_at = Some(clock.unix_timestamp);
        }
        emit!(SolBatchExecuted {
            vault: vault.key(),
            start_index: args.start_index,
            batch_size: args.batch_size,
            amount_distributed: batch_distributed,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// I3. Initialize an SPL token distribution session for a specific mint.
    pub fn init_spl_distribution(
        ctx: Context<InitSplDistribution>,
        args: InitSplDistributionArgs,
    ) -> Result<()> {
        let vault = &ctx.accounts.vault;
        let unlock_session = &ctx.accounts.unlock_session;
        let spl_session = &mut ctx.accounts.spl_distribution_session;
        let clock = Clock::get()?;

        let total_amount = ctx.accounts.vault_token_account.amount;
        let is_nft = ctx.accounts.mint.supply == 1 && ctx.accounts.mint.decimals == 0;

        let mut entire_to_rules_count = 0;
        let mut fixed_sum = 0u32;

        for account_info in ctx.remaining_accounts.iter() {
            let mut data: &[u8] = &account_info.try_borrow_data()?;
            if let Ok(rule) = AssetRule::try_deserialize(&mut data) {
                if rule.vault == vault.key() && rule.mint == ctx.accounts.mint.key() {
                    if rule.mode == AssetRuleMode::EntireToBeneficiary {
                        entire_to_rules_count += 1;
                    } else if rule.mode == AssetRuleMode::FixedBps {
                        if let Some(bps) = rule.fixed_bps {
                            fixed_sum = fixed_sum.checked_add(bps as u32).ok_or(LegacyVaultError::MathOverflow)?;
                        }
                    }
                }
            }
        }

        if is_nft {
            require!(
                entire_to_rules_count > 0,
                LegacyVaultError::NftRequiresEntireToBeneficiaryRule
            );
            require!(
                entire_to_rules_count == 1,
                LegacyVaultError::MultipleEntireToRules
            );
        } else {
            // Standard token distribution requires total_bps == 10_000
            require!(
                vault.total_bps == BPS_DENOMINATOR,
                LegacyVaultError::SharesNotTenThousand
            );
            require!(
                fixed_sum <= BPS_DENOMINATOR as u32,
                LegacyVaultError::FixedRulesSumExceedsLimit
            );
        }

        let total_beneficiaries = vault.active_beneficiary_count;

        spl_session.unlock_session = unlock_session.key();
        spl_session.vault = vault.key();
        spl_session.mint = ctx.accounts.mint.key();
        spl_session.total_beneficiaries = total_beneficiaries as u8;
        spl_session.cursor = 0;
        spl_session.total_amount = total_amount;
        spl_session.distributed_amount = 0;
        spl_session.create_missing_atas = args.create_missing_atas;
        spl_session.initialized_at = clock.unix_timestamp;
        spl_session.completed_at = None;
        spl_session.bump = ctx.bumps.spl_distribution_session;
        spl_session._reserved = [0u8; 8];

        emit!(SplDistributionInitialized {
            vault: vault.key(),
            unlock_session: unlock_session.key(),
            mint: ctx.accounts.mint.key(),
            total_beneficiaries: total_beneficiaries as u8,
            total_amount,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// I4. Execute one batch of SPL token distributions.
    /// Uses remaining_accounts: [BeneficiaryEntry, BeneficiaryWallet, BeneficiaryATA] × batch_size.
    pub fn execute_spl_batch<'info>(
        ctx: Context<'_, '_, '_, 'info, ExecuteSplBatch<'info>>,
        args: ExecuteSplBatchArgs,
    ) -> Result<()> {
        let vault = &ctx.accounts.vault;
        let spl_session = &mut ctx.accounts.spl_distribution_session;
        let clock = Clock::get()?;

        // Validate cursor matches start_index
        require!(
            args.start_index == spl_session.cursor,
            LegacyVaultError::InvalidBatchCursor
        );

        let end_index = args
            .start_index
            .checked_add(args.batch_size)
            .ok_or(LegacyVaultError::MathOverflow)?;
        
        require!(
            end_index <= spl_session.total_beneficiaries,
            LegacyVaultError::InvalidRemainingAccounts
        );

        // Parse remaining accounts: [BeneficiaryEntry, BeneficiaryWallet, BeneficiaryATA] × batch_size
        let remaining = &ctx.remaining_accounts;
        require!(
            remaining.len() == (args.batch_size as usize) * 3,
            LegacyVaultError::InvalidRemainingAccounts
        );

        let mut batch_distributed = 0u64;
        let is_final_batch = end_index == spl_session.total_beneficiaries;

        // PDA signer seeds for vault authority
        let vault_key = vault.key();
        let seeds = &[
            b"vault_auth",
            vault_key.as_ref(),
            &[vault.authority_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        for i in 0..args.batch_size as usize {
            let beneficiary_entry_info = &remaining[i * 3];
            let beneficiary_wallet_info = &remaining[i * 3 + 1];
            let beneficiary_ata_info = &remaining[i * 3 + 2];

            // Deserialize beneficiary entry
            let mut beneficiary_data: &[u8] = &beneficiary_entry_info.try_borrow_data()?;
            let beneficiary_entry = BeneficiaryEntry::try_deserialize(&mut beneficiary_data)?;

            require!(
                beneficiary_entry.active,
                LegacyVaultError::InvalidRemainingAccounts
            );
            require!(
                beneficiary_entry.vault == vault.key(),
                LegacyVaultError::InvalidPda
            );
            require!(
                beneficiary_entry.beneficiary_wallet == beneficiary_wallet_info.key(),
                LegacyVaultError::InvalidRemainingAccounts
            );

            // Validate ascending order
            if i > 0 {
                let prev_wallet_info = &remaining[(i - 1) * 3 + 1];
                require!(
                    beneficiary_wallet_info.key().to_bytes() > prev_wallet_info.key().to_bytes(),
                    LegacyVaultError::InvalidBeneficiaryOrder
                );
            }

            // If create_missing_atas is true and ATA doesn't exist, create it
            if spl_session.create_missing_atas && beneficiary_ata_info.data_is_empty() {
                // Create ATA using associated_token::create CPI
                anchor_spl::associated_token::create(
                    CpiContext::new(
                        ctx.accounts.associated_token_program.to_account_info(),
                        anchor_spl::associated_token::Create {
                            payer: ctx.accounts.owner.to_account_info(),
                            associated_token: beneficiary_ata_info.clone(),
                            authority: beneficiary_wallet_info.clone(),
                            mint: ctx.accounts.mint.to_account_info(),
                            system_program: ctx.accounts.system_program.to_account_info(),
                            token_program: ctx.accounts.token_program.to_account_info(),
                        },
                    ),
                )?;
            }

            // Calculate amount (pro-rata or with asset rule overrides)
            // For simplicity here we use pro-rata; in production you'd check for AssetRule PDAs
            let amount = if is_final_batch && i == (args.batch_size as usize - 1) {
                // Remainder
                spl_session
                    .total_amount
                    .checked_sub(spl_session.distributed_amount)
                    .ok_or(LegacyVaultError::MathUnderflow)?
            } else {
                (beneficiary_entry.share_bps as u64)
                    .checked_mul(spl_session.total_amount)
                    .ok_or(LegacyVaultError::MathOverflow)?
                    .checked_div(BPS_DENOMINATOR as u64)
                    .ok_or(LegacyVaultError::DivisionByZero)?
            };

            // Transfer tokens
            transfer_checked(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    TransferChecked {
                        from: ctx.accounts.vault_token_account.to_account_info(),
                        mint: ctx.accounts.mint.to_account_info(),
                        to: beneficiary_ata_info.clone(),
                        authority: ctx.accounts.vault_authority.to_account_info(),
                    },
                    signer_seeds,
                ),
                amount,
                ctx.accounts.mint.decimals,
            )?;

            batch_distributed = batch_distributed
                .checked_add(amount)
                .ok_or(LegacyVaultError::MathOverflow)?;
        }

        // Update session
        spl_session.distributed_amount = spl_session
            .distributed_amount
            .checked_add(batch_distributed)
            .ok_or(LegacyVaultError::MathOverflow)?;

        spl_session.cursor = end_index;

        if is_final_batch {
            spl_session.completed_at = Some(clock.unix_timestamp);
        }

        emit!(SplBatchExecuted {
            vault: vault.key(),
            mint: ctx.accounts.mint.key(),
            start_index: args.start_index,
            batch_size: args.batch_size,
            amount_distributed: batch_distributed,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// I5. Finalize the unlock — requires all distribution sessions complete.
    /// Transitions vault to Distributed (terminal state).
    pub fn finalize_unlock<'info>(
        ctx: Context<'_, '_, '_, 'info, FinalizeUnlock<'info>>,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let unlock_session = &mut ctx.accounts.unlock_session;
        let clock = Clock::get()?;

        // Validate SOL session is complete
        require!(
            ctx.accounts.sol_distribution_session.is_complete(),
            LegacyVaultError::SolSessionNotComplete
        );

        // Validate all SPL sessions in remaining_accounts are complete
        for session_info in ctx.remaining_accounts.iter() {
            let mut session_data: &[u8] = &session_info.try_borrow_data()?;
            let spl_session = SplDistributionSession::try_deserialize(&mut session_data)?;
            
            require!(
                spl_session.is_complete(),
                LegacyVaultError::SplSessionNotComplete
            );
        }

        // Validate no open dispute
        if let Some(dispute) = &ctx.accounts.dispute_case {
            require!(
                !dispute.is_open(),
                LegacyVaultError::OpenDisputeBlocksFinalize
            );
        }

        // Finalize
        vault.status = VaultStatus::Distributed;
        unlock_session.status = UnlockSessionStatus::Executed;
        unlock_session.executed_at = Some(clock.unix_timestamp);

        emit!(UnlockFinalized {
            vault: vault.key(),
            unlock_session: unlock_session.key(),
            executed_at: clock.unix_timestamp,
        });

        Ok(())
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MODULE J — SUBSCRIPTION
    // ═══════════════════════════════════════════════════════════════════════

    /// J1. Set or renew subscription tier (triggers fee transfer).
    pub fn set_subscription(
        ctx: Context<SetSubscription>,
        args: SetSubscriptionArgs,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let subscription = &mut ctx.accounts.subscription_state;
        let global = &ctx.accounts.global_config;
        let clock = Clock::get()?;

        // Calculate required fee based on tier and duration
        let fee_per_month = match args.tier {
            SubscriptionTier::Free => 0,
            SubscriptionTier::Pro => global.subscription_fee_pro_lamports,
            SubscriptionTier::Enterprise => global.subscription_fee_enterprise_lamports,
        };

        // Convert duration to months (approximate: 30 days per month)
        let months = (args.duration_seconds as f64) / (60.0 * 60.0 * 24.0 * 30.0);
        let total_fee = (fee_per_month as f64 * months) as u64;

        // If downgrading, check current usage doesn't exceed new tier limits
        let current_tier_level = match vault.subscription_tier {
            SubscriptionTier::Free => 0,
            SubscriptionTier::Pro => 1,
            SubscriptionTier::Enterprise => 2,
        };
        let new_tier_level = match args.tier {
            SubscriptionTier::Free => 0,
            SubscriptionTier::Pro => 1,
            SubscriptionTier::Enterprise => 2,
        };

        if new_tier_level < current_tier_level {
            // Downgrade: check limits
            let max_guardians = match args.tier {
                SubscriptionTier::Free => global.max_guardians_free,
                SubscriptionTier::Pro => global.max_guardians_pro,
                SubscriptionTier::Enterprise => global.max_guardians_enterprise,
            };
            let max_beneficiaries = match args.tier {
                SubscriptionTier::Free => global.max_beneficiaries_free,
                SubscriptionTier::Pro => global.max_beneficiaries_pro,
                SubscriptionTier::Enterprise => global.max_beneficiaries_enterprise,
            };

            require!(
                vault.guardian_count <= max_guardians,
                LegacyVaultError::DowngradeExceedsLimits
            );
            require!(
                vault.beneficiary_count <= max_beneficiaries,
                LegacyVaultError::DowngradeExceedsLimits
            );
        }

        // Transfer fee if non-zero
        if total_fee > 0 {
            transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.owner.to_account_info(),
                        to: ctx.accounts.fee_receiver.to_account_info(),
                    },
                ),
                total_fee,
            )?;
        }

        // Update subscription
        subscription.tier = args.tier.clone();
        subscription.started_at = clock.unix_timestamp;
        subscription.expires_at = clock
            .unix_timestamp
            .checked_add(args.duration_seconds)
            .ok_or(LegacyVaultError::MathOverflow)?;

        // Update vault tier reference
        vault.subscription_tier = args.tier.clone();

        emit!(SubscriptionUpdated {
            vault: vault.key(),
            tier: args.tier,
            expires_at: subscription.expires_at,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MODULE K — PROFESSIONAL GUARDIANS
    // ═══════════════════════════════════════════════════════════════════════

    /// K1. Register a professional guardian profile.
    pub fn register_professional_guardian(
        ctx: Context<RegisterProfessionalGuardian>,
        args: RegisterProGuardianArgs,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.pro_guardian_profile;
        let clock = Clock::get()?;

        profile.guardian_wallet = ctx.accounts.guardian.key();
        profile.kyc_status = KycStatus::Unverified;
        profile.reputation_score = 0;
        profile.total_vaults_served = 0;
        profile.active_vault_count = 0;
        profile.registered_at = clock.unix_timestamp;
        profile.kyc_updated_at = None;
        profile.name_hash = args.name_hash;
        profile.profile_uri = args.profile_uri;
        profile.bump = ctx.bumps.pro_guardian_profile;
        profile._reserved = [0u8; 16];

        emit!(ProfessionalGuardianRegistered {
            guardian: profile.guardian_wallet,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// K2. Admin sets KYC status on a professional guardian profile.
    pub fn set_kyc_status(
        ctx: Context<SetKycStatus>,
        args: SetKycStatusArgs,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.pro_guardian_profile;
        let clock = Clock::get()?;

        profile.kyc_status = args.status.clone();
        profile.kyc_updated_at = Some(clock.unix_timestamp);

        emit!(ProfessionalGuardianKycUpdated {
            guardian: profile.guardian_wallet,
            status: args.status,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// K3. Professional guardian posts a bond for a specific vault.
    pub fn bond_for_vault(
        ctx: Context<BondForVault>,
        args: BondForVaultArgs,
    ) -> Result<()> {
        let bond = &mut ctx.accounts.guardian_bond;
        let clock = Clock::get()?;

        // Transfer bond lamports from guardian to this bond account (escrow)
        transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.guardian.to_account_info(),
                    to: bond.to_account_info(),
                },
            ),
            args.bond_lamports,
        )?;

        bond.vault = ctx.accounts.vault.key();
        bond.guardian_wallet = ctx.accounts.guardian.key();
        bond.bond_lamports = args.bond_lamports;
        bond.bonded_at = clock.unix_timestamp;
        bond.slashed = false;
        bond.slashed_at = None;
        bond.slash_reason_hash = None;
        bond.bump = ctx.bumps.guardian_bond;
        bond._reserved = [0u8; 8];

        emit!(GuardianBonded {
            vault: bond.vault,
            guardian: bond.guardian_wallet,
            bond_lamports: args.bond_lamports,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// K4. Admin slashes a professional guardian's bond (malicious behavior).
    pub fn slash_bond(
        ctx: Context<SlashBond>,
        args: SlashBondArgs,
    ) -> Result<()> {
        let bond = &mut ctx.accounts.guardian_bond;
        let clock = Clock::get()?;

        let slash_amount = bond.bond_lamports;

        // Transfer all bond lamports to fee_receiver
        **bond.to_account_info().try_borrow_mut_lamports()? = 0;
        **ctx.accounts.fee_receiver.try_borrow_mut_lamports()? = ctx
            .accounts
            .fee_receiver
            .lamports()
            .checked_add(slash_amount)
            .ok_or(LegacyVaultError::MathOverflow)?;

        bond.slashed = true;
        bond.slashed_at = Some(clock.unix_timestamp);
        bond.slash_reason_hash = Some(args.slash_reason_hash);

        emit!(GuardianSlashed {
            vault: bond.vault,
            guardian: bond.guardian_wallet,
            slash_amount,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }
}
