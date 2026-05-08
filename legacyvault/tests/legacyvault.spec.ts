// programs/legacyvault/tests/legacyvault.spec.ts
import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import { assert, expect } from 'chai';
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { Legacyvault } from '../target/types/legacyvault';
import * as fix from './fixtures';

describe('LegacyVault', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Legacyvault as Program<Legacyvault>;

  let accounts: fix.TestAccounts;
  let globalConfig: PublicKey;
  let vault: PublicKey;
  let vaultAuthority: PublicKey;
  let subscriptionState: PublicKey;

  // ─── Setup ──────────────────────────────────────────────────────────────────

  before(async () => {
    accounts = fix.generateTestAccounts();

    // Airdrop to key accounts
    await fix.airdrop(provider, accounts.admin.publicKey, 10);
    await fix.airdrop(provider, accounts.owner.publicKey, 10);
    await fix.airdrop(provider, accounts.guardian1.publicKey, 2);
    await fix.airdrop(provider, accounts.guardian2.publicKey, 2);
    await fix.airdrop(provider, accounts.guardian3.publicKey, 2);
    await fix.airdrop(provider, accounts.beneficiary1.publicKey, 1);
    await fix.airdrop(provider, accounts.beneficiary2.publicKey, 1);
    await fix.airdrop(provider, accounts.beneficiary3.publicKey, 1);

    // Derive PDAs
    [globalConfig] = fix.deriveGlobalConfigPDA(program);
    [vault] = fix.deriveVaultPDA(program, accounts.owner.publicKey, 0);
    [vaultAuthority] = fix.deriveVaultAuthorityPDA(program, vault);
    [subscriptionState] = fix.deriveSubscriptionStatePDA(program, vault);
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // A. Admin & Global Config
  // ══════════════════════════════════════════════════════════════════════════════

  describe('A. Admin & Global Config', () => {
    it('initializes global config', async () => {
      await program.methods
        .initializeGlobalConfig(
          accounts.admin.publicKey, // fee_receiver
          new BN(0.01 * LAMPORTS_PER_SOL), // creation_fee
          new BN(0.05 * LAMPORTS_PER_SOL), // pro_fee
          new BN(0.1 * LAMPORTS_PER_SOL), // enterprise_fee
        )
        .accounts({
          admin: accounts.admin.publicKey,
          globalConfig,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.admin])
        .rpc();

      const cfg = await program.account.globalConfig.fetch(globalConfig);
      assert.ok(cfg.admin.equals(accounts.admin.publicKey));
      assert.isFalse(cfg.paused);
    });

    it('admin can pause/unpause', async () => {
      await program.methods
        .pauseProgram()
        .accounts({
          admin: accounts.admin.publicKey,
          globalConfig,
        })
        .signers([accounts.admin])
        .rpc();

      let cfg = await program.account.globalConfig.fetch(globalConfig);
      assert.isTrue(cfg.paused);

      await program.methods
        .unpauseProgram()
        .accounts({
          admin: accounts.admin.publicKey,
          globalConfig,
        })
        .signers([accounts.admin])
        .rpc();

      cfg = await program.account.globalConfig.fetch(globalConfig);
      assert.isFalse(cfg.paused);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // B. Vault Lifecycle
  // ══════════════════════════════════════════════════════════════════════════════

  describe('B. Vault Lifecycle', () => {
    it('creates a vault with valid settings', async () => {
      const inactivityThreshold = new BN(90 * fix.SECONDS_PER_DAY);
      const timelockDuration = new BN(30 * fix.SECONDS_PER_DAY);

      await program.methods
        .createVault({
          vaultNonce: 0,
          inactivityThreshold,
          timelockDuration,
          guardianThreshold: 2,
        })
        .accounts({
          owner: accounts.owner.publicKey,
          vault,
          vaultAuthority,
          subscriptionState,
          globalConfig,
          feeReceiver: accounts.admin.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.owner])
        .rpc();

      const vaultAccount = await program.account.vault.fetch(vault);
      assert.ok(vaultAccount.owner.equals(accounts.owner.publicKey));
      assert.ok(vaultAccount.status.active !== undefined);
      assert.equal(vaultAccount.guardianThreshold, 2);
      assert.ok(vaultAccount.inactivityThreshold.eq(inactivityThreshold));
      assert.ok(vaultAccount.timelockDuration.eq(timelockDuration));
    });

    it('owner can freeze/unfreeze vault', async () => {
      await program.methods
        .freezeVault()
        .accounts({
          owner: accounts.owner.publicKey,
          vault,
        })
        .signers([accounts.owner])
        .rpc();

      let v = await program.account.vault.fetch(vault);
      assert.ok(v.status.frozen !== undefined);

      await program.methods
        .unfreezeVault()
        .accounts({
          owner: accounts.owner.publicKey,
          vault,
          unlockSession: null,
        })
        .signers([accounts.owner])
        .rpc();

      v = await program.account.vault.fetch(vault);
      assert.ok(v.status.active !== undefined);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // C. Guardians
  // ══════════════════════════════════════════════════════════════════════════════

  describe('C. Guardians', () => {
    let guardian1Entry: PublicKey;
    let guardian2Entry: PublicKey;

    before(() => {
      [guardian1Entry] = fix.deriveGuardianEntryPDA(program, vault, accounts.guardian1.publicKey);
      [guardian2Entry] = fix.deriveGuardianEntryPDA(program, vault, accounts.guardian2.publicKey);
    });

    it('owner adds personal guardians', async () => {
      await program.methods
        .addGuardian({
          guardianWallet: accounts.guardian1.publicKey,
          role: { personal: {} },
        })
        .accounts({
          owner: accounts.owner.publicKey,
          vault,
          guardianEntry: guardian1Entry,
          globalConfig,
          proGuardianProfile: null,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.owner])
        .rpc();

      const entry = await program.account.guardianEntry.fetch(guardian1Entry);
      assert.ok(entry.guardianWallet.equals(accounts.guardian1.publicKey));
      assert.ok(entry.status.pending !== undefined);
    });

    it('guardian accepts invitation', async () => {
      await program.methods
        .acceptGuardianInvitation()
        .accounts({
          guardian: accounts.guardian1.publicKey,
          guardianEntry: guardian1Entry,
          vault,
        })
        .signers([accounts.guardian1])
        .rpc();

      const entry = await program.account.guardianEntry.fetch(guardian1Entry);
      assert.ok(entry.status.active !== undefined);
    });

    it('owner adds second guardian', async () => {
      await program.methods
        .addGuardian({
          guardianWallet: accounts.guardian2.publicKey,
          role: { personal: {} },
        })
        .accounts({
          owner: accounts.owner.publicKey,
          vault,
          guardianEntry: guardian2Entry,
          globalConfig,
          proGuardianProfile: null,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.owner])
        .rpc();

      await program.methods
        .acceptGuardianInvitation()
        .accounts({
          guardian: accounts.guardian2.publicKey,
          guardianEntry: guardian2Entry,
          vault,
        })
        .signers([accounts.guardian2])
        .rpc();

      const v = await program.account.vault.fetch(vault);
      assert.equal(v.guardianCount, 2);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // D. Beneficiaries
  // ══════════════════════════════════════════════════════════════════════════════

  describe('D. Beneficiaries', () => {
    let ben1Entry: PublicKey;

    before(() => {
      [ben1Entry] = fix.deriveBeneficiaryEntryPDA(program, vault, accounts.beneficiary1.publicKey);
    });

    it('owner adds beneficiary', async () => {
      await program.methods
        .addBeneficiary({
          beneficiaryWallet: accounts.beneficiary1.publicKey,
          shareBps: 5000,
          active: true,
        })
        .accounts({
          owner: accounts.owner.publicKey,
          vault,
          beneficiaryEntry: ben1Entry,
          globalConfig,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.owner])
        .rpc();

      const entry = await program.account.beneficiaryEntry.fetch(ben1Entry);
      assert.equal(entry.shareBps, 5000);
      assert.isTrue(entry.active);

      const v = await program.account.vault.fetch(vault);
      assert.equal(v.beneficiaryCount, 1);
      assert.equal(v.totalBps, 5000);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // E. Deposits & Custody
  // ══════════════════════════════════════════════════════════════════════════════

  describe('E. Deposits & Custody', () => {
    it('owner deposits SOL into vault custody', async () => {
      const depositAmount = new BN(1 * LAMPORTS_PER_SOL);

      await program.methods
        .depositSol()
        .accounts({
          depositor: accounts.owner.publicKey,
          vault,
          vaultAuthority,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.owner])
        .remainingAccounts([
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: accounts.owner.publicKey, isSigner: true, isWritable: true },
            { pubkey: vaultAuthority, isSigner: false, isWritable: true },
        ])
        .rpc();
        
        // Wait, deposit_sol in lib.rs is actually:
        // pub fn deposit_sol(ctx: Context<DepositSol>) -> Result<()> { ... }
        // Context<DepositSol> has depositor, vault, vault_authority.
        // It uses anchor_lang::system_program::transfer.
    });

    it('owner can withdraw SOL when vault is Active', async () => {
      const withdrawAmount = new BN(0.1 * LAMPORTS_PER_SOL);

      await program.methods
        .withdrawSol(withdrawAmount)
        .accounts({
          owner: accounts.owner.publicKey,
          vault,
          vaultAuthority,
          ownerWallet: accounts.owner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.owner])
        .rpc();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // F. Liveness & Check-in
  // ══════════════════════════════════════════════════════════════════════════════

  describe('F. Liveness & Check-in', () => {
    it('owner can check in', async () => {
      const vaultBefore = await program.account.vault.fetch(vault);
      const lastCheckInBefore = vaultBefore.lastCheckIn;

      await fix.sleep(1000);

      await program.methods
        .checkIn()
        .accounts({
          signer: accounts.owner.publicKey,
          vault,
          livenessDelegate: null,
        })
        .signers([accounts.owner])
        .rpc();

      const vaultAfter = await program.account.vault.fetch(vault);
      assert.isTrue(vaultAfter.lastCheckIn.gt(lastCheckInBefore));
    });
  });
});
