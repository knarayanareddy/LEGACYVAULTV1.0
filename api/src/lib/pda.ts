import { PublicKey } from '@solana/web3.js';
import { programId } from '../config/anchor';

export const findVaultPda = (owner: PublicKey, nonce: number): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), owner.toBuffer(), Buffer.from([nonce])],
    programId
  );
};

export const findVaultAuthorityPda = (vault: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault_auth'), vault.toBuffer()],
    programId
  );
};

export const findGuardianEntryPda = (vault: PublicKey, guardian: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('guardian'), vault.toBuffer(), guardian.toBuffer()],
    programId
  );
};

export const findBeneficiaryEntryPda = (vault: PublicKey, beneficiary: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('beneficiary'), vault.toBuffer(), beneficiary.toBuffer()],
    programId
  );
};

export const findUnlockSessionPda = (vault: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('unlock_session'), vault.toBuffer()],
    programId
  );
};

export const findSolDistSessionPda = (unlockSession: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('dist_sol'), unlockSession.toBuffer()],
    programId
  );
};

export const findSplDistSessionPda = (unlockSession: PublicKey, mint: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('dist_spl'), unlockSession.toBuffer(), mint.toBuffer()],
    programId
  );
};

export const findGlobalConfigPda = (): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('global_config')],
    programId
  );
};

export const findSubscriptionPda = (vault: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('subscription'), vault.toBuffer()],
    programId
  );
};

export const findGuardianApprovalPda = (unlockSession: PublicKey, guardian: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('approval'), unlockSession.toBuffer(), guardian.toBuffer()],
    programId
  );
};

export const findProGuardianPda = (guardian: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('pro_guardian'), guardian.toBuffer()],
    programId
  );
};

export const findProBondPda = (vault: PublicKey, guardian: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('pro_bond'), vault.toBuffer(), guardian.toBuffer()],
    programId
  );
};

export const findLivenessDelegatePda = (vault: PublicKey, delegate: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('delegate'), vault.toBuffer(), delegate.toBuffer()],
    programId
  );
};

export const findAssetRulePda = (vault: PublicKey, beneficiary: PublicKey, mint: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('asset_rule'), vault.toBuffer(), beneficiary.toBuffer(), mint.toBuffer()],
    programId
  );
};
