use anchor_lang::prelude::*;

#[error_code]
pub enum LegacyVaultError {
    // ── Authorization ────────────────────────────────────────── 6000–6004 ──
    #[msg("Unauthorized: signer does not have permission for this action.")]
    Unauthorized,
    #[msg("Unauthorized: signer is not the vault owner.")]
    SignerIsNotOwner,
    #[msg("Unauthorized: signer is not an active guardian of this vault.")]
    SignerIsNotGuardian,
    #[msg("Unauthorized: signer is not the configured arbiter for this vault.")]
    SignerIsNotArbiter,
    #[msg("Unauthorized: signer is not the program admin.")]
    SignerIsNotAdmin,

    // ── Program state ─────────────────────────────────────────── 6005 ──────
    #[msg("The program is currently paused. Please try again later.")]
    ProgramPaused,

    // ── Vault status ──────────────────────────────────────────── 6006–6011 ─
    #[msg("This action requires the vault to be in Active status.")]
    VaultNotActive,
    #[msg("This action requires the vault to be in Unlocking status.")]
    VaultNotUnlocking,
    #[msg("This action requires the vault to be in Executing status.")]
    VaultNotExecuting,
    #[msg("This action is blocked while the vault is frozen.")]
    VaultFrozen,
    #[msg("This vault has already been fully distributed and is closed.")]
    VaultAlreadyDistributed,
    #[msg("A vault already exists for this owner and nonce.")]
    VaultAlreadyExists,

    // ── Thresholds & bounds ───────────────────────────────────── 6012–6020 ─
    #[msg("Inactivity threshold is below the minimum allowed (30 days).")]
    InactivityThresholdTooLow,
    #[msg("Inactivity threshold exceeds the maximum allowed (365 days).")]
    InactivityThresholdTooHigh,
    #[msg("Timelock duration is below the minimum allowed (1 day).")]
    TimelockTooShort,
    #[msg("Timelock duration exceeds the maximum allowed (90 days).")]
    TimelockTooLong,
    #[msg("Guardian threshold must be at least 1.")]
    GuardianThresholdZero,
    #[msg("Guardian threshold cannot exceed the current number of active guardians.")]
    GuardianThresholdExceedsCount,
    #[msg("Active beneficiary shares must sum to exactly 10,000 basis points before distribution.")]
    SharesNotTenThousand,
    #[msg("Beneficiary share_bps must be greater than zero.")]
    InvalidShareBps,
    #[msg("fixed_bps must be provided and > 0 when mode is FixedBps.")]
    InvalidFixedBps,

    // ── Subscription limits ───────────────────────────────────── 6021–6025 ─
    #[msg("Guardian limit reached for your subscription tier. Upgrade to add more.")]
    GuardianLimitReached,
    #[msg("Beneficiary limit reached for your subscription tier. Upgrade to add more.")]
    BeneficiaryLimitReached,
    #[msg("Vault limit reached for your subscription tier. Upgrade to add more.")]
    VaultLimitReached,
    #[msg("Your subscription has expired. Please renew to continue.")]
    SubscriptionExpired,
    #[msg("Downgrade not possible: current usage exceeds the target tier's limits.")]
    DowngradeExceedsLimits,

    // ── Guardian / unlock ─────────────────────────────────────── 6026–6034 ─
    #[msg("Guardian is not active. They must accept the invitation first.")]
    GuardianNotActive,
    #[msg("This guardian has already approved the current unlock session.")]
    GuardianAlreadyApproved,
    #[msg("Delegate-role guardians cannot approve unlock sessions.")]
    DelegateCannotApprove,
    #[msg("Unlock is not eligible yet: the inactivity threshold has not been reached.")]
    UnlockNotEligible,
    #[msg("The unlock session is not in Proposed status.")]
    UnlockSessionNotProposed,
    #[msg("The unlock session is not in Approved status.")]
    UnlockSessionNotApproved,
    #[msg("The timelock period has not elapsed yet. The owner may still cancel.")]
    TimelockNotElapsed,
    #[msg("The unlock session is already in Executing status.")]
    UnlockAlreadyExecuting,
    #[msg("Cannot cancel: distribution is already in progress.")]
    CannotCancelExecuting,

