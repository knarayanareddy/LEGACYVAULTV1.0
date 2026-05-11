import {
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { connection, program } from '../config/anchor';
import {
  findVaultPda,
  findVaultAuthorityPda,
  findGuardianEntryPda,
  findBeneficiaryEntryPda,
  findUnlockSessionPda,
  findSolDistSessionPda,
  findSplDistSessionPda,
  findGlobalConfigPda,
  findSubscriptionPda,
  findGuardianApprovalPda,
  findOwnerStatePda,
} from '../lib/pda';
import { TxBuilderResponse } from '../types/api';
import { prisma } from './vaultService';

const DEFAULT_COMPUTE_UNITS = 200_000;
const DISTRIBUTION_COMPUTE_UNITS = 400_000;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function buildVersionedTx(
  feePayer: PublicKey,
  instructions: any[],
  computeUnits: number = DEFAULT_COMPUTE_UNITS
): Promise<string> {
  const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: computeUnits,
  });

  const { blockhash } = await connection.getLatestBlockhash('confirmed');

  const message = new TransactionMessage({
    payerKey: feePayer,
    recentBlockhash: blockhash,
    instructions: [computeBudgetIx, ...instructions],
  }).compileToV0Message();

  const tx = new VersionedTransaction(message);
  const serialized = Buffer.from(tx.serialize()).toString('base64');
  return serialized;
}

