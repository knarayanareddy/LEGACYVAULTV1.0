import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
} from '@solana/spl-token';
import { Legacyvault } from '../target/types/legacyvault';

// ─── Constants ────────────────────────────────────────────────────────────────

export const BPS_DENOMINATOR = 10_000;

export const SECONDS_PER_DAY = 86400;
export const MIN_INACTIVITY_THRESHOLD = 30 * SECONDS_PER_DAY;
export const MAX_INACTIVITY_THRESHOLD = 365 * SECONDS_PER_DAY;
export const MIN_TIMELOCK_DURATION = 1 * SECONDS_PER_DAY;
export const MAX_TIMELOCK_DURATION = 90 * SECONDS_PER_DAY;

// ─── Test fixture accounts ────────────────────────────────────────────────────

export interface TestAccounts {
  admin: Keypair;
  owner: Keypair;
  guardian1: Keypair;
  guardian2: Keypair;
  guardian3: Keypair;
  beneficiary1: Keypair;
  beneficiary2: Keypair;
  beneficiary3: Keypair;
  professional: Keypair;
  delegate: Keypair;
  arbiter: Keypair;
}

export function generateTestAccounts(): TestAccounts {
  return {
    admin: Keypair.generate(),
    owner: Keypair.generate(),
    guardian1: Keypair.generate(),
    guardian2: Keypair.generate(),
    guardian3: Keypair.generate(),
    beneficiary1: Keypair.generate(),
    beneficiary2: Keypair.generate(),
    beneficiary3: Keypair.generate(),
    professional: Keypair.generate(),
    delegate: Keypair.generate(),
    arbiter: Keypair.generate(),
  };
}

// ─── Airdrop helper ───────────────────────────────────────────────────────────

export async function airdrop(
  provider: anchor.AnchorProvider,
  pubkey: PublicKey,
  sol: number,
) {
  const sig = await provider.connection.requestAirdrop(
    pubkey,
    sol * LAMPORTS_PER_SOL,
  );
  const { blockhash, lastValidBlockHeight } = await provider.connection.getLatestBlockhash();
  await provider.connection.confirmTransaction({
    signature: sig,
    blockhash,
    lastValidBlockHeight,
  }, 'confirmed');
}

// ─── PDA helpers ──────────────────────────────────────────────────────────────

export function deriveVaultPDA(program: Program<Legacyvault>, owner: PublicKey, nonce: number = 0) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), owner.toBuffer(), Buffer.from([nonce])],
    program.programId,
  );
}

export function deriveVaultAuthorityPDA(program: Program<Legacyvault>, vault: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault_auth'), vault.toBuffer()],
    program.programId,
  );
}

export function deriveGuardianEntryPDA(
  program: Program<Legacyvault>,
  vault: PublicKey,
  guardian: PublicKey,
) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('guardian'), vault.toBuffer(), guardian.toBuffer()],
    program.programId,
  );
}

export function deriveBeneficiaryEntryPDA(
  program: Program<Legacyvault>,
  vault: PublicKey,
  beneficiary: PublicKey,
) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('beneficiary'), vault.toBuffer(), beneficiary.toBuffer()],
    program.programId,
  );
}

export function deriveUnlockSessionPDA(program: Program<Legacyvault>, vault: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('unlock_session'), vault.toBuffer()],
    program.programId,
  );
}

export function deriveGuardianApprovalPDA(
  program: Program<Legacyvault>,
  session: PublicKey,
  guardian: PublicKey,
) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('guardian_approval'), session.toBuffer(), guardian.toBuffer()],
    program.programId,
  );
}

export function deriveSolDistributionSessionPDA(
  program: Program<Legacyvault>,
  vault: PublicKey,
) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('dist_sol'), vault.toBuffer()],
    program.programId,
  );
}

export function deriveSplDistributionSessionPDA(
  program: Program<Legacyvault>,
  vault: PublicKey,
  mint: PublicKey,
) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('dist_spl'),
      vault.toBuffer(),
      mint.toBuffer(),
    ],
    program.programId,
  );
}

export function deriveGlobalConfigPDA(program: Program<Legacyvault>) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('global_config')],
    program.programId,
  );
}

export function deriveSubscriptionStatePDA(
  program: Program<Legacyvault>,
  vault: PublicKey,
) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('subscription'), vault.toBuffer()],
    program.programId,
  );
}

// ─── SPL token test helpers ───────────────────────────────────────────────────

export async function createTestToken(
  provider: anchor.AnchorProvider,
  mintAuthority: Keypair,
): Promise<PublicKey> {
  return await createMint(
    provider.connection,
    mintAuthority,
    mintAuthority.publicKey,
    null,
    6, // decimals
    undefined,
    undefined,
    TOKEN_PROGRAM_ID,
  );
}

export async function createAndFundTokenAccount(
  provider: anchor.AnchorProvider,
  mint: PublicKey,
  owner: PublicKey,
  mintAuthority: Keypair,
  amount: number,
): Promise<PublicKey> {
  const account = await createAccount(
    provider.connection,
    mintAuthority,
    mint,
    owner,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID,
  );

  await mintTo(
    provider.connection,
    mintAuthority,
    mint,
    account,
    mintAuthority,
    amount,
    [],
    undefined,
    TOKEN_PROGRAM_ID,
  );

  return account;
}

// ─── Wait helper ──────────────────────────────────────────────────────────────

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
