import { PublicKey } from '@solana/web3.js';
import { config } from '../config/constants';

const programId = new PublicKey(config.programId);

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