function estimateFee(computeUnits: number): number {
  return 5000 + Math.ceil(computeUnits / 1000);
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE A+B — ADMIN & VAULT
// ─────────────────────────────────────────────────────────────────────────────

export async function buildCreateVaultTx(
  feePayer: string,
  vaultNonce: number,
  inactivityThreshold: number,
  timelockDuration: number,
  guardianThreshold: number
): Promise<TxBuilderResponse> {
  const owner = new PublicKey(feePayer);
  const [vaultPda] = findVaultPda(owner, vaultNonce);
  const [vaultAuthorityPda] = findVaultAuthorityPda(vaultPda);
  const [subscriptionPda] = findSubscriptionPda(vaultPda);
  const [globalConfigPda] = findGlobalConfigPda();
  const [ownerStatePda] = findOwnerStatePda(owner);

  // Fetch on-chain global config to get fee_receiver
  const globalConfig = await program.account.globalConfig.fetch(globalConfigPda);
  const feeReceiver = globalConfig.feeReceiver as PublicKey;

  const ix = await program.methods
    .createVault({
      vaultNonce,
      inactivityThreshold: new BN(inactivityThreshold),
      timelockDuration: new BN(timelockDuration),
      guardianThreshold,
    })
    .accounts({
      owner,
      vault: vaultPda,
      vaultAuthority: vaultAuthorityPda,
      subscriptionState: subscriptionPda,
      globalConfig: globalConfigPda,
      feeReceiver,
      ownerState: ownerStatePda,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const transaction = await buildVersionedTx(owner, [ix]);
  return { 
    transaction, 
    estimatedFee: estimateFee(DEFAULT_COMPUTE_UNITS), 
    computeUnits: DEFAULT_COMPUTE_UNITS, 
    warnings: [] 
  };
}

export async function buildUpdateVaultSettingsTx(
  feePayer: string,
  vault: string,
  inactivityThreshold?: number,
  timelockDuration?: number,
  guardianThreshold?: number
): Promise<TxBuilderResponse> {
  const owner = new PublicKey(feePayer);
  const vaultPda = new PublicKey(vault);

  const ix = await program.methods
    .updateVaultSettings({
      inactivityThreshold: inactivityThreshold ? new BN(inactivityThreshold) : null,
      timelockDuration: timelockDuration ? new BN(timelockDuration) : null,
      guardianThreshold: guardianThreshold ?? null,
      arbiter: null,
    })
    .accounts({
      owner,
      vault: vaultPda,
    })
    .instruction();

  const transaction = await buildVersionedTx(owner, [ix]);
  return { 
    transaction, 
    estimatedFee: estimateFee(DEFAULT_COMPUTE_UNITS), 
    computeUnits: DEFAULT_COMPUTE_UNITS, 
    warnings: [] 
  };
}

export async function buildFreezeVaultTx(
  feePayer: string,
  vault: string
): Promise<TxBuilderResponse> {
  const owner = new PublicKey(feePayer);
  const vaultPda = new PublicKey(vault);

  const ix = await program.methods
    .freezeVault()
    .accounts({
      owner,
      vault: vaultPda,
    })
    .instruction();

  const transaction = await buildVersionedTx(owner, [ix]);
  return { 
    transaction, 
    estimatedFee: estimateFee(DEFAULT_COMPUTE_UNITS), 
    computeUnits: DEFAULT_COMPUTE_UNITS, 
    warnings: ['Vault will be frozen.'] 
  };
}

export async function buildUnfreezeVaultTx(
  feePayer: string,
  vault: string
): Promise<TxBuilderResponse> {
  const owner = new PublicKey(feePayer);
  const vaultPda = new PublicKey(vault);
  
  const vaultAccount = await program.account.vault.fetch(vaultPda);
  const sessionId = vaultAccount.activeUnlockSessionId;
  if (sessionId === null) throw new Error('No active unlock session found');
  
  const [unlockSessionPda] = findUnlockSessionPda(vaultPda, sessionId);

  const ix = await program.methods
    .unfreezeVault()
    .accounts({
      owner,
      vault: vaultPda,
      unlockSession: unlockSessionPda,
    })
    .instruction();

  const transaction = await buildVersionedTx(owner, [ix]);
  return { 
    transaction, 
    estimatedFee: estimateFee(DEFAULT_COMPUTE_UNITS), 
    computeUnits: DEFAULT_COMPUTE_UNITS, 
    warnings: [] 
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE C — GUARDIANS
// ─────────────────────────────────────────────────────────────────────────────

export async function buildAddGuardianTx(
  feePayer: string,
  vault: string,
  guardianWallet: string,
  role: string
): Promise<TxBuilderResponse> {
  const owner = new PublicKey(feePayer);
  const vaultPda = new PublicKey(vault);
  const guardian = new PublicKey(guardianWallet);
  const [guardianEntryPda] = findGuardianEntryPda(vaultPda, guardian);
  const [globalConfigPda] = findGlobalConfigPda();

  // Convert role string to Enum variant
  const guardianRole = { [role.charAt(0).toUpperCase() + role.slice(1)]: {} };

  const ix = await program.methods
    .addGuardian({
      guardianWallet: guardian,
      role: guardianRole,
    })
    .accounts({
      owner,
      vault: vaultPda,
      guardianEntry: guardianEntryPda,
      globalConfig: globalConfigPda,
      proGuardianProfile: null, // Default to null for now
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const transaction = await buildVersionedTx(owner, [ix]);
  return { 
    transaction, 
    estimatedFee: estimateFee(DEFAULT_COMPUTE_UNITS), 
    computeUnits: DEFAULT_COMPUTE_UNITS, 
    warnings: [] 
  };
}

export async function buildRemoveGuardianTx(
  feePayer: string,
  vault: string,
  guardianWallet: string
): Promise<TxBuilderResponse> {
  const owner = new PublicKey(feePayer);
  const vaultPda = new PublicKey(vault);
  const guardian = new PublicKey(guardianWallet);
  const [guardianEntryPda] = findGuardianEntryPda(vaultPda, guardian);

  const ix = await program.methods
    .removeGuardian()
    .accounts({
      owner,
      vault: vaultPda,
      guardianEntry: guardianEntryPda,
    })
    .instruction();

  const transaction = await buildVersionedTx(owner, [ix]);
  return { 
    transaction, 
    estimatedFee: estimateFee(DEFAULT_COMPUTE_UNITS), 
    computeUnits: DEFAULT_COMPUTE_UNITS, 
    warnings: [] 
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE D — BENEFICIARIES
// ─────────────────────────────────────────────────────────────────────────────

export async function buildAddBeneficiaryTx(
  feePayer: string,
  vault: string,
  beneficiaryWallet: string,
  shareBps: number,
  active: boolean
): Promise<TxBuilderResponse> {
  const owner = new PublicKey(feePayer);
  const vaultPda = new PublicKey(vault);
  const beneficiary = new PublicKey(beneficiaryWallet);
  const [beneficiaryEntryPda] = findBeneficiaryEntryPda(vaultPda, beneficiary);
  const [globalConfigPda] = findGlobalConfigPda();

  const ix = await program.methods
    .addBeneficiary({
      beneficiaryWallet: beneficiary,
      shareBps,
      active,
    })
    .accounts({
      owner,
      vault: vaultPda,
      beneficiaryEntry: beneficiaryEntryPda,
      globalConfig: globalConfigPda,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const transaction = await buildVersionedTx(owner, [ix]);
  return { 
    transaction, 
    estimatedFee: estimateFee(DEFAULT_COMPUTE_UNITS), 
    computeUnits: DEFAULT_COMPUTE_UNITS, 
    warnings: [] 
  };
}

export async function buildUpdateBeneficiaryTx(
  feePayer: string,
  vault: string,
  beneficiaryWallet: string,
  shareBps?: number,
  active?: boolean
): Promise<TxBuilderResponse> {
  const owner = new PublicKey(feePayer);
  const vaultPda = new PublicKey(vault);
  const beneficiary = new PublicKey(beneficiaryWallet);
  const [beneficiaryEntryPda] = findBeneficiaryEntryPda(vaultPda, beneficiary);

  const ix = await program.methods
    .updateBeneficiary({
      shareBps: shareBps ?? null,
      active: active ?? null,
    })
    .accounts({
      owner,
      vault: vaultPda,
      beneficiaryEntry: beneficiaryEntryPda,
    })
    .instruction();

  const transaction = await buildVersionedTx(owner, [ix]);
  return { 
    transaction, 
    estimatedFee: estimateFee(DEFAULT_COMPUTE_UNITS), 
    computeUnits: DEFAULT_COMPUTE_UNITS, 
    warnings: [] 
  };
}

export async function buildRemoveBeneficiaryTx(
  feePayer: string,
  vault: string,
  beneficiaryWallet: string
): Promise<TxBuilderResponse> {
  const owner = new PublicKey(feePayer);
  const vaultPda = new PublicKey(vault);
  const beneficiary = new PublicKey(beneficiaryWallet);
  const [beneficiaryEntryPda] = findBeneficiaryEntryPda(vaultPda, beneficiary);

  const ix = await program.methods
    .removeBeneficiary()
    .accounts({
      owner,
      vault: vaultPda,
      beneficiaryEntry: beneficiaryEntryPda,
    })
    .instruction();

  const transaction = await buildVersionedTx(owner, [ix]);
  return { 
    transaction, 
    estimatedFee: estimateFee(DEFAULT_COMPUTE_UNITS), 
    computeUnits: DEFAULT_COMPUTE_UNITS, 
    warnings: [] 
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE E — DEPOSITS & WITHDRAWALS
// ─────────────────────────────────────────────────────────────────────────────

export async function buildDepositSolTx(
  feePayer: string,
  vault: string,
  lamports: number
): Promise<TxBuilderResponse> {
  const depositor = new PublicKey(feePayer);
  const vaultPda = new PublicKey(vault);
  const [vaultAuthorityPda] = findVaultAuthorityPda(vaultPda);

  const ix = await program.methods
    .depositSol(new BN(lamports))
    .accounts({
      depositor,
      vault: vaultPda,
      vaultAuthority: vaultAuthorityPda,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const transaction = await buildVersionedTx(depositor, [ix]);
  return { 
    transaction, 
    estimatedFee: estimateFee(DEFAULT_COMPUTE_UNITS), 
    computeUnits: DEFAULT_COMPUTE_UNITS, 
    warnings: [] 
  };
}

export async function buildWithdrawSolTx(
  feePayer: string,
  vault: string,
  lamports: number
): Promise<TxBuilderResponse> {
  const owner = new PublicKey(feePayer);
  const vaultPda = new PublicKey(vault);
  const [vaultAuthorityPda] = findVaultAuthorityPda(vaultPda);

  const ix = await program.methods
    .withdrawSol(new BN(lamports))
    .accounts({
      owner,
      vault: vaultPda,
      vaultAuthority: vaultAuthorityPda,
      ownerWallet: owner,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const transaction = await buildVersionedTx(owner, [ix]);
  return { 
    transaction, 
    estimatedFee: estimateFee(DEFAULT_COMPUTE_UNITS), 
    computeUnits: DEFAULT_COMPUTE_UNITS, 
    warnings: [] 
  };
}

export async function buildDepositSplTx(
  feePayer: string,
  vault: string,
  mint: string,
  amount: number
): Promise<TxBuilderResponse> {
  const depositor = new PublicKey(feePayer);
  const vaultPda = new PublicKey(vault);
  const [vaultAuthorityPda] = findVaultAuthorityPda(vaultPda);
  const mintPda = new PublicKey(mint);

  const depositorAta = getAssociatedTokenAddressSync(mintPda, depositor);
  const vaultAta = getAssociatedTokenAddressSync(mintPda, vaultAuthorityPda, true);

  const ix = await program.methods
    .depositSpl(new BN(amount))
    .accounts({
      depositor,
      vault: vaultPda,
      vaultAuthority: vaultAuthorityPda,
      mint: mintPda,
      depositorTokenAccount: depositorAta,
      vaultTokenAccount: vaultAta,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const transaction = await buildVersionedTx(depositor, [ix]);
  return { 
    transaction, 
    estimatedFee: estimateFee(DEFAULT_COMPUTE_UNITS), 
    computeUnits: DEFAULT_COMPUTE_UNITS, 
    warnings: [] 
  };
}

export async function buildWithdrawSplTx(
  feePayer: string,
  vault: string,
  mint: string,
  amount: number
): Promise<TxBuilderResponse> {
  const owner = new PublicKey(feePayer);
  const vaultPda = new PublicKey(vault);
  const [vaultAuthorityPda] = findVaultAuthorityPda(vaultPda);
  const mintPda = new PublicKey(mint);

  const vaultAta = getAssociatedTokenAddressSync(mintPda, vaultAuthorityPda, true);
  const ownerAta = getAssociatedTokenAddressSync(mintPda, owner);

  const ix = await program.methods
    .withdrawSpl(new BN(amount))
    .accounts({
      owner,
      vault: vaultPda,
      vaultAuthority: vaultAuthorityPda,
      mint: mintPda,
      vaultTokenAccount: vaultAta,
      ownerTokenAccount: ownerAta,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();

  const transaction = await buildVersionedTx(owner, [ix]);
  return { 
    transaction, 
    estimatedFee: estimateFee(DEFAULT_COMPUTE_UNITS), 
    computeUnits: DEFAULT_COMPUTE_UNITS, 
    warnings: [] 
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE F — LIVENESS & DOCUMENTS
// ─────────────────────────────────────────────────────────────────────────────

export async function buildCheckInTx(
  feePayer: string,
  vault: string
): Promise<TxBuilderResponse> {
  const signer = new PublicKey(feePayer);
  const vaultPda = new PublicKey(vault);

  const ix = await program.methods
    .checkIn()
    .accounts({
      signer,
      vault: vaultPda,
      livenessDelegate: null, // Assume owner for now
    })
    .instruction();

  const transaction = await buildVersionedTx(signer, [ix]);
  return { 
    transaction, 
    estimatedFee: estimateFee(DEFAULT_COMPUTE_UNITS), 
    computeUnits: DEFAULT_COMPUTE_UNITS, 
    warnings: [] 
  };
}

export async function buildSetDocumentCommitmentTx(
  feePayer: string,
  vault: string,
  docHash: string,
  docUri: string
): Promise<TxBuilderResponse> {
  const owner = new PublicKey(feePayer);
  const vaultPda = new PublicKey(vault);

  // Convert docHash (hex/b64) to 64-byte array
  const hashBytes = Buffer.from(docHash, 'hex'); 
  const paddedHash = Buffer.alloc(64);
  hashBytes.copy(paddedHash);

  // Convert docUri to 256-byte array
  const uriBytes = Buffer.from(docUri);
  const paddedUri = Buffer.alloc(256);
  uriBytes.copy(paddedUri);

  const ix = await program.methods
    .setDocumentCommitment({
      docHash: Array.from(paddedHash),
      docUri: Array.from(paddedUri),
    })
    .accounts({
      owner,
      vault: vaultPda,
    })
    .instruction();

  const transaction = await buildVersionedTx(owner, [ix]);
  return { 
    transaction, 
    estimatedFee: estimateFee(DEFAULT_COMPUTE_UNITS), 
    computeUnits: DEFAULT_COMPUTE_UNITS, 
    warnings: [] 
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE G — UNLOCK
// ─────────────────────────────────────────────────────────────────────────────

export async function buildInitiateUnlockTx(
  feePayer: string,
  vault: string
): Promise<TxBuilderResponse> {
  const guardian = new PublicKey(feePayer);
  const vaultPda = new PublicKey(vault);
  
  const vaultAccount = await program.account.vault.fetch(vaultPda);
  const sessionCount = vaultAccount.unlockSessionCount;
  
  const [guardianEntryPda] = findGuardianEntryPda(vaultPda, guardian);
  const [unlockSessionPda] = findUnlockSessionPda(vaultPda, sessionCount);
  const [globalConfigPda] = findGlobalConfigPda();

  const ix = await program.methods
    .initiateUnlock()
    .accounts({
      guardian,
      vault: vaultPda,
      guardianEntry: guardianEntryPda,
      unlockSession: unlockSessionPda,
      globalConfig: globalConfigPda,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const transaction = await buildVersionedTx(guardian, [ix]);
  return { 
    transaction, 
    estimatedFee: estimateFee(DEFAULT_COMPUTE_UNITS), 
    computeUnits: DEFAULT_COMPUTE_UNITS, 
    warnings: [] 
  };
}

export async function buildApproveUnlockTx(
  feePayer: string,
  vault: string
): Promise<TxBuilderResponse> {
  const guardian = new PublicKey(feePayer);
  const vaultPda = new PublicKey(vault);

  const vaultAccount = await program.account.vault.fetch(vaultPda);
  const sessionId = vaultAccount.activeUnlockSessionId;
  if (sessionId === null) throw new Error('No active unlock session found');

  const [guardianEntryPda] = findGuardianEntryPda(vaultPda, guardian);
  const [unlockSessionPda] = findUnlockSessionPda(vaultPda, sessionId);
  const [approvalPda] = findGuardianApprovalPda(unlockSessionPda, guardian);

  const ix = await program.methods
    .approveUnlock()
    .accounts({
      guardian,
      vault: vaultPda,
      guardianEntry: guardianEntryPda,
      unlockSession: unlockSessionPda,
      guardianApproval: approvalPda,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const transaction = await buildVersionedTx(guardian, [ix]);
  return { 
    transaction, 
    estimatedFee: estimateFee(DEFAULT_COMPUTE_UNITS), 
    computeUnits: DEFAULT_COMPUTE_UNITS, 
    warnings: [] 
  };
}

export async function buildCancelUnlockTx(
  feePayer: string,
  vault: string
): Promise<TxBuilderResponse> {
  const owner = new PublicKey(feePayer);
  const vaultPda = new PublicKey(vault);

  const vaultAccount = await program.account.vault.fetch(vaultPda);
  const sessionId = vaultAccount.activeUnlockSessionId;
  if (sessionId === null) throw new Error('No active unlock session found');

  const [unlockSessionPda] = findUnlockSessionPda(vaultPda, sessionId);

  const ix = await program.methods
    .cancelUnlock()
    .accounts({
      owner,
      vault: vaultPda,
      unlockSession: unlockSessionPda,
    })
    .instruction();

  const transaction = await buildVersionedTx(owner, [ix]);
  return { 
    transaction, 
    estimatedFee: estimateFee(DEFAULT_COMPUTE_UNITS), 
    computeUnits: DEFAULT_COMPUTE_UNITS, 
    warnings: [] 
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE H — DISTRIBUTION
// ─────────────────────────────────────────────────────────────────────────────

export async function buildInitSolDistributionTx(
  feePayer: string,
  vault: string
): Promise<TxBuilderResponse> {
  const owner = new PublicKey(feePayer);
  const vaultPda = new PublicKey(vault);

  const vaultAccount = await program.account.vault.fetch(vaultPda);
  const sessionId = vaultAccount.activeUnlockSessionId;
  if (sessionId === null) throw new Error('No active unlock session found');

  const [vaultAuthorityPda] = findVaultAuthorityPda(vaultPda);
  const [unlockSessionPda] = findUnlockSessionPda(vaultPda, sessionId);
  const [solDistPda] = findSolDistSessionPda(unlockSessionPda);

  const ix = await program.methods
    .initSolDistribution()
    .accounts({
      owner,
      vault: vaultPda,
      vaultAuthority: vaultAuthorityPda,
      unlockSession: unlockSessionPda,
      solDistributionSession: solDistPda,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const transaction = await buildVersionedTx(owner, [ix]);
  return { 
    transaction, 
    estimatedFee: estimateFee(DEFAULT_COMPUTE_UNITS), 
    computeUnits: DEFAULT_COMPUTE_UNITS, 
    warnings: [] 
  };
}

export async function buildExecSolDistributionBatchTx(
  feePayer: string,
  vault: string,
  startIndex: number,
  batchSize: number
): Promise<TxBuilderResponse> {
  const owner = new PublicKey(feePayer);
  const vaultPda = new PublicKey(vault);

  const vaultAccount = await program.account.vault.fetch(vaultPda);
  const sessionId = vaultAccount.activeUnlockSessionId;
  if (sessionId === null) throw new Error('No active unlock session found');

  const [vaultAuthorityPda] = findVaultAuthorityPda(vaultPda);
  const [unlockSessionPda] = findUnlockSessionPda(vaultPda, sessionId);
  const [solDistPda] = findSolDistSessionPda(unlockSessionPda);

  // In a real scenario, we'd fetch all active beneficiaries via prisma
  // and pass them as remaining accounts [BeneficiaryEntry, BeneficiaryWallet].
  const beneficiaries = await prisma.beneficiary.findMany({
    where: { vaultPubkey: vault, active: true },
    orderBy: { addedAt: 'asc' },
    skip: startIndex,
    take: batchSize,
  });

  const remainingAccounts = beneficiaries.flatMap((b) => [
    { pubkey: new PublicKey(b.id), isWritable: false, isSigner: false },
    { pubkey: new PublicKey(b.beneficiaryWallet), isWritable: true, isSigner: false },
  ]);

  const ix = await program.methods
    .executeSolBatch({
      startIndex,
      batchSize,
    })
    .accounts({
      owner,
      vault: vaultPda,
      vaultAuthority: vaultAuthorityPda,
      unlockSession: unlockSessionPda,
      solDistributionSession: solDistPda,
      systemProgram: SystemProgram.programId,
    })
    .remainingAccounts(remainingAccounts)
    .instruction();

  const transaction = await buildVersionedTx(owner, [ix], DISTRIBUTION_COMPUTE_UNITS);
  return { 
    transaction, 
    estimatedFee: estimateFee(DISTRIBUTION_COMPUTE_UNITS), 
    computeUnits: DISTRIBUTION_COMPUTE_UNITS, 
    warnings: [] 
  };
}

export async function buildInitSplDistributionTx(
  feePayer: string,
  vault: string,
  mint: string,
  createMissingAtas: boolean
): Promise<TxBuilderResponse> {
  const owner = new PublicKey(feePayer);
  const vaultPda = new PublicKey(vault);

  const vaultAccount = await program.account.vault.fetch(vaultPda);
  const sessionId = vaultAccount.activeUnlockSessionId;
  if (sessionId === null) throw new Error('No active unlock session found');

  const [vaultAuthorityPda] = findVaultAuthorityPda(vaultPda);
  const [unlockSessionPda] = findUnlockSessionPda(vaultPda, sessionId);
  const mintPda = new PublicKey(mint);
  const [splDistPda] = findSplDistSessionPda(unlockSessionPda, mintPda);
  const vaultAta = getAssociatedTokenAddressSync(mintPda, vaultAuthorityPda, true);

  const ix = await program.methods
    .initSplDistribution({
      createMissingAtas,
    })
    .accounts({
      owner,
      vault: vaultPda,
      vaultAuthority: vaultAuthorityPda,
      unlockSession: unlockSessionPda,
      mint: mintPda,
      vaultTokenAccount: vaultAta,
      splDistributionSession: splDistPda,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const transaction = await buildVersionedTx(owner, [ix]);
  return { 
    transaction, 
    estimatedFee: estimateFee(DEFAULT_COMPUTE_UNITS), 
    computeUnits: DEFAULT_COMPUTE_UNITS, 
    warnings: [] 
  };
}

export async function buildExecSplDistributionBatchTx(
  feePayer: string,
  vault: string,
  mint: string,
  startIndex: number,
  batchSize: number,
  createMissingAtas: boolean
): Promise<TxBuilderResponse> {
  const owner = new PublicKey(feePayer);
  const vaultPda = new PublicKey(vault);

  const vaultAccount = await program.account.vault.fetch(vaultPda);
  const sessionId = vaultAccount.activeUnlockSessionId;
  if (sessionId === null) throw new Error('No active unlock session found');

  const [vaultAuthorityPda] = findVaultAuthorityPda(vaultPda);
  const [unlockSessionPda] = findUnlockSessionPda(vaultPda, sessionId);
  const mintPda = new PublicKey(mint);
  const [splDistPda] = findSplDistSessionPda(unlockSessionPda, mintPda);
  const vaultAta = getAssociatedTokenAddressSync(mintPda, vaultAuthorityPda, true);

  const beneficiaries = await prisma.beneficiary.findMany({
    where: { vaultPubkey: vault, active: true },
    orderBy: { addedAt: 'asc' },
    skip: startIndex,
    take: batchSize,
  });

  const remainingAccounts = beneficiaries.flatMap((b) => {
    const beneficiaryWallet = new PublicKey(b.beneficiaryWallet);
    const beneficiaryAta = getAssociatedTokenAddressSync(mintPda, beneficiaryWallet);
    return [
      { pubkey: new PublicKey(b.id), isWritable: false, isSigner: false },
      { pubkey: beneficiaryWallet, isWritable: false, isSigner: false },
      { pubkey: beneficiaryAta, isWritable: true, isSigner: false },
    ];
  });

  if (createMissingAtas) {
    remainingAccounts.push(
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isWritable: false, isSigner: false },
      { pubkey: SystemProgram.programId, isWritable: false, isSigner: false }
    );
  }

  const ix = await program.methods
    .executeSplBatch({
      startIndex,
      batchSize,
    })
    .accounts({
      owner,
      vault: vaultPda,
      vaultAuthority: vaultAuthorityPda,
      unlockSession: unlockSessionPda,
      splDistributionSession: splDistPda,
      vaultTokenAccount: vaultAta,
      mint: mintPda,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .remainingAccounts(remainingAccounts)
    .instruction();

  const transaction = await buildVersionedTx(owner, [ix], DISTRIBUTION_COMPUTE_UNITS);
  return { 
    transaction, 
    estimatedFee: estimateFee(DISTRIBUTION_COMPUTE_UNITS), 
    computeUnits: DISTRIBUTION_COMPUTE_UNITS, 
    warnings: [] 
  };
}

export async function buildFinalizeUnlockTx(
  feePayer: string,
  vault: string
): Promise<TxBuilderResponse> {
  const owner = new PublicKey(feePayer);
  const vaultPda = new PublicKey(vault);

  const vaultAccount = await program.account.vault.fetch(vaultPda);
  const sessionId = vaultAccount.activeUnlockSessionId;
  if (sessionId === null) throw new Error('No active unlock session found');

  const [unlockSessionPda] = findUnlockSessionPda(vaultPda, sessionId);
  const [solDistPda] = findSolDistSessionPda(unlockSessionPda);

  const ix = await program.methods
    .finalizeUnlock()
    .accounts({
      owner,
      vault: vaultPda,
      unlockSession: unlockSessionPda,
      solDistributionSession: solDistPda,
      disputeCase: null,
    })
    .instruction();

  const transaction = await buildVersionedTx(owner, [ix]);
  return { 
    transaction, 
    estimatedFee: estimateFee(DEFAULT_COMPUTE_UNITS), 
    computeUnits: DEFAULT_COMPUTE_UNITS, 
    warnings: [] 
  };
}

export async function buildSetGuardianThresholdTx(
  feePayer: string,
  vault: string,
  threshold: number
): Promise<TxBuilderResponse> {
  const owner = new PublicKey(feePayer);
  const vaultPda = new PublicKey(vault);

  const ix = await program.methods
    .setGuardianThreshold(threshold)
    .accounts({
      owner,
      vault: vaultPda,
    })
    .instruction();

  const transaction = await buildVersionedTx(owner, [ix]);
  return { 
    transaction, 
    estimatedFee: estimateFee(DEFAULT_COMPUTE_UNITS), 
    computeUnits: DEFAULT_COMPUTE_UNITS, 
    warnings: [] 
  };
}