    // ── Distribution ─────────────────────────────────────────── 6035–6042 ─
    #[msg("SOL distribution session is not complete.")]
    SolSessionNotComplete,
    #[msg("One or more SPL distribution sessions are not complete.")]
    SplSessionNotComplete,
    #[msg("An open dispute must be resolved before finalizing.")]
    OpenDisputeBlocksFinalize,
    #[msg("Batch start_index does not match the current session cursor.")]
    InvalidBatchCursor,
    #[msg("Beneficiaries in remaining accounts are not in ascending pubkey order.")]
    InvalidBeneficiaryOrder,
    #[msg("Remaining accounts layout is invalid for this instruction.")]
    InvalidRemainingAccounts,
    #[msg("Failed to create one or more beneficiary ATAs.")]
    AtaCreationFailed,
    #[msg("Insufficient funds in the vault authority for this operation.")]
    InsufficientFunds,

    // ── Math ─────────────────────────────────────────────────── 6043–6045 ─
    #[msg("Arithmetic overflow.")]
    MathOverflow,
    #[msg("Arithmetic underflow.")]
    MathUnderflow,
    #[msg("Division by zero.")]
    DivisionByZero,

    // ── Token ────────────────────────────────────────────────── 6046–6048 ─
    #[msg("Token program must be spl-token or spl-token-2022.")]
    InvalidTokenProgram,
    #[msg("The provided token account is invalid or does not match expected owner/mint.")]
    InvalidTokenAccount,
    #[msg("The provided mint account is invalid.")]
    InvalidMint,

    // ── Documents ────────────────────────────────────────────── 6049–6051 ─
    #[msg("Document hash cannot be empty (all zeros).")]
    DocumentHashEmpty,
    #[msg("Document URI exceeds maximum allowed length.")]
    DocumentUriTooLong,
    #[msg("No document commitment exists on this vault.")]
    NoDocumentCommitment,

    // ── Professional guardians ────────────────────────────────── 6052–6054 ─
    #[msg("Professional guardian KYC is not verified.")]
    KycNotVerified,
    #[msg("Guardian role is not Professional.")]
    GuardianNotProfessional,
    #[msg("This bond has already been slashed.")]
    AlreadySlashed,

    // ── Dispute ──────────────────────────────────────────────── 6055–6058 ─
    #[msg("A dispute is already open for this unlock session.")]
    DisputeAlreadyOpen,
    #[msg("The dispute is not open.")]
    DisputeNotOpen,
    #[msg("No arbiter is configured for this vault.")]
    NoArbiterConfigured,
    #[msg("Invalid dispute resolution value.")]
    InvalidDisputeResolution,

    // ── General ──────────────────────────────────────────────── 6059–6062 ─
    #[msg("String field exceeds maximum allowed length.")]
    StringTooLong,
    #[msg("Derived PDA does not match the provided account.")]
    InvalidPda,
    #[msg("Account is already initialized.")]
    AccountAlreadyInitialized,
    #[msg("Fee amount provided does not match the required fee.")]
    InvalidFeePaid,
    #[msg("NFT distributions require a registered entire-to-beneficiary rule.")]
    NftRequiresEntireToBeneficiaryRule,
    #[msg("Multiple entire-to-beneficiary rules found for the same mint.")]
    MultipleEntireToRules,
    #[msg("Fixed rules sum exceeds the 10,000 basis points limit.")]
    FixedRulesSumExceedsLimit,
    #[msg("The first beneficiary wallet in this batch does not satisfy monotonic progress.")]
    InvalidMonotonicOrder,
}
