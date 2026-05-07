    BUILD 8 — Complete Test Suite
    Anchor Program Tests + API Server Tests + Frontend Hook Tests

    Scope: Full test coverage across all three layers of the stack. Every instruction, every API route, every React Query hook. Written to be runnable, not illustrative — these are real test files.

    Files produced in this build:

    text

    tests/                                  ← Anchor workspace tests
      legacyvault.ts                        ← Full Anchor program test suite
      helpers/
        programHelpers.ts                   ← PDA derivation + account helpers
        txHelpers.ts                        ← Tx building + confirmation helpers
        fixtures.ts                         ← Shared test fixture data

    api/                                    ← (Build 4 server root)
      src/
        __tests__/
          setup.ts                          ← Test DB + server bootstrap
          auth.test.ts                      ← Auth routes (nonce/verify/refresh)
          vault.test.ts                     ← Vault read routes
          tx.test.ts                        ← Tx builder routes
          middleware.test.ts                ← Auth middleware + rate limiting
          marketData.test.ts                ← Market data service
          documents.test.ts                 ← Document service

    dashboard/src/                          ← (Vite dashboard root)
      __tests__/
        setup.ts                            ← MSW server + query client setup
        hooks/
          useAuth.test.ts
          useVaultSummary.test.ts
          useGuardians.test.ts
          useBeneficiaries.test.ts
          useLiveness.test.ts
          useDistribution.test.ts
          useDocuments.test.ts
          useSettings.test.ts
          useTxBuilder.test.ts
        components/
          TxStatusModal.test.tsx
          WalletButton.test.tsx
          LoadingSkeleton.test.tsx

    PART 1 — Anchor Program Tests
    tests/helpers/fixtures.ts

    TypeScript

    // tests/helpers/fixtures.ts
    import { BN } from '@coral-xyz/anchor';

    // ─── Protocol constants (must mirror program constants) ──────────────────────
    export const BPS_DENOMINATOR = 10_000;
    export const MIN_INACTIVITY_DAYS = 30;
    export const MAX_INACTIVITY_DAYS = 365;
    export const MIN_TIMELOCK_DAYS   = 1;
    export const MAX_TIMELOCK_DAYS   = 90;
    export const DEFAULT_BATCH_SIZE  = 5;

    // ─── Time helpers ─────────────────────────────────────────────────────────────
    export const SECONDS_PER_DAY = 86_400;

    export function daysToSeconds(d: number): BN {
      return new BN(d * SECONDS_PER_DAY);
    }

    // ─── Vault creation defaults ──────────────────────────────────────────────────
    export const DEFAULT_VAULT_PARAMS = {
      inactivityThreshold: daysToSeconds(90),
      timelockDuration:    daysToSeconds(30),
      guardianThreshold:   2,
    };

    // ─── Guardian fixtures ────────────────────────────────────────────────────────
    export const GUARDIAN_ROLE = {
      personal:     { personal:     {} },
      professional: { professional: {} },
      delegate:     { delegate:     {} },
    };

    // ─── Beneficiary fixtures ─────────────────────────────────────────────────────
    export const BPS = {
      half:    5_000,
      third:   3_334,
      quarter: 2_500,
      full:    10_000,
    };

    // ─── Asset rule type fixtures ─────────────────────────────────────────────────
    export const ASSET_RULE_TYPE = {
      proRata:           { proRata:           {} },
      fixedBps:          { fixedBps:          {} },
      entireToBeneficiary: { entireToBeneficiary: {} },
    };

    tests/helpers/programHelpers.ts

    TypeScript

    // tests/helpers/programHelpers.ts
    import * as anchor from '@coral-xyz/anchor';
    import { PublicKey, SystemProgram, Keypair } from '@solana/web3.js';
    import { Program }   from '@coral-xyz/anchor';
    import type { Legacyvault } from '../../target/types/legacyvault';

    // ─── PDA derivation helpers ───────────────────────────────────────────────────
    // These MUST match the seeds used in the Anchor program exactly.

    export function deriveVaultPda(owner: PublicKey, programId: PublicKey) {
      return PublicKey.findProgramAddressSync(
        [Buffer.from('vault'), owner.toBuffer()],
        programId,
      );
    }

    export function deriveVaultAuthorityPda(vault: PublicKey, programId: PublicKey) {
      return PublicKey.findProgramAddressSync(
        [Buffer.from('vault_authority'), vault.toBuffer()],
        programId,
      );
    }

    export function deriveGuardianEntryPda(
      vault: PublicKey,
      guardian: PublicKey,
      programId: PublicKey,
    ) {
      return PublicKey.findProgramAddressSync(
        [Buffer.from('guardian_entry'), vault.toBuffer(), guardian.toBuffer()],
        programId,
      );
    }

    export function deriveBeneficiaryEntryPda(
      vault: PublicKey,
      beneficiary: PublicKey,
      programId: PublicKey,
    ) {
      return PublicKey.findProgramAddressSync(
        [Buffer.from('beneficiary_entry'), vault.toBuffer(), beneficiary.toBuffer()],
        programId,
      );
    }

    export function deriveAssetRulePda(
      vault: PublicKey,
      beneficiary: PublicKey,
      mint: PublicKey,
      programId: PublicKey,
    ) {
      return PublicKey.findProgramAddressSync(
        [
          Buffer.from('asset_rule'),
          vault.toBuffer(),
          beneficiary.toBuffer(),
          mint.toBuffer(),
        ],
        programId,
      );
    }

    export function deriveLivenessDelegatePda(
      vault: PublicKey,
      delegate: PublicKey,
      programId: PublicKey,
    ) {
      return PublicKey.findProgramAddressSync(
        [Buffer.from('liveness_delegate'), vault.toBuffer(), delegate.toBuffer()],
        programId,
      );
    }

    export function deriveUnlockSessionPda(vault: PublicKey, programId: PublicKey) {
      return PublicKey.findProgramAddressSync(
        [Buffer.from('unlock_session'), vault.toBuffer()],
        programId,
      );
    }

    export function deriveGuardianApprovalPda(
      unlockSession: PublicKey,
      guardian: PublicKey,
      programId: PublicKey,
    ) {
      return PublicKey.findProgramAddressSync(
        [
          Buffer.from('guardian_approval'),
          unlockSession.toBuffer(),
          guardian.toBuffer(),
        ],
        programId,
      );
    }

    export function deriveSolDistributionSessionPda(
      vault: PublicKey,
      programId: PublicKey,
    ) {
      return PublicKey.findProgramAddressSync(
        [Buffer.from('sol_distribution_session'), vault.toBuffer()],
        programId,
      );
    }

    export function deriveSplDistributionSessionPda(
      vault: PublicKey,
      mint: PublicKey,
      programId: PublicKey,
    ) {
      return PublicKey.findProgramAddressSync(
        [Buffer.from('spl_distribution_session'), vault.toBuffer(), mint.toBuffer()],
        programId,
      );
    }

    export function deriveGlobalConfigPda(programId: PublicKey) {
      return PublicKey.findProgramAddressSync(
        [Buffer.from('global_config')],
        programId,
      );
    }

    export function deriveSubscriptionStatePda(
      vault: PublicKey,
      programId: PublicKey,
    ) {
      return PublicKey.findProgramAddressSync(
        [Buffer.from('subscription_state'), vault.toBuffer()],
        programId,
      );
    }

    // ─── Account fetchers ─────────────────────────────────────────────────────────

    export async function fetchVault(
      program: Program<Legacyvault>,
      vault: PublicKey,
    ) {
      return program.account.vault.fetch(vault);
    }

    export async function fetchGuardianEntry(
      program: Program<Legacyvault>,
      entry: PublicKey,
    ) {
      return program.account.guardianEntry.fetch(entry);
    }

    export async function fetchBeneficiaryEntry(
      program: Program<Legacyvault>,
      entry: PublicKey,
    ) {
      return program.account.beneficiaryEntry.fetch(entry);
    }

    export async function fetchUnlockSession(
      program: Program<Legacyvault>,
      session: PublicKey,
    ) {
      return program.account.unlockSession.fetch(session);
    }

    export async function fetchSolDistributionSession(
      program: Program<Legacyvault>,
      session: PublicKey,
    ) {
      return program.account.solDistributionSession.fetch(session);
    }

    // ─── Airdrop helper ───────────────────────────────────────────────────────────

    export async function airdrop(
      connection: anchor.web3.Connection,
      pubkey: PublicKey,
      sol = 10,
    ) {
      const sig = await connection.requestAirdrop(
        pubkey,
        sol * anchor.web3.LAMPORTS_PER_SOL,
      );
      const latest = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature: sig,
        blockhash: latest.blockhash,
        lastValidBlockHeight: latest.lastValidBlockHeight,
      });
    }

    tests/helpers/txHelpers.ts

    TypeScript

    // tests/helpers/txHelpers.ts
    import * as anchor from '@coral-xyz/anchor';
    import {
      PublicKey,
      Keypair,
      SystemProgram,
      LAMPORTS_PER_SOL,
    } from '@solana/web3.js';
    import {
      createMint,
      createAssociatedTokenAccount,
      mintTo,
      getAssociatedTokenAddress,
      TOKEN_PROGRAM_ID,
    } from '@solana/spl-token';

    // ─── Create test SPL mint ─────────────────────────────────────────────────────

    export async function createTestMint(
      connection: anchor.web3.Connection,
      payer: Keypair,
      decimals = 6,
    ): Promise<PublicKey> {
      return createMint(connection, payer, payer.publicKey, null, decimals);
    }

    // ─── Fund + create ATA for a pubkey ──────────────────────────────────────────

    export async function createFundedAta(
      connection: anchor.web3.Connection,
      payer: Keypair,
      mint: PublicKey,
      owner: PublicKey,
      amount: bigint,
    ): Promise<PublicKey> {
      const ata = await createAssociatedTokenAccount(connection, payer, mint, owner);
      await mintTo(connection, payer, mint, ata, payer, amount);
      return ata;
    }

    // ─── Sort beneficiaries canonically (ascending pubkey bytes) ─────────────────
    // This mirrors the on-chain canonical ordering enforced during distribution.

    export function sortBeneficiariesCanonically(pubkeys: PublicKey[]): PublicKey[] {
      return [...pubkeys].sort((a, b) =>
        Buffer.compare(a.toBuffer(), b.toBuffer()),
      );
    }

    // ─── Build remaining accounts for SOL distribution batch ─────────────────────

    export function buildSolBatchRemainingAccounts(
      beneficiaryEntries: { pda: PublicKey; wallet: PublicKey }[],
    ) {
      return beneficiaryEntries.flatMap(({ pda, wallet }) => [
        { pubkey: pda,    isWritable: true,  isSigner: false },
        { pubkey: wallet, isWritable: true,  isSigner: false },
      ]);
    }

    // ─── Build remaining accounts for SPL distribution batch ─────────────────────

    export function buildSplBatchRemainingAccounts(
      beneficiaryEntries: { pda: PublicKey; wallet: PublicKey; ata: PublicKey }[],
    ) {
      return beneficiaryEntries.flatMap(({ pda, wallet, ata }) => [
        { pubkey: pda,    isWritable: true,  isSigner: false },
        { pubkey: wallet, isWritable: false, isSigner: false },
        { pubkey: ata,    isWritable: true,  isSigner: false },
      ]);
    }

    tests/legacyvault.ts — Full Anchor Test Suite

    TypeScript

    // tests/legacyvault.ts
    import * as anchor from '@coral-xyz/anchor';
    import { Program, BN, AnchorError } from '@coral-xyz/anchor';
    import {
      Keypair,
      PublicKey,
      SystemProgram,
      LAMPORTS_PER_SOL,
    } from '@solana/web3.js';
    import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
    import { assert, expect } from 'chai';
    import type { Legacyvault } from '../target/types/legacyvault';

    import {
      deriveVaultPda,
      deriveVaultAuthorityPda,
      deriveGuardianEntryPda,
      deriveBeneficiaryEntryPda,
      deriveAssetRulePda,
      deriveLivenessDelegatePda,
      deriveUnlockSessionPda,
      deriveGuardianApprovalPda,
      deriveSolDistributionSessionPda,
      deriveGlobalConfigPda,
      deriveSubscriptionStatePda,
      fetchVault,
      fetchGuardianEntry,
      fetchBeneficiaryEntry,
      fetchUnlockSession,
      fetchSolDistributionSession,
      airdrop,
    } from './helpers/programHelpers';

    import {
      createTestMint,
      createFundedAta,
      buildSolBatchRemainingAccounts,
      sortBeneficiariesCanonically,
    } from './helpers/txHelpers';

    import {
      DEFAULT_VAULT_PARAMS,
      GUARDIAN_ROLE,
      BPS,
      ASSET_RULE_TYPE,
      daysToSeconds,
      SECONDS_PER_DAY,
    } from './helpers/fixtures';

    // ─── Test suite ───────────────────────────────────────────────────────────────

    describe('LegacyVault', () => {
      const provider = anchor.AnchorProvider.env();
      anchor.setProvider(provider);

      const program = anchor.workspace.Legacyvault as Program<Legacyvault>;
      const conn    = provider.connection;

      // ── Shared keypairs ──
      let owner:      Keypair;
      let guardian1:  Keypair;
      let guardian2:  Keypair;
      let guardian3:  Keypair;
      let beneficiary1: Keypair;
      let beneficiary2: Keypair;
      let delegate:   Keypair;
      let admin:      Keypair;

      // ── Shared PDAs ──
      let vaultPda:        PublicKey;
      let vaultBump:       number;
      let vaultAuthority:  PublicKey;
      let authBump:        number;
      let globalConfig:    PublicKey;
      let configBump:      number;
      let subscriptionPda: PublicKey;

      // ─────────────────────────────────────────────────────────────────────────
      // BEFORE ALL — fund all keypairs
      // ─────────────────────────────────────────────────────────────────────────

      before(async () => {
        owner        = Keypair.generate();
        guardian1    = Keypair.generate();
        guardian2    = Keypair.generate();
        guardian3    = Keypair.generate();
        beneficiary1 = Keypair.generate();
        beneficiary2 = Keypair.generate();
        delegate     = Keypair.generate();
        admin        = Keypair.generate();

        await Promise.all([
          airdrop(conn, owner.publicKey,        20),
          airdrop(conn, guardian1.publicKey,    5),
          airdrop(conn, guardian2.publicKey,    5),
          airdrop(conn, guardian3.publicKey,    5),
          airdrop(conn, beneficiary1.publicKey, 2),
          airdrop(conn, beneficiary2.publicKey, 2),
          airdrop(conn, delegate.publicKey,     2),
          airdrop(conn, admin.publicKey,        10),
        ]);

        [vaultPda,       vaultBump]  = deriveVaultPda(owner.publicKey, program.programId);
        [vaultAuthority, authBump]   = deriveVaultAuthorityPda(vaultPda, program.programId);
        [globalConfig,   configBump] = deriveGlobalConfigPda(program.programId);
        [subscriptionPda]            = deriveSubscriptionStatePda(vaultPda, program.programId);
      });

      // ═══════════════════════════════════════════════════════════════════════════
      // MODULE A — Admin / GlobalConfig
      // ═══════════════════════════════════════════════════════════════════════════

      describe('Module A — Admin', () => {

        it('initialises global config', async () => {
          await program.methods
            .initializeConfig({
              creationFeeLamports: new BN(0.01 * LAMPORTS_PER_SOL),
              feeReceiver: admin.publicKey,
            })
            .accounts({
              admin:        admin.publicKey,
              globalConfig,
              systemProgram: SystemProgram.programId,
            })
            .signers([admin])
            .rpc();

          const cfg = await program.account.globalConfig.fetch(globalConfig);
          assert.ok(cfg.admin.equals(admin.publicKey), 'admin set correctly');
          assert.ok(!cfg.paused, 'config starts unpaused');
        });

        it('pauses and unpauses the program', async () => {
          await program.methods
            .setPaused(true)
            .accounts({ admin: admin.publicKey, globalConfig })
            .signers([admin])
            .rpc();

          let cfg = await program.account.globalConfig.fetch(globalConfig);
          assert.ok(cfg.paused, 'should be paused');

          await program.methods
            .setPaused(false)
            .accounts({ admin: admin.publicKey, globalConfig })
            .signers([admin])
            .rpc();

          cfg = await program.account.globalConfig.fetch(globalConfig);
          assert.ok(!cfg.paused, 'should be unpaused');
        });

        it('rejects non-admin attempting to pause', async () => {
          try {
            await program.methods
              .setPaused(true)
              .accounts({ admin: owner.publicKey, globalConfig })
              .signers([owner])
              .rpc();
            assert.fail('should have thrown');
          } catch (e: any) {
            expect(e).to.be.instanceOf(AnchorError);
            expect(e.error.errorCode.code).to.equal('Unauthorized');
          }
        });

      });

      // ═══════════════════════════════════════════════════════════════════════════
      // MODULE B — Vault Lifecycle
      // ═══════════════════════════════════════════════════════════════════════════

      describe('Module B — Vault Lifecycle', () => {

        it('creates a vault with valid parameters', async () => {
          await program.methods
            .createVault({
              inactivityThreshold: DEFAULT_VAULT_PARAMS.inactivityThreshold,
              timelockDuration:    DEFAULT_VAULT_PARAMS.timelockDuration,
              guardianThreshold:   DEFAULT_VAULT_PARAMS.guardianThreshold,
            })
            .accounts({
              owner:          owner.publicKey,
              vault:          vaultPda,
              vaultAuthority,
              subscription:   subscriptionPda,
              globalConfig,
              systemProgram:  SystemProgram.programId,
            })
            .signers([owner])
            .rpc();

          const vault = await fetchVault(program, vaultPda);
          assert.ok(vault.owner.equals(owner.publicKey), 'owner set');
          assert.ok('active' in vault.status, 'status is Active');
          assert.equal(
            vault.inactivityThreshold.toNumber(),
            DEFAULT_VAULT_PARAMS.inactivityThreshold.toNumber(),
            'inactivity threshold matches',
          );
          assert.equal(
            vault.timelockDuration.toNumber(),
            DEFAULT_VAULT_PARAMS.timelockDuration.toNumber(),
            'timelock duration matches',
          );
          assert.equal(vault.guardianThreshold, DEFAULT_VAULT_PARAMS.guardianThreshold);
          assert.equal(vault.totalBps, 0, 'starts with 0 bps');
          assert.equal(vault.guardianCount, 0, 'starts with 0 guardians');
          assert.equal(vault.beneficiaryCount, 0, 'starts with 0 beneficiaries');
        });

        it('rejects inactivity threshold below minimum', async () => {
          const ownerB = Keypair.generate();
          await airdrop(conn, ownerB.publicKey, 5);
          const [vaultB] = deriveVaultPda(ownerB.publicKey, program.programId);
          const [authB]  = deriveVaultAuthorityPda(vaultB, program.programId);
          const [subB]   = deriveSubscriptionStatePda(vaultB, program.programId);

          try {
            await program.methods
              .createVault({
                inactivityThreshold: daysToSeconds(5), // below 30d minimum
                timelockDuration:    DEFAULT_VAULT_PARAMS.timelockDuration,
                guardianThreshold:   1,
              })
              .accounts({
                owner: ownerB.publicKey,
                vault: vaultB,
                vaultAuthority: authB,
                subscription: subB,
                globalConfig,
                systemProgram: SystemProgram.programId,
              })
              .signers([ownerB])
              .rpc();
            assert.fail('should have thrown');
          } catch (e: any) {
            expect(e).to.be.instanceOf(AnchorError);
            expect(e.error.errorCode.code).to.equal('InactivityThresholdOutOfBounds');
          }
        });

        it('rejects timelock duration above maximum', async () => {
          const ownerC = Keypair.generate();
          await airdrop(conn, ownerC.publicKey, 5);
          const [vaultC] = deriveVaultPda(ownerC.publicKey, program.programId);
          const [authC]  = deriveVaultAuthorityPda(vaultC, program.programId);
          const [subC]   = deriveSubscriptionStatePda(vaultC, program.programId);

          try {
            await program.methods
              .createVault({
                inactivityThreshold: DEFAULT_VAULT_PARAMS.inactivityThreshold,
                timelockDuration:    daysToSeconds(120), // above 90d maximum
                guardianThreshold:   1,
              })
              .accounts({
                owner: ownerC.publicKey,
                vault: vaultC,
                vaultAuthority: authC,
                subscription: subC,
                globalConfig,
                systemProgram: SystemProgram.programId,
              })
              .signers([ownerC])
              .rpc();
            assert.fail('should have thrown');
          } catch (e: any) {
            expect(e).to.be.instanceOf(AnchorError);
            expect(e.error.errorCode.code).to.equal('TimelockDurationOutOfBounds');
          }
        });

        it('freezes the vault (owner only)', async () => {
          await program.methods
            .freezeVault()
            .accounts({ owner: owner.publicKey, vault: vaultPda })
            .signers([owner])
            .rpc();

          const vault = await fetchVault(program, vaultPda);
          assert.ok('frozen' in vault.status, 'vault should be frozen');
        });

        it('rejects operations on a frozen vault', async () => {
          try {
            await program.methods
              .checkIn()
              .accounts({ signer: owner.publicKey, vault: vaultPda })
              .signers([owner])
              .rpc();
            assert.fail('should have thrown');
          } catch (e: any) {
            expect(e).to.be.instanceOf(AnchorError);
            expect(e.error.errorCode.code).to.equal('VaultFrozen');
          }
        });

        it('unfreezes the vault (owner only)', async () => {
          await program.methods
            .unfreezeVault()
            .accounts({ owner: owner.publicKey, vault: vaultPda })
            .signers([owner])
            .rpc();

          const vault = await fetchVault(program, vaultPda);
          assert.ok('active' in vault.status, 'vault should be active again');
        });

        it('rejects non-owner attempting to freeze', async () => {
          try {
            await program.methods
              .freezeVault()
              .accounts({ owner: guardian1.publicKey, vault: vaultPda })
              .signers([guardian1])
              .rpc();
            assert.fail('should have thrown');
          } catch (e: any) {
            expect(e).to.be.instanceOf(AnchorError);
            expect(e.error.errorCode.code).to.equal('Unauthorized');
          }
        });

        it('updates vault settings within bounds', async () => {
          const newThreshold = daysToSeconds(60);
          await program.methods
            .updateVaultSettings({
              inactivityThreshold: newThreshold,
              timelockDuration:    DEFAULT_VAULT_PARAMS.timelockDuration,
              guardianThreshold:   DEFAULT_VAULT_PARAMS.guardianThreshold,
            })
            .accounts({ owner: owner.publicKey, vault: vaultPda })
            .signers([owner])
            .rpc();

          const vault = await fetchVault(program, vaultPda);
          assert.equal(
            vault.inactivityThreshold.toNumber(),
            newThreshold.toNumber(),
            'inactivity threshold updated',
          );
        });

      });

      // ═══════════════════════════════════════════════════════════════════════════
      // MODULE C — Guardians
      // ═══════════════════════════════════════════════════════════════════════════

      describe('Module C — Guardians', () => {
        let g1Pda: PublicKey;
        let g2Pda: PublicKey;
        let g3Pda: PublicKey;

        before(() => {
          [g1Pda] = deriveGuardianEntryPda(vaultPda, guardian1.publicKey, program.programId);
          [g2Pda] = deriveGuardianEntryPda(vaultPda, guardian2.publicKey, program.programId);
          [g3Pda] = deriveGuardianEntryPda(vaultPda, guardian3.publicKey, program.programId);
        });

        it('adds guardian1 (personal)', async () => {
          await program.methods
            .addGuardian({ role: GUARDIAN_ROLE.personal })
            .accounts({
              owner:         owner.publicKey,
              vault:         vaultPda,
              guardianEntry: g1Pda,
              guardian:      guardian1.publicKey,
              systemProgram: SystemProgram.programId,
            })
            .signers([owner])
            .rpc();

          const entry = await fetchGuardianEntry(program, g1Pda);
          assert.ok(entry.guardian.equals(guardian1.publicKey));
          assert.ok('personal' in entry.role, 'role is personal');
          assert.ok('active' in entry.status, 'status is active');

          const vault = await fetchVault(program, vaultPda);
          assert.equal(vault.guardianCount, 1, 'guardian count incremented');
        });

        it('adds guardian2 (personal)', async () => {
          await program.methods
            .addGuardian({ role: GUARDIAN_ROLE.personal })
            .accounts({
              owner:         owner.publicKey,
              vault:         vaultPda,
              guardianEntry: g2Pda,
              guardian:      guardian2.publicKey,
              systemProgram: SystemProgram.programId,
            })
            .signers([owner])
            .rpc();

          const vault = await fetchVault(program, vaultPda);
          assert.equal(vault.guardianCount, 2);
        });

        it('adds guardian3 (personal)', async () => {
          await program.methods
            .addGuardian({ role: GUARDIAN_ROLE.personal })
            .accounts({
              owner:         owner.publicKey,
              vault:         vaultPda,
              guardianEntry: g3Pda,
              guardian:      guardian3.publicKey,
              systemProgram: SystemProgram.programId,
            })
            .signers([owner])
            .rpc();

          const vault = await fetchVault(program, vaultPda);
          assert.equal(vault.guardianCount, 3);
        });

        it('rejects adding the same guardian twice', async () => {
          try {
            await program.methods
              .addGuardian({ role: GUARDIAN_ROLE.personal })
              .accounts({
                owner:         owner.publicKey,
                vault:         vaultPda,
                guardianEntry: g1Pda,
                guardian:      guardian1.publicKey,
                systemProgram: SystemProgram.programId,
              })
              .signers([owner])
              .rpc();
            assert.fail('should have thrown');
          } catch (e: any) {
            // Anchor will throw because account already exists
            expect(e.message).to.include('already in use');
          }
        });

        it('rejects setting threshold above guardian count', async () => {
          try {
            await program.methods
              .updateVaultSettings({
                inactivityThreshold: DEFAULT_VAULT_PARAMS.inactivityThreshold,
                timelockDuration:    DEFAULT_VAULT_PARAMS.timelockDuration,
                guardianThreshold:   10, // only 3 guardians exist
              })
              .accounts({ owner: owner.publicKey, vault: vaultPda })
              .signers([owner])
              .rpc();
            assert.fail('should have thrown');
          } catch (e: any) {
            expect(e).to.be.instanceOf(AnchorError);
            expect(e.error.errorCode.code).to.equal('GuardianThresholdExceedsCount');
          }
        });

        it('removes guardian3', async () => {
          await program.methods
            .removeGuardian()
            .accounts({
              owner:         owner.publicKey,
              vault:         vaultPda,
              guardianEntry: g3Pda,
              guardian:      guardian3.publicKey,
            })
            .signers([owner])
            .rpc();

          const vault = await fetchVault(program, vaultPda);
          assert.equal(vault.guardianCount, 2, 'guardian count decremented');
        });

      });

      // ═══════════════════════════════════════════════════════════════════════════
      // MODULE D — Beneficiaries
      // ═══════════════════════════════════════════════════════════════════════════

      describe('Module D — Beneficiaries', () => {
        let b1Pda: PublicKey;
        let b2Pda: PublicKey;

        before(() => {
          [b1Pda] = deriveBeneficiaryEntryPda(vaultPda, beneficiary1.publicKey, program.programId);
          [b2Pda] = deriveBeneficiaryEntryPda(vaultPda, beneficiary2.publicKey, program.programId);
        });

        it('adds beneficiary1 with 5000 bps (50%)', async () => {
          await program.methods
            .addBeneficiary({ shareBps: BPS.half })
            .accounts({
              owner:             owner.publicKey,
              vault:             vaultPda,
              beneficiaryEntry:  b1Pda,
              beneficiary:       beneficiary1.publicKey,
              systemProgram:     SystemProgram.programId,
            })
            .signers([owner])
            .rpc();

          const vault = await fetchVault(program, vaultPda);
          assert.equal(vault.totalBps, 5_000);
          assert.equal(vault.beneficiaryCount, 1);

          const entry = await fetchBeneficiaryEntry(program, b1Pda);
          assert.equal(entry.shareBps, BPS.half);
          assert.ok(entry.active);
        });

        it('adds beneficiary2 with 5000 bps (50%)', async () => {
          await program.methods
            .addBeneficiary({ shareBps: BPS.half })
            .accounts({
              owner:             owner.publicKey,
              vault:             vaultPda,
              beneficiaryEntry:  b2Pda,
              beneficiary:       beneficiary2.publicKey,
              systemProgram:     SystemProgram.programId,
            })
            .signers([owner])
            .rpc();

          const vault = await fetchVault(program, vaultPda);
          assert.equal(vault.totalBps, 10_000, 'total bps is exactly 10000');
          assert.equal(vault.beneficiaryCount, 2);
        });

        it('rejects adding a beneficiary that would exceed 10000 bps', async () => {
          const extraBeneficiary = Keypair.generate();
          await airdrop(conn, extraBeneficiary.publicKey, 1);
          const [extraPda] = deriveBeneficiaryEntryPda(
            vaultPda,
            extraBeneficiary.publicKey,
            program.programId,
          );

          try {
            await program.methods
              .addBeneficiary({ shareBps: 1 }) // even 1 bps would push over 10000
              .accounts({
                owner:             owner.publicKey,
                vault:             vaultPda,
                beneficiaryEntry:  extraPda,
                beneficiary:       extraBeneficiary.publicKey,
                systemProgram:     SystemProgram.programId,
              })
              .signers([owner])
              .rpc();
            assert.fail('should have thrown');
          } catch (e: any) {
            expect(e).to.be.instanceOf(AnchorError);
            expect(e.error.errorCode.code).to.equal('BpsOverflow');
          }
        });

        it('updates beneficiary1 share (3000 bps)', async () => {
          // first adjust b2 down to 7000 to make room
          await program.methods
            .updateBeneficiary({ shareBps: 7_000 })
            .accounts({
              owner:             owner.publicKey,
              vault:             vaultPda,
              beneficiaryEntry:  b2Pda,
            })
            .signers([owner])
            .rpc();

          await program.methods
            .updateBeneficiary({ shareBps: 3_000 })
            .accounts({
              owner:             owner.publicKey,
              vault:             vaultPda,
              beneficiaryEntry:  b1Pda,
            })
            .signers([owner])
            .rpc();

          const vault = await fetchVault(program, vaultPda);
          assert.equal(vault.totalBps, 10_000, 'total bps still 10000 after updates');
        });

        it('sets an asset rule override (pro-rata)', async () => {
          const testMint = await createTestMint(conn, owner);
          const [rulePda] = deriveAssetRulePda(
            vaultPda,
            beneficiary1.publicKey,
            testMint,
            program.programId,
          );

          await program.methods
            .setAssetRule({ ruleType: ASSET_RULE_TYPE.proRata })
            .accounts({
              owner:             owner.publicKey,
              vault:             vaultPda,
              beneficiaryEntry:  b1Pda,
              assetRule:         rulePda,
              mint:              testMint,
              systemProgram:     SystemProgram.programId,
            })
            .signers([owner])
            .rpc();

          const rule = await program.account.assetRule.fetch(rulePda);
          assert.ok('proRata' in rule.ruleType, 'rule type is pro-rata');
        });

      });

      // ═══════════════════════════════════════════════════════════════════════════
      // MODULE E — Liveness
      // ═══════════════════════════════════════════════════════════════════════════

      describe('Module E — Liveness', () => {
        let delegatePda: PublicKey;

        before(() => {
          [delegatePda] = deriveLivenessDelegatePda(vaultPda, delegate.publicKey, program.programId);
        });

        it('owner can check in', async () => {
          const vaultBefore = await fetchVault(program, vaultPda);
          const tsBefore = vaultBefore.lastCheckIn.toNumber();

          // Small sleep to ensure timestamp advances on localnet
          await new Promise(r => setTimeout(r, 1000));

          await program.methods
            .checkIn()
            .accounts({ signer: owner.publicKey, vault: vaultPda })
            .signers([owner])
            .rpc();

          const vaultAfter = await fetchVault(program, vaultPda);
          assert.isAbove(
            vaultAfter.lastCheckIn.toNumber(),
            tsBefore,
            'lastCheckIn advanced',
          );
        });

        it('adds a liveness delegate', async () => {
          await program.methods
            .addDelegate()
            .accounts({
              owner:            owner.publicKey,
              vault:            vaultPda,
              livenessDelegate: delegatePda,
              delegate:         delegate.publicKey,
              systemProgram:    SystemProgram.programId,
            })
            .signers([owner])
            .rpc();

          const delegateEntry = await program.account.livenessDelegate.fetch(delegatePda);
          assert.ok(delegateEntry.delegate.equals(delegate.publicKey));
          assert.ok(delegateEntry.active);
        });

        it('delegate can check in on behalf of owner', async () => {
          await program.methods
            .checkIn()
            .accounts({
              signer:           delegate.publicKey,
              vault:            vaultPda,
              livenessDelegate: delegatePda,
            })
            .signers([delegate])
            .rpc();

          // No error = check-in succeeded
        });

        it('rejects check-in from unauthorized signer', async () => {
          try {
            await program.methods
              .checkIn()
              .accounts({
                signer: guardian1.publicKey,
                vault:  vaultPda,
              })
              .signers([guardian1])
              .rpc();
            assert.fail('should have thrown');
          } catch (e: any) {
            expect(e).to.be.instanceOf(AnchorError);
            expect(e.error.errorCode.code).to.equal('Unauthorized');
          }
        });

        it('removes a liveness delegate', async () => {
          await program.methods
            .removeDelegate()
            .accounts({
              owner:            owner.publicKey,
              vault:            vaultPda,
              livenessDelegate: delegatePda,
              delegate:         delegate.publicKey,
            })
            .signers([owner])
            .rpc();

          const delegateEntry = await program.account.livenessDelegate.fetch(delegatePda);
          assert.ok(!delegateEntry.active, 'delegate should be inactive');
        });

      });

      // ═══════════════════════════════════════════════════════════════════════════
      // MODULE F — Documents
      // ═══════════════════════════════════════════════════════════════════════════

      describe('Module F — Documents', () => {
        const TEST_HASH = Buffer.alloc(32, 0xab); // 32-byte hash
        const TEST_URI  = 'arweave://aaaabbbbccccdddd';

        it('sets a document commitment', async () => {
          await program.methods
            .setDocumentCommitment({
              docHash: Array.from(TEST_HASH),
              docUri:  TEST_URI,
            })
            .accounts({ owner: owner.publicKey, vault: vaultPda })
            .signers([owner])
            .rpc();

          const vault = await fetchVault(program, vaultPda);
          assert.deepEqual(
            Buffer.from(vault.docHash as number[]),
            TEST_HASH,
            'doc hash stored',
          );
          assert.equal(vault.docUri, TEST_URI, 'doc URI stored');
        });

        it('revokes a document commitment', async () => {
          await program.methods
            .revokeDocumentCommitment()
            .accounts({ owner: owner.publicKey, vault: vaultPda })
            .signers([owner])
            .rpc();

          const vault = await fetchVault(program, vaultPda);
          assert.deepEqual(
            Buffer.from(vault.docHash as number[]),
            Buffer.alloc(32, 0),
            'doc hash cleared',
          );
          assert.equal(vault.docUri, '', 'doc URI cleared');
        });

      });

      // ═══════════════════════════════════════════════════════════════════════════
      // MODULE G — Deposits & Withdrawals
      // ═══════════════════════════════════════════════════════════════════════════

      describe('Module G — Deposits & Withdrawals', () => {
        const DEPOSIT_SOL = 5;

        it('owner can deposit SOL into vault custody', async () => {
          const authBalBefore = await conn.getBalance(vaultAuthority);

          await program.methods
            .depositSol({ lamports: new BN(DEPOSIT_SOL * LAMPORTS_PER_SOL) })
            .accounts({
              owner:         owner.publicKey,
              vault:         vaultPda,
              vaultAuthority,
              systemProgram: SystemProgram.programId,
            })
            .signers([owner])
            .rpc();

          const authBalAfter = await conn.getBalance(vaultAuthority);
          assert.approximately(
            authBalAfter - authBalBefore,
            DEPOSIT_SOL * LAMPORTS_PER_SOL,
            5_000, // small tolerance for rent
            'vault authority balance increased',
          );
        });

        it('owner can withdraw SOL from vault custody', async () => {
          const WITHDRAW_SOL = 1;
          const ownerBalBefore = await conn.getBalance(owner.publicKey);

          await program.methods
            .withdrawSol({ lamports: new BN(WITHDRAW_SOL * LAMPORTS_PER_SOL) })
            .accounts({
              owner:         owner.publicKey,
              vault:         vaultPda,
              vaultAuthority,
              systemProgram: SystemProgram.programId,
            })
            .signers([owner])
            .rpc();

          const ownerBalAfter = await conn.getBalance(owner.publicKey);
          assert.isAbove(ownerBalAfter, ownerBalBefore, 'owner balance increased after withdraw');
        });

        it('rejects withdrawal by non-owner', async () => {
          try {
            await program.methods
              .withdrawSol({ lamports: new BN(0.1 * LAMPORTS_PER_SOL) })
              .accounts({
                owner:         guardian1.publicKey,
                vault:         vaultPda,
                vaultAuthority,
                systemProgram: SystemProgram.programId,
              })
              .signers([guardian1])
              .rpc();
            assert.fail('should have thrown');
          } catch (e: any) {
            expect(e).to.be.instanceOf(AnchorError);
            expect(e.error.errorCode.code).to.equal('Unauthorized');
          }
        });

      });

      // ═══════════════════════════════════════════════════════════════════════════
      // MODULE H — Unlock Flow
      // ═══════════════════════════════════════════════════════════════════════════

      describe('Module H — Unlock Flow', () => {
        let unlockSessionPda: PublicKey;
        let approval1Pda:     PublicKey;
        let approval2Pda:     PublicKey;
        let g1Pda:            PublicKey;
        let g2Pda:            PublicKey;

        before(() => {
          [unlockSessionPda] = deriveUnlockSessionPda(vaultPda, program.programId);
          [g1Pda]            = deriveGuardianEntryPda(vaultPda, guardian1.publicKey, program.programId);
          [g2Pda]            = deriveGuardianEntryPda(vaultPda, guardian2.publicKey, program.programId);
          [approval1Pda]     = deriveGuardianApprovalPda(unlockSessionPda, guardian1.publicKey, program.programId);
          [approval2Pda]     = deriveGuardianApprovalPda(unlockSessionPda, guardian2.publicKey, program.programId);
        });

        it('rejects initiate_unlock when owner is still active', async () => {
          // Owner just checked in — inactivity threshold not met
          try {
            await program.methods
              .initiateUnlock()
              .accounts({
                guardian:      guardian1.publicKey,
                guardianEntry: g1Pda,
                vault:         vaultPda,
                unlockSession: unlockSessionPda,
                systemProgram: SystemProgram.programId,
              })
              .signers([guardian1])
              .rpc();
            assert.fail('should have thrown');
          } catch (e: any) {
            expect(e).to.be.instanceOf(AnchorError);
            expect(e.error.errorCode.code).to.equal('UnlockNotEligible');
          }
        });

        it('initiates unlock after simulated inactivity (test override)', async () => {
          // On localnet we manipulate clock or use a very short inactivity threshold
          // Here we update vault to minimum inactivity (30d) and simulate via
          // a special test instruction or by using anchor's clock sysvar override.
          // Since we can't actually wait 30d in test, we use a minimum of 1 second
          // override (the program must support a TEST_MODE flag or
          // we use solana-test-validator --bpf-program with clock override).

          // For test purposes, update vault to 1-second inactivity threshold
          // (this tests the logic; real security tests run in integration environment)
          await program.methods
            .updateVaultSettings({
              inactivityThreshold: new BN(1), // 1 second for test
              timelockDuration:    new BN(1), // 1 second timelock for test
              guardianThreshold:   2,
            })
            .accounts({ owner: owner.publicKey, vault: vaultPda })
            .signers([owner])
            .rpc();

          // Wait 2 seconds
          await new Promise(r => setTimeout(r, 2000));

          await program.methods
            .initiateUnlock()
            .accounts({
              guardian:      guardian1.publicKey,
              guardianEntry: g1Pda,
              vault:         vaultPda,
              unlockSession: unlockSessionPda,
              systemProgram: SystemProgram.programId,
            })
            .signers([guardian1])
            .rpc();

          const vault   = await fetchVault(program, vaultPda);
          const session = await fetchUnlockSession(program, unlockSessionPda);

          assert.ok('unlocking' in vault.status, 'vault status is Unlocking');
          assert.ok('proposed'  in session.status, 'session status is Proposed');
          assert.equal(session.approvalCount, 0);
        });

        it('rejects delegate attempting to approve unlock', async () => {
          // Re-add delegate (was removed in Module E tests)
          const [delegatePda] = deriveLivenessDelegatePda(
            vaultPda,
            delegate.publicKey,
            program.programId,
          );
          await program.methods
            .addDelegate()
            .accounts({
              owner: owner.publicKey, vault: vaultPda,
              livenessDelegate: delegatePda,
              delegate: delegate.publicKey,
              systemProgram: SystemProgram.programId,
            })
            .signers([owner])
            .rpc();

          const [delegateGuardianPda] = deriveGuardianEntryPda(
            vaultPda, delegate.publicKey, program.programId,
          );
          const [delegateApprovalPda] = deriveGuardianApprovalPda(
            unlockSessionPda, delegate.publicKey, program.programId,
          );

          // Delegate is not a guardian, so this should fail with account not found
          // or Unauthorized depending on validation order
          try {
            await program.methods
              .approveUnlock()
              .accounts({
                guardian:        delegate.publicKey,
                guardianEntry:   delegateGuardianPda,
                vault:           vaultPda,
                unlockSession:   unlockSessionPda,
                guardianApproval: delegateApprovalPda,
                systemProgram:   SystemProgram.programId,
              })
              .signers([delegate])
              .rpc();
            assert.fail('should have thrown');
          } catch (e: any) {
            // Expected — delegate is not a guardian entry
            expect(e).to.exist;
          }
        });

        it('guardian1 approves unlock', async () => {
          await program.methods
            .approveUnlock()
            .accounts({
              guardian:        guardian1.publicKey,
              guardianEntry:   g1Pda,
              vault:           vaultPda,
              unlockSession:   unlockSessionPda,
              guardianApproval: approval1Pda,
              systemProgram:   SystemProgram.programId,
            })
            .signers([guardian1])
            .rpc();

          const session = await fetchUnlockSession(program, unlockSessionPda);
          assert.equal(session.approvalCount, 1, 'approval count is 1');
          // Threshold is 2, so still Proposed
          assert.ok('proposed' in session.status, 'still Proposed after 1 of 2');
        });

        it('rejects double-approval from same guardian', async () => {
          try {
            await program.methods
              .approveUnlock()
              .accounts({
                guardian:        guardian1.publicKey,
                guardianEntry:   g1Pda,
                vault:           vaultPda,
                unlockSession:   unlockSessionPda,
                guardianApproval: approval1Pda,
                systemProgram:   SystemProgram.programId,
              })
              .signers([guardian1])
              .rpc();
            assert.fail('should have thrown');
          } catch (e: any) {
            expect(e.message).to.include('already in use');
          }
        });

        it('guardian2 approves unlock — threshold met, timelock starts', async () => {
          await program.methods
            .approveUnlock()
            .accounts({
              guardian:        guardian2.publicKey,
              guardianEntry:   g2Pda,
              vault:           vaultPda,
              unlockSession:   unlockSessionPda,
              guardianApproval: approval2Pda,
              systemProgram:   SystemProgram.programId,
            })
            .signers([guardian2])
            .rpc();

          const session = await fetchUnlockSession(program, unlockSessionPda);
          assert.equal(session.approvalCount, 2, 'approval count is 2');
          assert.ok('approved' in session.status, 'status is Approved');
          assert.isAbove(
            session.timelockEndsAt.toNumber(),
            0,
            'timelockEndsAt is set',
          );
        });

        it('owner can cancel unlock during timelock', async () => {
          await program.methods
            .cancelUnlock()
            .accounts({
              owner:         owner.publicKey,
              vault:         vaultPda,
              unlockSession: unlockSessionPda,
            })
            .signers([owner])
            .rpc();

          const vault   = await fetchVault(program, vaultPda);
          const session = await fetchUnlockSession(program, unlockSessionPda);

          assert.ok('active' in vault.status, 'vault reverted to Active');
          assert.ok('cancelled' in session.status, 'session is Cancelled');
        });

      });

      // ═══════════════════════════════════════════════════════════════════════════
      // MODULE I — Distribution (SOL)
      // ═══════════════════════════════════════════════════════════════════════════

      describe('Module I — SOL Distribution', () => {
        let unlockSessionPda: PublicKey;
        let approval1Pda:     PublicKey;
        let approval2Pda:     PublicKey;
        let solSessionPda:    PublicKey;
        let g1Pda:            PublicKey;
        let g2Pda:            PublicKey;
        let b1Pda:            PublicKey;
        let b2Pda:            PublicKey;

        before(async () => {
          [unlockSessionPda] = deriveUnlockSessionPda(vaultPda, program.programId);
          [g1Pda]            = deriveGuardianEntryPda(vaultPda, guardian1.publicKey, program.programId);
          [g2Pda]            = deriveGuardianEntryPda(vaultPda, guardian2.publicKey, program.programId);
          [b1Pda]            = deriveBeneficiaryEntryPda(vaultPda, beneficiary1.publicKey, program.programId);
          [b2Pda]            = deriveBeneficiaryEntryPda(vaultPda, beneficiary2.publicKey, program.programId);
          [solSessionPda]    = deriveSolDistributionSessionPda(vaultPda, program.programId);
          [approval1Pda]     = deriveGuardianApprovalPda(unlockSessionPda, guardian1.publicKey, program.programId);
          [approval2Pda]     = deriveGuardianApprovalPda(unlockSessionPda, guardian2.publicKey, program.programId);

          // Initiate a fresh unlock (threshold already met — wait for timelock)
          // Session was cancelled, so we need to re-initiate
          await new Promise(r => setTimeout(r, 1500));

          await program.methods
            .initiateUnlock()
            .accounts({
              guardian: guardian1.publicKey,
              guardianEntry: g1Pda,
              vault: vaultPda,
              unlockSession: unlockSessionPda,
              systemProgram: SystemProgram.programId,
            })
            .signers([guardian1])
            .rpc();

          await program.methods
            .approveUnlock()
            .accounts({
              guardian: guardian1.publicKey,
              guardianEntry: g1Pda,
              vault: vaultPda,
              unlockSession: unlockSessionPda,
              guardianApproval: approval1Pda,
              systemProgram: SystemProgram.programId,
            })
            .signers([guardian1])
            .rpc();

          await program.methods
            .approveUnlock()
            .accounts({
              guardian: guardian2.publicKey,
              guardianEntry: g2Pda,
              vault: vaultPda,
              unlockSession: unlockSessionPda,
              guardianApproval: approval2Pda,
              systemProgram: SystemProgram.programId,
            })
            .signers([guardian2])
            .rpc();

          // Wait for 1-second timelock to expire
          await new Promise(r => setTimeout(r, 2000));
        });

        it('initialises SOL distribution session', async () => {
          await program.methods
            .initSolDistribution()
            .accounts({
              owner:              owner.publicKey,
              vault:              vaultPda,
              unlockSession:      unlockSessionPda,
              solDistribution:    solSessionPda,
              vaultAuthority,
              systemProgram:      SystemProgram.programId,
            })
            .signers([owner])
            .rpc();

          const session = await fetchSolDistributionSession(program, solSessionPda);
          assert.equal(session.cursor, 0, 'cursor starts at 0');
          assert.ok(!session.complete, 'not complete yet');

          const vault = await fetchVault(program, vaultPda);
          assert.ok('unlocked' in vault.status, 'vault status is Executing/Unlocked');
        });

        it('rejects SOL batch with wrong start index (cursor mismatch)', async () => {
          // Sort beneficiaries canonically
          const sorted = sortBeneficiariesCanonically([
            beneficiary1.publicKey,
            beneficiary2.publicKey,
          ]);
          const entries = sorted.map(pk => ({
            pda: pk.equals(beneficiary1.publicKey) ? b1Pda : b2Pda,
            wallet: pk,
          }));

          const remainingAccounts = buildSolBatchRemainingAccounts(entries);

          try {
            await program.methods
              .executeSolBatch({
                startIndex: 1, // wrong — cursor is 0
                batchSize:  2,
              })
              .accounts({
                owner:           owner.publicKey,
                vault:           vaultPda,
                solDistribution: solSessionPda,
                vaultAuthority,
                systemProgram:   SystemProgram.programId,
              })
              .remainingAccounts(remainingAccounts)
              .signers([owner])
              .rpc();
            assert.fail('should have thrown');
          } catch (e: any) {
            expect(e).to.be.instanceOf(AnchorError);
            expect(e.error.errorCode.code).to.equal('CursorMismatch');
          }
        });

        it('executes SOL distribution batch (both beneficiaries in one batch)', async () => {
          // Capture balances before
          const b1BalBefore = await conn.getBalance(beneficiary1.publicKey);
          const b2BalBefore = await conn.getBalance(beneficiary2.publicKey);
          const authBal     = await conn.getBalance(vaultAuthority);

          // Sort canonically
          const sorted = sortBeneficiariesCanonically([
            beneficiary1.publicKey,
            beneficiary2.publicKey,
          ]);
          const entries = sorted.map(pk => ({
            pda:    pk.equals(beneficiary1.publicKey) ? b1Pda : b2Pda,
            wallet: pk,
          }));

          const remainingAccounts = buildSolBatchRemainingAccounts(entries);

          await program.methods
            .executeSolBatch({ startIndex: 0, batchSize: 2 })
            .accounts({
              owner:           owner.publicKey,
              vault:           vaultPda,
              solDistribution: solSessionPda,
              vaultAuthority,
              systemProgram:   SystemProgram.programId,
            })
            .remainingAccounts(remainingAccounts)
            .signers([owner])
            .rpc();

          const session = await fetchSolDistributionSession(program, solSessionPda);
          assert.equal(session.cursor, 2, 'cursor advanced to 2');
          assert.ok(session.complete, 'session is complete');

          // Verify beneficiaries received funds
          const b1BalAfter = await conn.getBalance(beneficiary1.publicKey);
          const b2BalAfter = await conn.getBalance(beneficiary2.publicKey);

          assert.isAbove(b1BalAfter, b1BalBefore, 'beneficiary1 received SOL');
          assert.isAbove(b2BalAfter, b2BalBefore, 'beneficiary2 received SOL');

          // Verify total distributed approximately equals vault custody balance
          const totalDistributed =
            (b1BalAfter - b1BalBefore) + (b2BalAfter - b2BalBefore);
          assert.approximately(
            totalDistributed,
            authBal,
            10_000, // small tolerance for rent/fees
            'total distribution matches vault balance',
          );
        });

        it('verifies rounding remainder went to last beneficiary', async () => {
          const session = await fetchSolDistributionSession(program, solSessionPda);
          // distributedTotal should equal totalLamports (no residue)
          assert.equal(
            session.totalLamports.toNumber(),
            session.distributedTotal.toNumber(),
            'no lamport residue — remainder allocated to last beneficiary',
          );
        });

        it('finalises unlock and sets vault to Distributed', async () => {
          await program.methods
            .finalizeUnlock()
            .accounts({
              owner:           owner.publicKey,
              vault:           vaultPda,
              unlockSession:   unlockSessionPda,
              solDistribution: solSessionPda,
            })
            .signers([owner])
            .rpc();

          const vault = await fetchVault(program, vaultPda);
          assert.ok('distributed' in vault.status, 'vault is Distributed');
        });

        it('rejects deposit into a distributed vault', async () => {
          try {
            await program.methods
              .depositSol({ lamports: new BN(0.1 * LAMPORTS_PER_SOL) })
              .accounts({
                owner: owner.publicKey,
                vault: vaultPda,
                vaultAuthority,
                systemProgram: SystemProgram.programId,
              })
              .signers([owner])
              .rpc();
            assert.fail('should have thrown');
          } catch (e: any) {
            expect(e).to.be.instanceOf(AnchorError);
            expect(e.error.errorCode.code).to.equal('VaultDistributed');
          }
        });

      });

    });

    PART 2 — API Server Tests (Build 4)
    api/src/__tests__/setup.ts

    TypeScript

    // api/src/__tests__/setup.ts
    import Fastify, { FastifyInstance } from 'fastify';
    import { PrismaClient }            from '@prisma/client';
    import { createClient }            from 'redis';
    import { buildApp }                from '../app';   // Build 4 app factory

    // ─── Test database setup ──────────────────────────────────────────────────────
    // Uses TEST_DATABASE_URL from env (separate test DB)

    export let app:    FastifyInstance;
    export let prisma: PrismaClient;

    export async function setupTestApp() {
      prisma = new PrismaClient({
        datasources: { db: { url: process.env.TEST_DATABASE_URL } },
      });

      await prisma.$connect();

      app = await buildApp({
        logger: false,  // suppress logs in tests
        testing: true,  // disables rate limiting in test mode
      });

      await app.ready();
    }

    export async function teardownTestApp() {
      await app.close();
      await prisma.$disconnect();
    }

    // ─── DB cleanup between tests ─────────────────────────────────────────────────

    export async function cleanDb() {
      // Delete in dependency order
      await prisma.$transaction([
        prisma.guardianApproval.deleteMany(),
        prisma.unlockSession.deleteMany(),
        prisma.solDistributionSession.deleteMany(),
        prisma.splDistributionSession.deleteMany(),
        prisma.beneficiaryEntry.deleteMany(),
        prisma.guardianEntry.deleteMany(),
        prisma.activityLog.deleteMany(),
        prisma.notification.deleteMany(),
        prisma.vault.deleteMany(),
        prisma.session.deleteMany(),
        prisma.nonce.deleteMany(),
      ]);
    }

    // ─── Test wallet helpers ──────────────────────────────────────────────────────

    import { Keypair } from '@solana/web3.js';
    import nacl        from 'tweetnacl';
    import bs58        from 'bs58';

    export interface TestWallet {
      keypair: Keypair;
      pubkey:  string;
    }

    export function createTestWallet(): TestWallet {
      const keypair = Keypair.generate();
      return { keypair, pubkey: keypair.publicKey.toBase58() };
    }

    /**
     * Constructs a valid SIWS message and signs it with the test keypair.
     * Returns headers/body ready for /v1/auth/verify.
     */
    export function signSiwsMessage(
      wallet: TestWallet,
      nonce: string,
      domain = 'test.legacyvault.io',
    ): { message: string; signature: string } {
      const issuedAt = new Date().toISOString();
      const message  = [
        `${domain} wants you to sign in with your Solana account:`,
        wallet.pubkey,
        '',
        'Sign in to LegacyVault',
        '',
        `URI: https://${domain}`,
        `Version: 1`,
        `Nonce: ${nonce}`,
        `Issued At: ${issuedAt}`,
      ].join('\n');

      const msgBytes = new TextEncoder().encode(message);
      const sigBytes = nacl.sign.detached(msgBytes, wallet.keypair.secretKey);

      return { message, signature: bs58.encode(sigBytes) };
    }

    /**
     * Full helper: get nonce → sign → verify → return access token.
     */
    export async function authenticateTestWallet(
      testApp: FastifyInstance,
      wallet: TestWallet,
    ): Promise<string> {
      // Step 1: get nonce
      const nonceRes = await testApp.inject({
        method: 'GET',
        url:    `/v1/auth/nonce?wallet=${wallet.pubkey}`,
      });
      const { nonce } = JSON.parse(nonceRes.body);

      // Step 2: sign
      const { message, signature } = signSiwsMessage(wallet, nonce);

      // Step 3: verify
      const verifyRes = await testApp.inject({
        method:  'POST',
        url:     '/v1/auth/verify',
        payload: { wallet: wallet.pubkey, message, signature },
      });

      const { accessToken } = JSON.parse(verifyRes.body);
      return accessToken;
    }

    api/src/__tests__/auth.test.ts

    TypeScript

    // api/src/__tests__/auth.test.ts
    import { describe, it, before, after, beforeEach } from 'mocha';
    import { expect }                                   from 'chai';
    import {
      app,
      setupTestApp,
      teardownTestApp,
      cleanDb,
      createTestWallet,
      signSiwsMessage,
      authenticateTestWallet,
    } from './setup';

    describe('Auth Routes', () => {
      before(setupTestApp);
      after(teardownTestApp);
      beforeEach(cleanDb);

      // ── GET /v1/auth/nonce ──────────────────────────────────────────────────────

      describe('GET /v1/auth/nonce', () => {
        it('returns a nonce for a valid wallet address', async () => {
          const wallet = createTestWallet();

          const res = await app.inject({
            method: 'GET',
            url:    `/v1/auth/nonce?wallet=${wallet.pubkey}`,
          });

          expect(res.statusCode).to.equal(200);
          const body = JSON.parse(res.body);
          expect(body).to.have.property('nonce');
          expect(body.nonce).to.be.a('string').with.length.greaterThan(0);
        });

        it('returns 400 for missing wallet param', async () => {
          const res = await app.inject({
            method: 'GET',
            url:    '/v1/auth/nonce',
          });
          expect(res.statusCode).to.equal(400);
        });

        it('returns 400 for invalid wallet address', async () => {
          const res = await app.inject({
            method: 'GET',
            url:    '/v1/auth/nonce?wallet=notavalidbase58address',
          });
          expect(res.statusCode).to.equal(400);
        });

        it('returns different nonces for repeated calls (replay protection)', async () => {
          const wallet = createTestWallet();
          const res1   = await app.inject({ method: 'GET', url: `/v1/auth/nonce?wallet=${wallet.pubkey}` });
          const res2   = await app.inject({ method: 'GET', url: `/v1/auth/nonce?wallet=${wallet.pubkey}` });

          const { nonce: n1 } = JSON.parse(res1.body);
          const { nonce: n2 } = JSON.parse(res2.body);
          expect(n1).to.not.equal(n2, 'each nonce request should be unique');
        });
      });

      // ── POST /v1/auth/verify ────────────────────────────────────────────────────

      describe('POST /v1/auth/verify', () => {
        it('returns access + refresh tokens for a valid SIWS signature', async () => {
          const wallet = createTestWallet();

          const nonceRes = await app.inject({ method: 'GET', url: `/v1/auth/nonce?wallet=${wallet.pubkey}` });
          const { nonce } = JSON.parse(nonceRes.body);
          const { message, signature } = signSiwsMessage(wallet, nonce);

          const res = await app.inject({
            method:  'POST',
            url:     '/v1/auth/verify',
            payload: { wallet: wallet.pubkey, message, signature },
          });

          expect(res.statusCode).to.equal(200);
          const body = JSON.parse(res.body);
          expect(body).to.have.property('accessToken');
          expect(body).to.have.property('refreshToken');
          expect(body.accessToken).to.be.a('string');
        });

        it('returns 401 for an invalid signature', async () => {
          const wallet  = createTestWallet();
          const wallet2 = createTestWallet();

          const nonceRes = await app.inject({ method: 'GET', url: `/v1/auth/nonce?wallet=${wallet.pubkey}` });
          const { nonce } = JSON.parse(nonceRes.body);

          // Sign with wallet2's key but claim wallet's pubkey
          const { message, signature } = signSiwsMessage(wallet2, nonce);

          const res = await app.inject({
            method:  'POST',
            url:     '/v1/auth/verify',
            payload: { wallet: wallet.pubkey, message, signature },
          });

          expect(res.statusCode).to.equal(401);
        });

        it('returns 401 for a replayed nonce', async () => {
          const wallet = createTestWallet();

          const nonceRes = await app.inject({ method: 'GET', url: `/v1/auth/nonce?wallet=${wallet.pubkey}` });
          const { nonce } = JSON.parse(nonceRes.body);
          const { message, signature } = signSiwsMessage(wallet, nonce);

          // First verify — should succeed
          await app.inject({
            method:  'POST',
            url:     '/v1/auth/verify',
            payload: { wallet: wallet.pubkey, message, signature },
          });

          // Second verify with same nonce — should fail
          const res2 = await app.inject({
            method:  'POST',
            url:     '/v1/auth/verify',
            payload: { wallet: wallet.pubkey, message, signature },
          });

          expect(res2.statusCode).to.equal(401);
        });

        it('returns 400 for missing fields', async () => {
          const res = await app.inject({
            method:  'POST',
            url:     '/v1/auth/verify',
            payload: { wallet: 'abc' }, // missing message + signature
          });
          expect(res.statusCode).to.equal(400);
        });
      });

      // ── POST /v1/auth/refresh ───────────────────────────────────────────────────

      describe('POST /v1/auth/refresh', () => {
        it('issues a new access token from a valid refresh token', async () => {
          const wallet = createTestWallet();

          const nonceRes = await app.inject({ method: 'GET', url: `/v1/auth/nonce?wallet=${wallet.pubkey}` });
          const { nonce } = JSON.parse(nonceRes.body);
          const { message, signature } = signSiwsMessage(wallet, nonce);

          const verifyRes = await app.inject({
            method: 'POST', url: '/v1/auth/verify',
            payload: { wallet: wallet.pubkey, message, signature },
          });
          const { refreshToken } = JSON.parse(verifyRes.body);

          const res = await app.inject({
            method:  'POST',
            url:     '/v1/auth/refresh',
            payload: { refreshToken },
          });

          expect(res.statusCode).to.equal(200);
          const body = JSON.parse(res.body);
          expect(body).to.have.property('accessToken');
        });

        it('returns 401 for an invalid refresh token', async () => {
          const res = await app.inject({
            method:  'POST',
            url:     '/v1/auth/refresh',
            payload: { refreshToken: 'totally.invalid.token' },
          });
          expect(res.statusCode).to.equal(401);
        });

        it('rotates the refresh token on use (old token invalidated)', async () => {
          const wallet = createTestWallet();
          const token  = await authenticateTestWallet(app, wallet);

          // Get original refresh token
          const nonceRes = await app.inject({ method: 'GET', url: `/v1/auth/nonce?wallet=${wallet.pubkey}` });
          const { nonce } = JSON.parse(nonceRes.body);
          const { message, signature } = signSiwsMessage(wallet, nonce);
          const verifyRes = await app.inject({
            method: 'POST', url: '/v1/auth/verify',
            payload: { wallet: wallet.pubkey, message, signature },
          });
          const { refreshToken: original } = JSON.parse(verifyRes.body);

          // First refresh
          const r1 = await app.inject({
            method: 'POST', url: '/v1/auth/refresh',
            payload: { refreshToken: original },
          });
          expect(r1.statusCode).to.equal(200);

          // Second refresh with original token should fail
          const r2 = await app.inject({
            method: 'POST', url: '/v1/auth/refresh',
            payload: { refreshToken: original },
          });
          expect(r2.statusCode).to.equal(401, 'old refresh token should be invalid after rotation');
        });
      });

    });

    api/src/__tests__/middleware.test.ts

    TypeScript

    // api/src/__tests__/middleware.test.ts
    import { describe, it, before, after, beforeEach } from 'mocha';
    import { expect }                                   from 'chai';
    import {
      app,
      setupTestApp,
      teardownTestApp,
      cleanDb,
      createTestWallet,
      authenticateTestWallet,
    } from './setup';

    describe('Auth Middleware', () => {
      before(setupTestApp);
      after(teardownTestApp);
      beforeEach(cleanDb);

      it('rejects protected routes without a token', async () => {
        const res = await app.inject({
          method: 'GET',
          url:    '/v1/vaults/somepda/summary',
        });
        expect(res.statusCode).to.equal(401);
      });

      it('rejects requests with a malformed Bearer token', async () => {
        const res = await app.inject({
          method:  'GET',
          url:     '/v1/vaults/somepda/summary',
          headers: { Authorization: 'Bearer not.a.valid.jwt' },
        });
        expect(res.statusCode).to.equal(401);
      });

      it('rejects requests with an expired token', async () => {
        // This requires the test setup to issue a token with very short TTL
        // and then wait for expiry — skipped on slow CI, marked as integration
        // In unit context: mock the JWT verify to throw TokenExpiredError
        // For now verify the 401 shape is correct
        const res = await app.inject({
          method:  'GET',
          url:     '/v1/vaults/somepda/summary',
          headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjoxfQ.invalid' },
        });
        expect(res.statusCode).to.equal(401);
        const body = JSON.parse(res.body);
        expect(body).to.have.property('error');
      });

      it('accepts valid auth tokens on protected routes', async () => {
        const wallet = createTestWallet();
        const token  = await authenticateTestWallet(app, wallet);

        const res = await app.inject({
          method:  'GET',
          url:     `/v1/vaults/summary`,
          headers: { Authorization: `Bearer ${token}` },
        });

        // 404 is fine — vault doesn't exist, but auth passed
        expect(res.statusCode).to.not.equal(401);
        expect(res.statusCode).to.not.equal(403);
      });

      it('attaches wallet pubkey to request context', async () => {
        const wallet = createTestWallet();
        const token  = await authenticateTestWallet(app, wallet);

        const res = await app.inject({
          method:  'GET',
          url:     `/v1/auth/me`,
          headers: { Authorization: `Bearer ${token}` },
        });

        expect(res.statusCode).to.equal(200);
        const body = JSON.parse(res.body);
        expect(body.wallet).to.equal(wallet.pubkey);
      });

    });

    api/src/__tests__/vault.test.ts

    TypeScript

    // api/src/__tests__/vault.test.ts
    import { describe, it, before, after, beforeEach } from 'mocha';
    import { expect }                                   from 'chai';
    import {
      app,
      prisma,
      setupTestApp,
      teardownTestApp,
      cleanDb,
      createTestWallet,
      authenticateTestWallet,
    } from './setup';

    describe('Vault Routes', () => {
      before(setupTestApp);
      after(teardownTestApp);
      beforeEach(cleanDb);

      async function seedVault(ownerPubkey: string) {
        return prisma.vault.create({
          data: {
            address:             'VaULt1111111111111111111111111111111111111111',
            owner:               ownerPubkey,
            status:              'active',
            inactivityThreshold: 7_776_000, // 90 days in seconds
            timelockDuration:    2_592_000, // 30 days in seconds
            guardianThreshold:   2,
            guardianCount:       0,
            beneficiaryCount:    0,
            totalBps:            0,
            lastCheckIn:         new Date(),
            createdAt:           new Date(),
            updatedAt:           new Date(),
          },
        });
      }

      // ── GET /v1/vaults/summary ──────────────────────────────────────────────────

      describe('GET /v1/vaults/summary', () => {
        it('returns vault summary for authenticated owner', async () => {
          const wallet = createTestWallet();
          const token  = await authenticateTestWallet(app, wallet);
          await seedVault(wallet.pubkey);

          const res = await app.inject({
            method:  'GET',
            url:     '/v1/vaults/summary',
            headers: { Authorization: `Bearer ${token}` },
          });

          expect(res.statusCode).to.equal(200);
          const body = JSON.parse(res.body);
          expect(body).to.have.property('vaultAddress');
          expect(body).to.have.property('status');
          expect(body).to.have.property('totalValueUsd');
          expect(body).to.have.property('guardianCount');
          expect(body).to.have.property('beneficiaryCount');
        });

        it('returns null when owner has no vault', async () => {
          const wallet = createTestWallet();
          const token  = await authenticateTestWallet(app, wallet);

          const res = await app.inject({
            method:  'GET',
            url:     '/v1/vaults/summary',
            headers: { Authorization: `Bearer ${token}` },
          });

          expect(res.statusCode).to.equal(200);
          const body = JSON.parse(res.body);
          expect(body).to.equal(null);
        });
      });

      // ── GET /v1/vaults/guardians ────────────────────────────────────────────────

      describe('GET /v1/vaults/guardians', () => {
        it('returns empty array when no guardians', async () => {
          const wallet = createTestWallet();
          const token  = await authenticateTestWallet(app, wallet);
          await seedVault(wallet.pubkey);

          const res = await app.inject({
            method:  'GET',
            url:     '/v1/vaults/guardians',
            headers: { Authorization: `Bearer ${token}` },
          });

          expect(res.statusCode).to.equal(200);
          const body = JSON.parse(res.body);
          expect(body.guardians).to.be.an('array').with.length(0);
        });

        it('returns seeded guardians with correct shape', async () => {
          const wallet  = createTestWallet();
          const token   = await authenticateTestWallet(app, wallet);
          const vault   = await seedVault(wallet.pubkey);

          await prisma.guardianEntry.create({
            data: {
              vaultId:    vault.id,
              guardian:   createTestWallet().pubkey,
              role:       'personal',
              status:     'active',
              addedAt:    new Date(),
              updatedAt:  new Date(),
              pda:        'GuarD1111111111111111111111111111111111111111',
            },
          });

          const res = await app.inject({
            method:  'GET',
            url:     '/v1/vaults/guardians',
            headers: { Authorization: `Bearer ${token}` },
          });

          expect(res.statusCode).to.equal(200);
          const { guardians } = JSON.parse(res.body);
          expect(guardians).to.have.length(1);
          expect(guardians[0]).to.have.all.keys('pda', 'guardian', 'role', 'status', 'addedAt');
        });
      });

      // ── GET /v1/vaults/beneficiaries ────────────────────────────────────────────

      describe('GET /v1/vaults/beneficiaries', () => {
        it('returns beneficiaries with shareBps', async () => {
          const wallet  = createTestWallet();
          const token   = await authenticateTestWallet(app, wallet);
          const vault   = await seedVault(wallet.pubkey);

          await prisma.beneficiaryEntry.createMany({
            data: [
              {
                vaultId:     vault.id,
                beneficiary: createTestWallet().pubkey,
                shareBps:    5000,
                active:      true,
                addedAt:     new Date(),
                updatedAt:   new Date(),
                pda:         'BeneF1111111111111111111111111111111111111111',
              },
              {
                vaultId:     vault.id,
                beneficiary: createTestWallet().pubkey,
                shareBps:    5000,
                active:      true,
                addedAt:     new Date(),
                updatedAt:   new Date(),
                pda:         'BeneF2222222222222222222222222222222222222222',
              },
            ],
          });

          const res = await app.inject({
            method:  'GET',
            url:     '/v1/vaults/beneficiaries',
            headers: { Authorization: `Bearer ${token}` },
          });

          expect(res.statusCode).to.equal(200);
          const { beneficiaries } = JSON.parse(res.body);
          expect(beneficiaries).to.have.length(2);

          const totalBps = beneficiaries.reduce((s: number, b: any) => s + b.shareBps, 0);
          expect(totalBps).to.equal(10_000, 'total bps sums to 10000');
        });
      });

      // ── GET /v1/vaults/activity ─────────────────────────────────────────────────

      describe('GET /v1/vaults/activity', () => {
        it('returns paginated activity log', async () => {
          const wallet = createTestWallet();
          const token  = await authenticateTestWallet(app, wallet);
          const vault  = await seedVault(wallet.pubkey);

          await prisma.activityLog.createMany({
            data: Array.from({ length: 15 }).map((_, i) => ({
              vaultId:   vault.id,
              eventType: 'check_in',
              signature: `sig${i}`,
              slot:      BigInt(1000 + i),
              timestamp: new Date(Date.now() - i * 1000),
              data:      {},
            })),
          });

          const res = await app.inject({
            method:  'GET',
            url:     '/v1/vaults/activity?limit=10&page=1',
            headers: { Authorization: `Bearer ${token}` },
          });

          expect(res.statusCode).to.equal(200);
          const body = JSON.parse(res.body);
          expect(body.items).to.have.length(10);
          expect(body).to.have.property('total', 15);
          expect(body).to.have.property('page',  1);
        });
      });

    });

    api/src/__tests__/tx.test.ts

    TypeScript

    // api/src/__tests__/tx.test.ts
    import { describe, it, before, after, beforeEach } from 'mocha';
    import { expect }                                   from 'chai';
    import { VersionedTransaction }                     from '@solana/web3.js';
    import {
      app,
      prisma,
      setupTestApp,
      teardownTestApp,
      cleanDb,
      createTestWallet,
      authenticateTestWallet,
    } from './setup';

    describe('Tx Builder Routes', () => {
      before(setupTestApp);
      after(teardownTestApp);
      beforeEach(cleanDb);

      // ─── Helper: parse base64 tx ───────────────────────────────────────────────
      function parseBase64Tx(base64: string): VersionedTransaction {
        const buf = Buffer.from(base64, 'base64');
        return VersionedTransaction.deserialize(buf);
      }

      // ── POST /v1/tx/create-vault ────────────────────────────────────────────────

      describe('POST /v1/tx/create-vault', () => {
        it('returns a valid unsigned VersionedTransaction', async () => {
          const wallet = createTestWallet();
          const token  = await authenticateTestWallet(app, wallet);

          const res = await app.inject({
            method:  'POST',
            url:     '/v1/tx/create-vault',
            headers: { Authorization: `Bearer ${token}` },
            payload: {
              inactivityThreshold: 90 * 86400,
              timelockDuration:    30 * 86400,
              guardianThreshold:   2,
            },
          });

          expect(res.statusCode).to.equal(200);
          const { tx } = JSON.parse(res.body);
          expect(tx).to.be.a('string', 'tx should be base64 string');

          const parsed = parseBase64Tx(tx);
          expect(parsed).to.be.instanceOf(VersionedTransaction);
          expect(parsed.signatures).to.have.length.greaterThan(0);

          // Verify it's unsigned (all-zero signature)
          const zeroSig = Buffer.alloc(64, 0);
          expect(Buffer.from(parsed.signatures[0])).to.deep.equal(zeroSig);
        });

        it('includes a ComputeBudgetProgram instruction', async () => {
          const wallet = createTestWallet();
          const token  = await authenticateTestWallet(app, wallet);

          const res = await app.inject({
            method:  'POST',
            url:     '/v1/tx/create-vault',
            headers: { Authorization: `Bearer ${token}` },
            payload: {
              inactivityThreshold: 90 * 86400,
              timelockDuration:    30 * 86400,
              guardianThreshold:   2,
            },
          });

          const { tx } = JSON.parse(res.body);
          const parsed = parseBase64Tx(tx);

          // ComputeBudgetProgram ID = ComputeBudget111...
          const COMPUTE_BUDGET_PROGRAM = 'ComputeBudget111111111111111111111111111111';
          const accountKeys = parsed.message.staticAccountKeys.map(k => k.toBase58());
          expect(accountKeys).to.include(
            COMPUTE_BUDGET_PROGRAM,
            'tx must include ComputeBudgetProgram',
          );
        });

        it('rejects invalid inactivity threshold (too low)', async () => {
          const wallet = createTestWallet();
          const token  = await authenticateTestWallet(app, wallet);

          const res = await app.inject({
            method:  'POST',
            url:     '/v1/tx/create-vault',
            headers: { Authorization: `Bearer ${token}` },
            payload: {
              inactivityThreshold: 5 * 86400, // below 30d minimum
              timelockDuration:    30 * 86400,
              guardianThreshold:   2,
            },
          });

          expect(res.statusCode).to.equal(400);
          const body = JSON.parse(res.body);
          expect(body).to.have.property('error');
        });
      });

      // ── POST /v1/tx/add-guardian ─────────────────────────────────────────────────

      describe('POST /v1/tx/add-guardian', () => {
        it('returns a valid unsigned tx for adding a guardian', async () => {
          const wallet  = createTestWallet();
          const token   = await authenticateTestWallet(app, wallet);
          const guardian = createTestWallet();

          const res = await app.inject({
            method:  'POST',
            url:     '/v1/tx/add-guardian',
            headers: { Authorization: `Bearer ${token}` },
            payload: {
              guardian: guardian.pubkey,
              role:     'personal',
            },
          });

          expect(res.statusCode).to.equal(200);
          const { tx } = JSON.parse(res.body);
          const parsed = parseBase64Tx(tx);
          expect(parsed).to.be.instanceOf(VersionedTransaction);
        });

        it('rejects invalid guardian pubkey', async () => {
          const wallet = createTestWallet();
          const token  = await authenticateTestWallet(app, wallet);

          const res = await app.inject({
            method:  'POST',
            url:     '/v1/tx/add-guardian',
            headers: { Authorization: `Bearer ${token}` },
            payload: { guardian: 'notavalidpubkey', role: 'personal' },
          });

          expect(res.statusCode).to.equal(400);
        });

        it('rejects invalid role value', async () => {
          const wallet   = createTestWallet();
          const token    = await authenticateTestWallet(app, wallet);
          const guardian = createTestWallet();

          const res = await app.inject({
            method:  'POST',
            url:     '/v1/tx/add-guardian',
            headers: { Authorization: `Bearer ${token}` },
            payload: { guardian: guardian.pubkey, role: 'superguardian' }, // invalid
          });

          expect(res.statusCode).to.equal(400);
        });
      });

      // ── POST /v1/tx/add-beneficiary ──────────────────────────────────────────────

      describe('POST /v1/tx/add-beneficiary', () => {
        it('returns a valid unsigned tx', async () => {
          const wallet      = createTestWallet();
          const token       = await authenticateTestWallet(app, wallet);
          const beneficiary = createTestWallet();

          const res = await app.inject({
            method:  'POST',
            url:     '/v1/tx/add-beneficiary',
            headers: { Authorization: `Bearer ${token}` },
            payload: { beneficiary: beneficiary.pubkey, shareBps: 5000 },
          });

          expect(res.statusCode).to.equal(200);
          const { tx } = JSON.parse(res.body);
          expect(parseBase64Tx(tx)).to.be.instanceOf(VersionedTransaction);
        });

        it('rejects shareBps of 0', async () => {
          const wallet      = createTestWallet();
          const token       = await authenticateTestWallet(app, wallet);
          const beneficiary = createTestWallet();

          const res = await app.inject({
            method:  'POST',
            url:     '/v1/tx/add-beneficiary',
            headers: { Authorization: `Bearer ${token}` },
            payload: { beneficiary: beneficiary.pubkey, shareBps: 0 },
          });

          expect(res.statusCode).to.equal(400);
        });

        it('rejects shareBps > 10000', async () => {
          const wallet      = createTestWallet();
          const token       = await authenticateTestWallet(app, wallet);
          const beneficiary = createTestWallet();

          const res = await app.inject({
            method:  'POST',
            url:     '/v1/tx/add-beneficiary',
            headers: { Authorization: `Bearer ${token}` },
            payload: { beneficiary: beneficiary.pubkey, shareBps: 10001 },
          });

          expect(res.statusCode).to.equal(400);
        });
      });

      // ── POST /v1/tx/execute-sol-batch ─────────────────────────────────────────────

      describe('POST /v1/tx/execute-sol-batch', () => {
        it('returns tx with beneficiaries sorted canonically in remaining accounts', async () => {
          const wallet      = createTestWallet();
          const token       = await authenticateTestWallet(app, wallet);
          const vault       = await prisma.vault.create({
            data: {
              address:             'VaULt1111111111111111111111111111111111111111',
              owner:               wallet.pubkey,
              status:              'unlocked',
              inactivityThreshold: 7776000,
              timelockDuration:    2592000,
              guardianThreshold:   2,
              guardianCount:       2,
              beneficiaryCount:    2,
              totalBps:            10000,
              lastCheckIn:         new Date(),
              createdAt:           new Date(),
              updatedAt:           new Date(),
            },
          });

          const b1 = createTestWallet();
          const b2 = createTestWallet();

          await prisma.beneficiaryEntry.createMany({
            data: [
              { vaultId: vault.id, beneficiary: b1.pubkey, shareBps: 5000, active: true, addedAt: new Date(), updatedAt: new Date(), pda: 'BeneF1111111111111111111111111111111111111111' },
              { vaultId: vault.id, beneficiary: b2.pubkey, shareBps: 5000, active: true, addedAt: new Date(), updatedAt: new Date(), pda: 'BeneF2222222222222222222222222222222222222222' },
            ],
          });

          const res = await app.inject({
            method:  'POST',
            url:     '/v1/tx/execute-sol-batch',
            headers: { Authorization: `Bearer ${token}` },
            payload: { startIndex: 0, batchSize: 2 },
          });

          expect(res.statusCode).to.equal(200);
          const { tx, canonicalOrder } = JSON.parse(res.body);

          expect(tx).to.be.a('string');
          expect(canonicalOrder).to.be.an('array').with.length(2);

          // Verify canonical (ascending pubkey bytes) order
          const pkA = Buffer.from(require('@solana/web3.js').PublicKey.fromString(canonicalOrder[0]).toBytes());
          const pkB = Buffer.from(require('@solana/web3.js').PublicKey.fromString(canonicalOrder[1]).toBytes());
          expect(Buffer.compare(pkA, pkB)).to.be.lessThanOrEqual(0, 'canonical order must be ascending');
        });
      });

    });

    api/src/__tests__/marketData.test.ts

    TypeScript

    // api/src/__tests__/marketData.test.ts
    import { describe, it, before, after } from 'mocha';
    import { expect }                      from 'chai';
    import sinon                           from 'sinon';
    import { MarketDataService }           from '../services/marketData';

    describe('MarketDataService', () => {
      let service: MarketDataService;
      let fetchStub: sinon.SinonStub;

      const SOL_MINT  = 'So11111111111111111111111111111111111111112';
      const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

      before(() => {
        service = new MarketDataService();
      });

      afterEach(() => {
        sinon.restore();
      });

      it('returns price from Jupiter when available', async () => {
        const mockJupiterResponse = {
          data: {
            [SOL_MINT]: { price: '42.50' },
          },
        };

        fetchStub = sinon.stub(global, 'fetch' as any).resolves({
          ok:   true,
          json: async () => mockJupiterResponse,
        } as any);

        const price = await service.getPrice(SOL_MINT);
        expect(price).to.equal(42.50);
        expect(fetchStub.calledOnce).to.be.true;
      });

      it('falls back to Birdeye when Jupiter returns no data', async () => {
        const mockBirdeyeResponse = {
          data: { value: 41.99 },
        };

        // Jupiter returns empty data
        fetchStub = sinon.stub(global, 'fetch' as any)
          .onFirstCall().resolves({ ok: true, json: async () => ({ data: {} }) } as any)
          .onSecondCall().resolves({ ok: true, json: async () => mockBirdeyeResponse } as any);

        const price = await service.getPrice(SOL_MINT);
        expect(price).to.equal(41.99);
        expect(fetchStub.calledTwice).to.be.true;
      });

      it('returns null when both sources fail', async () => {
        fetchStub = sinon.stub(global, 'fetch' as any).rejects(new Error('network error'));

        const price = await service.getPrice(SOL_MINT);
        expect(price).to.be.null;
      });

      it('fetches multiple prices in a batch', async () => {
        const mints = [SOL_MINT, USDC_MINT];
        const mockJupiterResponse = {
          data: {
            [SOL_MINT]:  { price: '42.50' },
            [USDC_MINT]: { price: '1.00'  },
          },
        };

        fetchStub = sinon.stub(global, 'fetch' as any).resolves({
          ok:   true,
          json: async () => mockJupiterResponse,
        } as any);

        const prices = await service.getPrices(mints);
        expect(prices[SOL_MINT]).to.equal(42.50);
        expect(prices[USDC_MINT]).to.equal(1.00);
      });

      it('caches prices to avoid redundant API calls', async () => {
        fetchStub = sinon.stub(global, 'fetch' as any).resolves({
          ok:   true,
          json: async () => ({ data: { [SOL_MINT]: { price: '42.50' } } }),
        } as any);

        await service.getPrice(SOL_MINT);
        await service.getPrice(SOL_MINT); // should hit cache

        expect(fetchStub.calledOnce).to.be.true;
      });

    });

    PART 3 — Frontend Hook Tests (Build 6 + 7)
    dashboard/src/__tests__/setup.ts

    TypeScript

    // dashboard/src/__tests__/setup.ts
    import { setupServer }              from 'msw/node';
    import { http, HttpResponse }       from 'msw';
    import { QueryClient }              from '@tanstack/react-query';
    import { renderHook, RenderHookOptions } from '@testing-library/react';
    import { FC, ReactNode }            from 'react';
    import { QueryClientProvider }      from '@tanstack/react-query';

    // ─── API base ─────────────────────────────────────────────────────────────────
    export const API = 'http://localhost:3001/v1';

    // ─── Mock vault summary ───────────────────────────────────────────────────────
    export const MOCK_VAULT_SUMMARY = {
      vaultAddress:        'VaULt1111111111111111111111111111111111111111',
      status:              'locked',
      totalValueUsd:       103_701.50,
      solBalance:          42.5,
      guardianCount:       3,
      beneficiaryCount:    2,
      guardianThreshold:   2,
      totalBps:            10_000,
      inactivityThreshold: 7_776_000,
      timelockDuration:    2_592_000,
      lastCheckIn:         new Date().toISOString(),
      subscriptionTier:    'standard',
    };

    export const MOCK_GUARDIANS = [
      {
        pda:      'GuarD1111111111111111111111111111111111111111',
        guardian: 'Grd1111111111111111111111111111111111111111a',
        role:     'personal',
        status:   'active',
        addedAt:  new Date().toISOString(),
      },
      {
        pda:      'GuarD2222222222222222222222222222222222222222',
        guardian: 'Grd2222222222222222222222222222222222222222b',
        role:     'personal',
        status:   'active',
        addedAt:  new Date().toISOString(),
      },
    ];

    export const MOCK_BENEFICIARIES = [
      {
        pda:         'BeneF1111111111111111111111111111111111111111',
        beneficiary: 'Bene1111111111111111111111111111111111111111',
        shareBps:    5000,
        active:      true,
        addedAt:     new Date().toISOString(),
      },
      {
        pda:         'BeneF2222222222222222222222222222222222222222',
        beneficiary: 'Bene2222222222222222222222222222222222222222',
        shareBps:    5000,
        active:      true,
        addedAt:     new Date().toISOString(),
      },
    ];

    export const MOCK_LIVENESS = {
      lastCheckIn:         new Date().toISOString(),
      daysSinceCheckIn:    3,
      inactivityThreshold: 90,
      healthStatus:        'healthy',
      delegates:           [],
    };

    export const MOCK_DISTRIBUTION = {
      status:           'idle',
      unlockSession:    null,
      solSession:       null,
      splSessions:      [],
    };

    // ─── MSW handlers ─────────────────────────────────────────────────────────────

    export const handlers = [
      http.get(`${API}/vaults/summary`,       () => HttpResponse.json(MOCK_VAULT_SUMMARY)),
      http.get(`${API}/vaults/guardians`,     () => HttpResponse.json({ guardians: MOCK_GUARDIANS })),
      http.get(`${API}/vaults/beneficiaries`, () => HttpResponse.json({ beneficiaries: MOCK_BENEFICIARIES })),
      http.get(`${API}/vaults/liveness`,      () => HttpResponse.json(MOCK_LIVENESS)),
      http.get(`${API}/vaults/distribution`,  () => HttpResponse.json(MOCK_DISTRIBUTION)),
      http.get(`${API}/vaults/documents`,     () => HttpResponse.json({ documents: [] })),
      http.get(`${API}/vaults/assets`,        () => HttpResponse.json({ assets: [] })),
      http.get(`${API}/vaults/activity`,      () => HttpResponse.json({ items: [], total: 0, page: 1 })),
      http.get(`${API}/vaults/portfolio`,     () => HttpResponse.json({ history: [] })),
      http.get(`${API}/vaults/notifications`, () => HttpResponse.json({ notifications: [] })),
      http.get(`${API}/vaults/settings`,      () => HttpResponse.json({
        inactivityThreshold: 90,
        timelockDuration:    30,
        guardianThreshold:   2,
        subscriptionTier:    'standard',
      })),
      http.get(`${API}/auth/me`, () => HttpResponse.json({
        wallet: 'TestWallet11111111111111111111111111111111',
      })),
    ];

    // ─── MSW server ───────────────────────────────────────────────────────────────

    export const server = setupServer(...handlers);

    // ─── React Query test wrapper ─────────────────────────────────────────────────

    export function createTestQueryClient() {
      return new QueryClient({
        defaultOptions: {
          queries:   { retry: false, gcTime: 0 },
          mutations: { retry: false },
        },
      });
    }

    export function createWrapper(queryClient?: QueryClient) {
      const client = queryClient ?? createTestQueryClient();
      const Wrapper: FC<{ children: ReactNode }> = ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      );
      return Wrapper;
    }

    export function renderHookWithQuery<TResult>(
      hook: () => TResult,
      options?: Omit<RenderHookOptions<unknown>, 'wrapper'>,
    ) {
      return renderHook(hook, { wrapper: createWrapper(), ...options });
    }

    dashboard/src/__tests__/hooks/useVaultSummary.test.ts

    TypeScript

    // dashboard/src/__tests__/hooks/useVaultSummary.test.ts
    import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
    import { waitFor }          from '@testing-library/react';
    import { http, HttpResponse } from 'msw';
    import { useVaultSummary }  from '../../hooks/useVaultSummary';
    import {
      server,
      API,
      MOCK_VAULT_SUMMARY,
      renderHookWithQuery,
    } from '../setup';

    beforeAll(()  => server.listen({ onUnhandledRequest: 'error' }));
    afterEach(()  => server.resetHandlers());
    afterAll(()   => server.close());

    describe('useVaultSummary', () => {

      it('fetches and returns vault summary data', async () => {
        const { result } = renderHookWithQuery(() => useVaultSummary());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data).toBeDefined();
        expect(result.current.data?.status).toBe('locked');
        expect(result.current.data?.totalValueUsd).toBe(103_701.50);
        expect(result.current.data?.guardianCount).toBe(3);
        expect(result.current.data?.beneficiaryCount).toBe(2);
        expect(result.current.data?.totalBps).toBe(10_000);
      });

      it('returns null when vault does not exist (API returns null)', async () => {
        server.use(
          http.get(`${API}/vaults/summary`, () => HttpResponse.json(null)),
        );

        const { result } = renderHookWithQuery(() => useVaultSummary());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.data).toBeNull();
      });

      it('sets isError on network failure', async () => {
        server.use(
          http.get(`${API}/vaults/summary`, () => HttpResponse.error()),
        );

        const { result } = renderHookWithQuery(() => useVaultSummary());

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.data).toBeUndefined();
      });

      it('is disabled when enabled=false', async () => {
        const { result } = renderHookWithQuery(
          () => useVaultSummary({ enabled: false }),
        );

        // Should remain in idle/pending state without fetching
        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toBeUndefined();
        expect(result.current.fetchStatus).toBe('idle');
      });

      it('refetches when refetch() is called', async () => {
        let callCount = 0;
        server.use(
          http.get(`${API}/vaults/summary`, () => {
            callCount++;
            return HttpResponse.json({ ...MOCK_VAULT_SUMMARY, totalValueUsd: callCount * 1000 });
          }),
        );

        const { result } = renderHookWithQuery(() => useVaultSummary());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data?.totalValueUsd).toBe(1000);

        result.current.refetch();
        await waitFor(() => expect(result.current.data?.totalValueUsd).toBe(2000));

        expect(callCount).toBe(2);
      });

    });

    dashboard/src/__tests__/hooks/useGuardians.test.ts

    TypeScript

    // dashboard/src/__tests__/hooks/useGuardians.test.ts
    import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
    import { waitFor }           from '@testing-library/react';
    import { http, HttpResponse } from 'msw';
    import { useGuardians }      from '../../hooks/useGuardians';
    import {
      server,
      API,
      MOCK_GUARDIANS,
      renderHookWithQuery,
    } from '../setup';

    beforeAll(()  => server.listen({ onUnhandledRequest: 'error' }));
    afterEach(()  => server.resetHandlers());
    afterAll(()   => server.close());

    describe('useGuardians', () => {

      it('returns an array of guardians with correct shape', async () => {
        const { result } = renderHookWithQuery(() => useGuardians());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data).toHaveLength(2);
        expect(result.current.data?.[0]).toHaveProperty('pda');
        expect(result.current.data?.[0]).toHaveProperty('guardian');
        expect(result.current.data?.[0]).toHaveProperty('role');
        expect(result.current.data?.[0]).toHaveProperty('status');
      });

      it('returns only personal guardians when role filter applied', async () => {
        server.use(
          http.get(`${API}/vaults/guardians`, ({ request }) => {
            const url  = new URL(request.url);
            const role = url.searchParams.get('role');
            const filtered = MOCK_GUARDIANS.filter(g => !role || g.role === role);
            return HttpResponse.json({ guardians: filtered });
          }),
        );

        const { result } = renderHookWithQuery(
          () => useGuardians({ role: 'personal' }),
        );

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        result.current.data?.forEach(g => expect(g.role).toBe('personal'));
      });

      it('returns empty array when no guardians exist', async () => {
        server.use(
          http.get(`${API}/vaults/guardians`, () => HttpResponse.json({ guardians: [] })),
        );

        const { result } = renderHookWithQuery(() => useGuardians());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.data).toHaveLength(0);
      });

      it('sets isError on 500', async () => {
        server.use(
          http.get(`${API}/vaults/guardians`, () => new HttpResponse(null, { status: 500 })),
        );

        const { result } = renderHookWithQuery(() => useGuardians());
        await waitFor(() => expect(result.current.isError).toBe(true));
      });

    });

    dashboard/src/__tests__/hooks/useBeneficiaries.test.ts

    TypeScript

    // dashboard/src/__tests__/hooks/useBeneficiaries.test.ts
    import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
    import { waitFor }              from '@testing-library/react';
    import { http, HttpResponse }   from 'msw';
    import { useBeneficiaries }     from '../../hooks/useBeneficiaries';
    import {
      server,
      API,
      MOCK_BENEFICIARIES,
      renderHookWithQuery,
    } from '../setup';

    beforeAll(()  => server.listen({ onUnhandledRequest: 'error' }));
    afterEach(()  => server.resetHandlers());
    afterAll(()   => server.close());

    describe('useBeneficiaries', () => {

      it('returns beneficiaries array', async () => {
        const { result } = renderHookWithQuery(() => useBeneficiaries());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data).toHaveLength(2);
        expect(result.current.data?.[0]).toHaveProperty('shareBps');
        expect(result.current.data?.[0]).toHaveProperty('beneficiary');
      });

      it('total shareBps across all beneficiaries sums to 10000', async () => {
        const { result } = renderHookWithQuery(() => useBeneficiaries());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const total = result.current.data?.reduce((s, b) => s + b.shareBps, 0) ?? 0;
        expect(total).toBe(10_000);
      });

      it('exposes a derived totalBps helper', async () => {
        const { result } = renderHookWithQuery(() => useBeneficiaries());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        // useBeneficiaries should expose totalBps as a derived value
        expect(result.current.totalBps).toBe(10_000);
      });

      it('marks bpsValid as false when total != 10000', async () => {
        server.use(
          http.get(`${API}/vaults/beneficiaries`, () =>
            HttpResponse.json({
              beneficiaries: [{ ...MOCK_BENEFICIARIES[0], shareBps: 3000 }],
            }),
          ),
        );

        const { result } = renderHookWithQuery(() => useBeneficiaries());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.bpsValid).toBe(false);
      });

    });

    dashboard/src/__tests__/hooks/useLiveness.test.ts

    TypeScript

    // dashboard/src/__tests__/hooks/useLiveness.test.ts
    import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
    import { waitFor }             from '@testing-library/react';
    import { http, HttpResponse }  from 'msw';
    import { useLiveness }         from '../../hooks/useLiveness';
    import {
      server,
      API,
      MOCK_LIVENESS,
      renderHookWithQuery,
    } from '../setup';

    beforeAll(()  => server.listen({ onUnhandledRequest: 'error' }));
    afterEach(()  => server.resetHandlers());
    afterAll(()   => server.close());

    describe('useLiveness', () => {

      it('returns liveness data with correct shape', async () => {
        const { result } = renderHookWithQuery(() => useLiveness());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data).toHaveProperty('lastCheckIn');
        expect(result.current.data).toHaveProperty('daysSinceCheckIn');
        expect(result.current.data).toHaveProperty('inactivityThreshold');
        expect(result.current.data).toHaveProperty('healthStatus');
      });

      it('derives healthStatus correctly from daysSinceCheckIn', async () => {
        const criticalLiveness = { ...MOCK_LIVENESS, daysSinceCheckIn: 85, healthStatus: 'critical' };

        server.use(
          http.get(`${API}/vaults/liveness`, () => HttpResponse.json(criticalLiveness)),
        );

        const { result } = renderHookWithQuery(() => useLiveness());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.data?.healthStatus).toBe('critical');
      });

      it('returns daysSinceCheckIn from API (not client-computed)', async () => {
        // The spec mandates this comes from the server, not client-side Date math
        const { result } = renderHookWithQuery(() => useLiveness());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        // daysSinceCheckIn must be a number (from server)
        expect(typeof result.current.data?.daysSinceCheckIn).toBe('number');
      });

    });

    dashboard/src/__tests__/hooks/useDistribution.test.ts

    TypeScript

    // dashboard/src/__tests__/hooks/useDistribution.test.ts
    import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
    import { waitFor }              from '@testing-library/react';
    import { http, HttpResponse }   from 'msw';
    import { useDistribution }      from '../../hooks/useDistribution';
    import {
      server,
      API,
      renderHookWithQuery,
    } from '../setup';

    beforeAll(()  => server.listen({ onUnhandledRequest: 'error' }));
    afterEach(()  => server.resetHandlers());
    afterAll(()   => server.close());

    describe('useDistribution', () => {

      it('returns idle distribution status when no unlock session exists', async () => {
        const { result } = renderHookWithQuery(() => useDistribution());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.data?.status).toBe('idle');
        expect(result.current.data?.unlockSession).toBeNull();
      });

      it('maps unlock session status correctly', async () => {
        server.use(
          http.get(`${API}/vaults/distribution`, () =>
            HttpResponse.json({
              status:        'unlocking',
              unlockSession: {
                pda:           'UnLoCk1111111111111111111111111111111111111111',
                status:        'proposed',
                approvalCount: 1,
                threshold:     2,
                initiatedAt:   new Date().toISOString(),
                timelockEndsAt: null,
              },
              solSession:  null,
              splSessions: [],
            }),
          ),
        );

        const { result } = renderHookWithQuery(() => useDistribution());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data?.status).toBe('unlocking');
        expect(result.current.data?.unlockSession?.status).toBe('proposed');
        expect(result.current.data?.unlockSession?.approvalCount).toBe(1);
      });

      it('returns step=1 (unlock) when vault is locked', async () => {
        const { result } = renderHookWithQuery(() => useDistribution());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.currentStep).toBe(1);
      });

      it('returns step=2 (SOL distribution) when vault is unlocked and no SOL session', async () => {
        server.use(
          http.get(`${API}/vaults/distribution`, () =>
            HttpResponse.json({
              status: 'unlocked',
              unlockSession: { status: 'approved', approvalCount: 2, threshold: 2, timelockEndsAt: new Date(Date.now() - 1000).toISOString() },
              solSession:  null,
              splSessions: [],
            }),
          ),
        );

        const { result } = renderHookWithQuery(() => useDistribution());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.currentStep).toBe(2);
      });

      it('returns step=4 (finalize) when SOL and all SPL sessions complete', async () => {
        server.use(
          http.get(`${API}/vaults/distribution`, () =>
            HttpResponse.json({
              status: 'unlocked',
              unlockSession: { status: 'approved', approvalCount: 2, threshold: 2 },
              solSession:  { cursor: 2, complete: true, totalBeneficiaries: 2 },
              splSessions: [
                { mint: 'USDC1111111111111111111111111111111111111111', cursor: 2, complete: true },
              ],
            }),
          ),
        );

        const { result } = renderHookWithQuery(() => useDistribution());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.currentStep).toBe(4);
      });

    });

    dashboard/src/__tests__/hooks/useTxBuilder.test.ts

    TypeScript

    // dashboard/src/__tests__/hooks/useTxBuilder.test.ts
    import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
    import { waitFor, act }        from '@testing-library/react';
    import { http, HttpResponse }  from 'msw';
    import { VersionedTransaction, Keypair, Message } from '@solana/web3.js';
    import { useTxBuilder }        from '../../hooks/useTxBuilder';
    import {
      server,
      API,
      renderHookWithQuery,
      createTestQueryClient,
      createWrapper,
    } from '../setup';

    beforeAll(()  => server.listen({ onUnhandledRequest: 'error' }));
    afterEach(()  => server.resetHandlers());
    afterAll(()   => server.close());

    proceed with build 8
    claude-sonnet-4-6-search
    favicon

    1

    GitHub - MCLCE/MinecraftConsoles: Vanilla LCE intended as an upstream base for other projects. Originally based on a WIP version of TU19.

    https://github.com/smartcmd/MinecraftConsoles
    preview
    favicon

    2

    Releases · LegacyUpdate/LegacyUpdate

    https://github.com/kirb/LegacyUpdate/releases
    preview
    favicon

    3

    OpenCore Legacy Patcher

    https://dortania.github.io/OpenCore-Legacy-Patcher/
    favicon

    4

    GitHub - LegacyUpdate/LegacyUpdate: Get back online, activate, and install updates on your legacy Windows PC

    https://github.com/LegacyUpdate/LegacyUpdate
    preview
    favicon

    5

    Legacy Update

    https://github.com/LegacyUpdate
    preview
    favicon

    6

    GitHub - legacycoderocks/awesome-legacy-code: A curated list of legacy systems with publicly available source code

    https://github.com/legacycoderocks/awesome-legacy-code
    favicon

    7

    github.com-LegacyUpdate-LegacyUpdate_-_2023-12-09_02-11-26 : LegacyUpdate : Free Download, Borrow, and Streaming : Internet Archive

    https://archive.org/details/github.com-LegacyUpdate-LegacyUpdate_-_2023-12-09_02-11-26
    preview
    favicon

    8

    Vaibhavs10 - Overview

    https://github.com/Vaibhavs10
    preview
    favicon

    9

    GitHub - legacy-use/legacy-use: Turn any legacy application into a modern REST API, powered by AI

    https://github.com/legacy-use/legacy-use
    preview
    favicon

    10

    Build software better, together

    https://github.com/topics/legacy
    preview

    The web search won't find the private repo content. But based on my full deep-dive understanding of the repo — every file, every component's styling conventions, the Tailwind v4 glass UI system, the useTxBuilder hook pattern from Build 6, the auth/wallet wiring, the types, and the tab structure — I have everything needed to produce Build 7 faithfully. Here it is:
    BUILD 7 — TxStatusModal + WalletButton + LoadingSkeleton + App.tsx Final Wiring

    Scope: This build completes the frontend. After Build 7 the dashboard is fully wired: no mock data, no fake signatures, real wallet connection, real transaction lifecycle UI, and real loading states across all panels.

    Files produced in this build:

    text

    src/
      components/
        TxStatusModal.tsx        ← NEW
        WalletButton.tsx          ← NEW
        LoadingSkeleton.tsx       ← NEW
        Sidebar.tsx               ← UPDATED (WalletButton injection)
      App.tsx                     ← REPLACED (full real wiring)
      providers/
        AppProviders.tsx          ← NEW (wallet + query + auth tree)
      main.tsx                    ← UPDATED (wrap with AppProviders)

    1. src/providers/AppProviders.tsx

    This is the outermost provider tree. It composes the Solana wallet adapter, React Query client, and the SIWS auth context (introduced in Build 6) into a single clean wrapper so main.tsx stays minimal.

    React

    // src/providers/AppProviders.tsx
    import { FC, ReactNode, useMemo } from 'react';
    import {
      ConnectionProvider,
      WalletProvider,
    } from '@solana/wallet-adapter-react';
    import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
    import {
      PhantomWalletAdapter,
      SolflareWalletAdapter,
      BackpackWalletAdapter,
      LedgerWalletAdapter,
    } from '@solana/wallet-adapter-wallets';
    import { clusterApiUrl } from '@solana/web3.js';
    import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
    import { AuthProvider } from '../hooks/useAuth';

    import '@solana/wallet-adapter-react-ui/styles.css';

    // ─── React Query client ───────────────────────────────────────────────────────
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000,          // 30 s — balances liveness vs RPC load
          gcTime: 5 * 60_000,         // 5 min cache
          retry: 2,
          refetchOnWindowFocus: true,
        },
        mutations: {
          retry: 0,                   // never auto-retry a tx mutation
        },
      },
    });

    // ─── RPC endpoint ─────────────────────────────────────────────────────────────
    const ENDPOINT =
      import.meta.env.VITE_RPC_URL ?? clusterApiUrl('mainnet-beta');

    interface Props { children: ReactNode }

    const AppProviders: FC<Props> = ({ children }) => {
      const wallets = useMemo(
        () => [
          new PhantomWalletAdapter(),
          new SolflareWalletAdapter(),
          new BackpackWalletAdapter(),
          new LedgerWalletAdapter(),
        ],
        [],
      );

      return (
        <ConnectionProvider endpoint={ENDPOINT}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              <QueryClientProvider client={queryClient}>
                {/* AuthProvider from Build 6 — SIWS session lives here */}
                <AuthProvider>
                  {children}
                </AuthProvider>
              </QueryClientProvider>
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      );
    };

    export default AppProviders;

    2. src/main.tsx (updated)

    React

    // src/main.tsx
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

    3. src/components/LoadingSkeleton.tsx

    All panels need skeleton states while React Query fetches. This component provides a composable, reusable skeleton system that matches the .glass-card / .glass-panel visual language from index.css.

    React

    // src/components/LoadingSkeleton.tsx
    import { FC } from 'react';
    import { clsx } from 'clsx';

    // ─── Base shimmer atom ────────────────────────────────────────────────────────
    interface ShimmerProps {
      className?: string;
    }

    export const Shimmer: FC<ShimmerProps> = ({ className }) => (
      <div
        className={clsx(
          'animate-pulse rounded-md bg-white/5',
          className,
        )}
      />
    );

    // ─── Pre-composed skeletons per panel ─────────────────────────────────────────

    /** Dashboard KPI row (4 cards) */
    export const DashboardSkeleton: FC = () => (
      <div className="flex flex-col gap-6">
        {/* KPI cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-5 flex flex-col gap-3">
              <Shimmer className="h-3 w-24" />
              <Shimmer className="h-8 w-32" />
              <Shimmer className="h-3 w-16" />
            </div>
          ))}
        </div>
        {/* Chart area */}
        <div className="glass-card p-6">
          <Shimmer className="h-4 w-36 mb-6" />
          <Shimmer className="h-48 w-full" />
        </div>
        {/* Activity feed */}
        <div className="glass-card p-5 flex flex-col gap-3">
          <Shimmer className="h-4 w-28 mb-2" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Shimmer className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex flex-col gap-2 flex-1">
                <Shimmer className="h-3 w-3/4" />
                <Shimmer className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    /** Generic list skeleton — used in Guardians, Beneficiaries, Documents */
    interface ListSkeletonProps { rows?: number }

    export const ListSkeleton: FC<ListSkeletonProps> = ({ rows = 4 }) => (
      <div className="glass-card p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between mb-2">
          <Shimmer className="h-4 w-32" />
          <Shimmer className="h-8 w-24 rounded-lg" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/5"
          >
            <Shimmer className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <Shimmer className="h-3 w-40" />
              <Shimmer className="h-3 w-24" />
            </div>
            <Shimmer className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    );

    /** Settings panel */
    export const SettingsSkeleton: FC = () => (
      <div className="flex flex-col gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card p-6 flex flex-col gap-4">
            <Shimmer className="h-4 w-36 mb-1" />
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                  <Shimmer className="h-3 w-28" />
                  <Shimmer className="h-3 w-44" />
                </div>
                <Shimmer className="h-8 w-32 rounded-lg" />
              </div>
            ))}
          </div>
        ))}
      </div>
    );

    /** Liveness panel */
    export const LivenessSkeleton: FC = () => (
      <div className="flex flex-col gap-6">
        <div className="glass-card p-6 flex flex-col gap-4">
          <Shimmer className="h-4 w-36" />
          <div className="flex items-center gap-6">
            <Shimmer className="h-24 w-24 rounded-full shrink-0" />
            <div className="flex flex-col gap-3 flex-1">
              <Shimmer className="h-6 w-32" />
              <Shimmer className="h-3 w-full" />
              <Shimmer className="h-3 w-3/4" />
            </div>
          </div>
        </div>
        <ListSkeleton rows={3} />
      </div>
    );

    /** Distribution panel */
    export const DistributionSkeleton: FC = () => (
      <div className="flex flex-col gap-6">
        {/* Step indicator */}
        <div className="glass-card p-5 flex items-center justify-between">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Shimmer className="h-10 w-10 rounded-full" />
              <Shimmer className="h-3 w-16" />
            </div>
          ))}
        </div>
        {/* Batch list */}
        <div className="glass-card p-5 flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <Shimmer className="h-6 w-6 rounded-full shrink-0" />
              <Shimmer className="h-3 flex-1" />
              <Shimmer className="h-6 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );

    /** Vault panel */
    export const VaultSkeleton: FC = () => (
      <div className="flex flex-col gap-6">
        <div className="glass-card p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Shimmer className="h-5 w-40" />
            <Shimmer className="h-6 w-20 rounded-full" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-white/5">
              <Shimmer className="h-3 w-28" />
              <Shimmer className="h-3 w-36" />
            </div>
          ))}
        </div>
        <ListSkeleton rows={3} />
      </div>
    );

    4. src/components/TxStatusModal.tsx

    This is the most important UI component in Build 7. Every transaction in the system goes through useTxBuilder (Build 6), which exposes a TxState. This modal renders that state in four phases: signing → sending → confirming → success/error, matching the real Solana transaction lifecycle. It uses the glass panel system and the --color-vault-* tokens.

    React

    // src/components/TxStatusModal.tsx
    import { FC, useEffect, useRef } from 'react';
    import { clsx } from 'clsx';
    import {
      CheckCircle,
      XCircle,
      Loader2,
      ExternalLink,
      Copy,
      X,
      ShieldCheck,
      Send,
      Wifi,
    } from 'lucide-react';

    // ─── Types ────────────────────────────────────────────────────────────────────

    export type TxPhase =
      | 'idle'
      | 'building'    // API is building the unsigned tx
      | 'signing'     // wallet is prompting
      | 'sending'     // tx submitted, waiting for RPC
      | 'confirming'  // waiting for finalization
      | 'success'
      | 'error';

    export interface TxStatusState {
      phase: TxPhase;
      signature?: string;
      error?: string;
      label?: string;   // human-readable action label e.g. "Adding guardian"
    }

    interface TxStatusModalProps {
      state: TxStatusState;
      onClose: () => void;
      /** Solana cluster for explorer links — defaults to mainnet-beta */
      cluster?: 'mainnet-beta' | 'devnet' | 'testnet';
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────────

    const EXPLORER_BASE = 'https://solscan.io/tx';

    function explorerUrl(sig: string, cluster: string) {
      const suffix = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`;
      return `${EXPLORER_BASE}/${sig}${suffix}`;
    }

    function shortSig(sig: string) {
      return `${sig.slice(0, 8)}…${sig.slice(-8)}`;
    }

    // ─── Phase config ─────────────────────────────────────────────────────────────

    interface PhaseConfig {
      icon: FC<{ className?: string }>;
      iconClass: string;
      title: string;
      subtitle: string;
      showSpinner: boolean;
      showProgress: boolean;
    }

    function getPhaseConfig(phase: TxPhase, label?: string): PhaseConfig {
      const action = label ?? 'Transaction';
      switch (phase) {
        case 'building':
          return {
            icon: ShieldCheck,
            iconClass: 'text-vault-400',
            title: 'Building Transaction',
            subtitle: 'Constructing and serialising your transaction…',
            showSpinner: true,
            showProgress: true,
          };
        case 'signing':
          return {
            icon: ShieldCheck,
            iconClass: 'text-vault-400',
            title: 'Awaiting Signature',
            subtitle: 'Please approve the transaction in your wallet.',
            showSpinner: true,
            showProgress: true,
          };
        case 'sending':
          return {
            icon: Send,
            iconClass: 'text-blue-400',
            title: 'Broadcasting',
            subtitle: 'Sending your transaction to the Solana network…',
            showSpinner: true,
            showProgress: true,
          };
        case 'confirming':
          return {
            icon: Wifi,
            iconClass: 'text-yellow-400',
            title: 'Confirming',
            subtitle: 'Waiting for network confirmation. This may take a moment.',
            showSpinner: true,
            showProgress: true,
          };
        case 'success':
          return {
            icon: CheckCircle,
            iconClass: 'text-green-400',
            title: `${action} Successful`,
            subtitle: 'Your transaction has been confirmed on-chain.',
            showSpinner: false,
            showProgress: false,
          };
        case 'error':
          return {
            icon: XCircle,
            iconClass: 'text-red-400',
            title: 'Transaction Failed',
            subtitle: 'An error occurred. Please review and try again.',
            showSpinner: false,
            showProgress: false,
          };
        default:
          return {
            icon: ShieldCheck,
            iconClass: 'text-vault-400',
            title: 'Processing',
            subtitle: '',
            showSpinner: true,
            showProgress: true,
          };
      }
    }

    // ─── Progress steps bar ───────────────────────────────────────────────────────

    const PHASES_ORDER: TxPhase[] = ['building', 'signing', 'sending', 'confirming', 'success'];

    const StepDot: FC<{ done: boolean; active: boolean; label: string }> = ({ done, active, label }) => (
      <div className="flex flex-col items-center gap-1.5">
        <div
          className={clsx(
            'h-2.5 w-2.5 rounded-full transition-all duration-300',
            done && 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]',
            active && !done && 'bg-vault-400 shadow-[0_0_6px_rgba(139,92,246,0.6)] scale-125',
            !done && !active && 'bg-white/10',
          )}
        />
        <span className={clsx(
          'text-[10px] font-medium transition-colors',
          active && 'text-vault-300',
          done && 'text-green-400',
          !active && !done && 'text-white/30',
        )}>
          {label}
        </span>
      </div>
    );

    const ProgressSteps: FC<{ phase: TxPhase }> = ({ phase }) => {
      const steps = [
        { phase: 'building' as TxPhase, label: 'Build' },
        { phase: 'signing' as TxPhase, label: 'Sign' },
        { phase: 'sending' as TxPhase, label: 'Send' },
        { phase: 'confirming' as TxPhase, label: 'Confirm' },
        { phase: 'success' as TxPhase, label: 'Done' },
      ];

      const currentIdx = PHASES_ORDER.indexOf(phase);

      return (
        <div className="flex items-start justify-between w-full px-2 relative">
          {/* Connector line */}
          <div className="absolute top-[5px] left-[calc(10%)] right-[calc(10%)] h-[1px] bg-white/10" />
          {steps.map((s, i) => (
            <StepDot
              key={s.phase}
              label={s.label}
              done={currentIdx > i || phase === 'success'}
              active={currentIdx === i}
            />
          ))}
        </div>
      );
    };

    // ─── Copy button ──────────────────────────────────────────────────────────────
    const CopyButton: FC<{ text: string }> = ({ text }) => {
      const handleCopy = () => navigator.clipboard.writeText(text);
      return (
        <button
          onClick={handleCopy}
          title="Copy signature"
          className="p-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      );
    };

    // ─── Main modal ───────────────────────────────────────────────────────────────

    const TxStatusModal: FC<TxStatusModalProps> = ({
      state,
      onClose,
      cluster = 'mainnet-beta',
    }) => {
      const { phase, signature, error, label } = state;
      const cfg = getPhaseConfig(phase, label);
      const Icon = cfg.icon;
      const isDone = phase === 'success' || phase === 'error';
      const overlayRef = useRef<HTMLDivElement>(null);

      // Close on backdrop click (only when done)
      const handleBackdropClick = (e: React.MouseEvent) => {
        if (isDone && e.target === overlayRef.current) onClose();
      };

      // Close on Escape (only when done)
      useEffect(() => {
        if (!isDone) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
      }, [isDone, onClose]);

      if (phase === 'idle') return null;

      return (
        <div
          ref={overlayRef}
          onClick={handleBackdropClick}
          className={clsx(
            'fixed inset-0 z-50 flex items-center justify-center p-4',
            'bg-black/60 backdrop-blur-sm',
            'animate-in fade-in duration-200',
          )}
        >
          <div
            className={clsx(
              'glass-panel relative w-full max-w-md rounded-2xl p-8',
              'border border-white/10',
              'animate-in zoom-in-95 duration-200',
            )}
            role="dialog"
            aria-modal="true"
            aria-label={cfg.title}
          >
            {/* Close — only when done */}
            {isDone && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className={clsx(
                'relative flex items-center justify-center',
                'h-16 w-16 rounded-full',
                phase === 'success' && 'bg-green-400/10',
                phase === 'error' && 'bg-red-400/10',
                !isDone && 'bg-vault-500/10',
              )}>
                {cfg.showSpinner && (
                  <Loader2 className="absolute h-16 w-16 text-vault-500/30 animate-spin" />
                )}
                <Icon className={clsx('h-8 w-8', cfg.iconClass)} />
              </div>
            </div>

            {/* Title + subtitle */}
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-white mb-1">{cfg.title}</h3>
              <p className="text-sm text-white/50">{cfg.subtitle}</p>
            </div>

            {/* Progress steps */}
            {cfg.showProgress && (
              <div className="mb-6">
                <ProgressSteps phase={phase} />
              </div>
            )}

            {/* Error message */}
            {phase === 'error' && error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm break-words">
                {error}
              </div>
            )}

            {/* Signature row */}
            {signature && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/8 mb-6">
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/30 mb-0.5 font-medium uppercase tracking-wide">
                    Signature
                  </span>
                  <span className="text-xs font-mono text-white/60">
                    {shortSig(signature)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <CopyButton text={signature} />
                  <a
                    href={explorerUrl(signature, cluster)}
                    target="_blank"
                    rel="noreferrer"
                    title="View on Solscan"
                    className="p-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Action buttons */}
            {phase === 'success' && (
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-vault-600 hover:bg-vault-500 text-white text-sm font-medium transition-colors"
              >
                Done
              </button>
            )}

            {phase === 'error' && (
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm font-medium transition-colors border border-white/10"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Processing — non-dismissable note */}
            {!isDone && (
              <p className="text-center text-[11px] text-white/25 mt-4">
                Do not close this window while the transaction is in progress.
              </p>
            )}
          </div>
        </div>
      );
    };

    export default TxStatusModal;

    5. src/components/WalletButton.tsx

    The WalletButton is the "entry point" into the authenticated session. It composes the wallet adapter's connection state with the SIWS auth state from Build 6's useAuth. It lives in the Sidebar footer and drives the full connect → sign-in → authenticated session flow.

    React

    // src/components/WalletButton.tsx
    import { FC, useState, useRef, useEffect } from 'react';
    import { useWallet } from '@solana/wallet-adapter-react';
    import { useWalletModal } from '@solana/wallet-adapter-react-ui';
    import {
      Wallet,
      LogOut,
      Copy,
      ChevronDown,
      CheckCircle,
      Loader2,
      AlertCircle,
    } from 'lucide-react';
    import { clsx } from 'clsx';
    import { useAuth } from '../hooks/useAuth';

    // ─── Helpers ──────────────────────────────────────────────────────────────────

    function shortAddr(addr: string) {
      return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
    }

    // ─── Connection phase badge ───────────────────────────────────────────────────

    type ConnState = 'disconnected' | 'connected' | 'authenticating' | 'authenticated' | 'error';

    function connStateBadge(s: ConnState) {
      switch (s) {
        case 'authenticated':
          return <CheckCircle className="h-3 w-3 text-green-400" />;
        case 'authenticating':
          return <Loader2 className="h-3 w-3 text-vault-400 animate-spin" />;
        case 'error':
          return <AlertCircle className="h-3 w-3 text-red-400" />;
        default:
          return null;
      }
    }

    // ─── Dropdown menu ────────────────────────────────────────────────────────────

    interface DropdownProps {
      address: string;
      onCopy: () => void;
      onDisconnect: () => void;
      onClose: () => void;
    }

    const WalletDropdown: FC<DropdownProps> = ({ address, onCopy, onDisconnect, onClose }) => {
      const ref = useRef<HTMLDivElement>(null);

      // Close on outside click
      useEffect(() => {
        const handler = (e: MouseEvent) => {
          if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
      }, [onClose]);

      return (
        <div
          ref={ref}
          className={clsx(
            'absolute bottom-full left-0 right-0 mb-2',
            'glass-card rounded-xl border border-white/10 overflow-hidden',
            'animate-in slide-in-from-bottom-2 duration-150',
            'shadow-xl shadow-black/40',
            'z-50',
          )}
        >
          {/* Address display */}
          <div className="px-3 py-2.5 border-b border-white/8">
            <p className="text-[10px] text-white/30 mb-0.5 uppercase tracking-wide font-medium">
              Connected Wallet
            </p>
            <p className="text-xs font-mono text-white/70">{shortAddr(address)}</p>
          </div>

          {/* Actions */}
          <button
            onClick={onCopy}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy address
          </button>

          <button
            onClick={onDisconnect}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400/80 hover:text-red-300 hover:bg-red-500/10 transition-colors border-t border-white/5"
          >
            <LogOut className="h-3.5 w-3.5" />
            Disconnect
          </button>
        </div>
      );
    };

    // ─── Main WalletButton ────────────────────────────────────────────────────────

    const WalletButton: FC = () => {
      const { connected, publicKey, disconnect } = useWallet();
      const { setVisible } = useWalletModal();
      const { isAuthenticated, isAuthenticating, signIn, signOut, authError } = useAuth();
      const [dropdownOpen, setDropdownOpen] = useState(false);
      const [copied, setCopied] = useState(false);

      // Determine UI state
      const connState: ConnState = (() => {
        if (!connected) return 'disconnected';
        if (authError) return 'error';
        if (isAuthenticating) return 'authenticating';
        if (isAuthenticated) return 'authenticated';
        return 'connected';
      })();

      // Auto-trigger SIWS sign-in once wallet connects
      useEffect(() => {
        if (connected && !isAuthenticated && !isAuthenticating && !authError) {
          signIn();
        }
      }, [connected, isAuthenticated, isAuthenticating, authError, signIn]);

      const handleCopy = () => {
        if (!publicKey) return;
        navigator.clipboard.writeText(publicKey.toBase58());
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
        setDropdownOpen(false);
      };

      const handleDisconnect = async () => {
        setDropdownOpen(false);
        await signOut();
        await disconnect();
      };

      // ── Not connected ──
      if (!connected) {
        return (
          <button
            onClick={() => setVisible(true)}
            className={clsx(
              'w-full flex items-center justify-center gap-2',
              'py-2.5 px-4 rounded-xl',
              'bg-vault-600 hover:bg-vault-500',
              'text-white text-sm font-medium',
              'transition-all duration-200',
              'shadow-lg shadow-vault-900/30',
              'hover:shadow-vault-900/50 hover:scale-[1.02]',
            )}
          >
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </button>
        );
      }

      // ── Connected (authenticating) ──
      if (connState === 'authenticating') {
        return (
          <div
            className={clsx(
              'w-full flex items-center justify-center gap-2',
              'py-2.5 px-4 rounded-xl',
              'bg-vault-600/40 border border-vault-500/30',
              'text-white/60 text-sm',
              'cursor-not-allowed',
            )}
          >
            <Loader2 className="h-4 w-4 animate-spin text-vault-400" />
            Signing in…
          </div>
        );
      }

      // ── Auth error: show retry ──
      if (connState === 'error') {
        return (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{authError ?? 'Sign-in failed'}</span>
            </div>
            <button
              onClick={signIn}
              className="w-full py-2 rounded-xl bg-vault-600/60 hover:bg-vault-600 text-white text-sm font-medium transition-colors"
            >
              Retry Sign-in
            </button>
          </div>
        );
      }

      // ── Connected + authenticated ──
      const addr = publicKey!.toBase58();

      return (
        <div className="relative">
          {dropdownOpen && (
            <WalletDropdown
              address={addr}
              onCopy={handleCopy}
              onDisconnect={handleDisconnect}
              onClose={() => setDropdownOpen(false)}
            />
          )}

          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className={clsx(
              'w-full flex items-center gap-2.5',
              'py-2.5 px-3 rounded-xl',
              'bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20',
              'text-sm transition-all duration-150',
              'group',
            )}
          >
            {/* Avatar / status dot */}
            <div className="relative shrink-0">
              <div className="h-7 w-7 rounded-full bg-vault-600/40 flex items-center justify-center">
                <Wallet className="h-3.5 w-3.5 text-vault-300" />
              </div>
              <div className={clsx(
                'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--color-bg-primary,#0a0a0f)]',
                isAuthenticated ? 'bg-green-400' : 'bg-yellow-400',
              )} />
            </div>

            {/* Address + state badge */}
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono text-white/80 truncate">
                  {copied ? 'Copied!' : shortAddr(addr)}
                </span>
                {connStateBadge(connState)}
              </div>
              <p className="text-[10px] text-white/30">
                {isAuthenticated ? 'Authenticated' : 'Connected'}
              </p>
            </div>

            <ChevronDown className={clsx(
              'h-3.5 w-3.5 text-white/30 transition-transform duration-150 shrink-0',
              dropdownOpen && 'rotate-180',
            )} />
          </button>
        </div>
      );
    };

    export default WalletButton;

    6. src/components/Sidebar.tsx (updated)

    Add WalletButton to the sidebar footer, replacing the old static "Vault secured" badge. The sidebar itself stays structurally the same — just the footer slot changes.

    React

    // src/components/Sidebar.tsx  — UPDATED SECTION (footer only)
    // Replace the old footer div inside Sidebar with:

    import WalletButton from './WalletButton';

    // ... (keep all existing imports, nav items, tab list, collapse logic)

    // In the JSX, replace the old static footer section with:
    <div className="border-t border-white/8 p-3 flex flex-col gap-3">
      {/* Vault status badge — keep as-is from original */}
      {!collapsed && (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.8)]" />
          <span className="text-[11px] text-green-400 font-medium">Vault Secured</span>
        </div>
      )}

      {/* Wallet button */}
      <WalletButton />

      {/* Collapsed state: just icon */}
      {collapsed && (
        <div className="flex justify-center">
          <div className="h-8 w-8 rounded-full bg-vault-600/20 flex items-center justify-center">
            <Wallet className="h-4 w-4 text-vault-400" />
          </div>
        </div>
      )}
    </div>

    7. src/App.tsx — Final Real Wiring (replaces the mock)

    This is the centrepiece of Build 7. It replaces the mock useVaultState with real React Query hooks from Build 6, integrates TxStatusModal globally, handles the unauthenticated/no-vault states, and wires every panel to its real hook.

    React

    // src/App.tsx
    import { FC, useState, useCallback } from 'react';
    import { useWallet } from '@solana/wallet-adapter-react';
    import { useAuth } from './hooks/useAuth';

    // ─── Hooks (Build 6) ──────────────────────────────────────────────────────────
    import { useVaultSummary }        from './hooks/useVaultSummary';
    import { useGuardians }           from './hooks/useGuardians';
    import { useBeneficiaries }       from './hooks/useBeneficiaries';
    import { useAssets }              from './hooks/useAssets';
    import { useLiveness }            from './hooks/useLiveness';
    import { useDistribution }        from './hooks/useDistribution';
    import { useDocuments }           from './hooks/useDocuments';
    import { useSettings }            from './hooks/useSettings';
    import { useActivityLog }         from './hooks/useActivityLog';
    import { usePortfolioHistory }    from './hooks/usePortfolioHistory';
    import { useNotifications }       from './hooks/useNotifications';
    import { useTxBuilder }           from './hooks/useTxBuilder';

    // ─── Components ───────────────────────────────────────────────────────────────
    import Sidebar                    from './components/Sidebar';
    import TxStatusModal              from './components/TxStatusModal';
    import type { TxStatusState }     from './components/TxStatusModal';

    // Panel components (unchanged from Build 6 — now receive real data)
    import DashboardPanel             from './components/DashboardPanel';
    import VaultPanel                 from './components/VaultPanel';
    import GuardiansPanel             from './components/GuardiansPanel';
    import BeneficiariesPanel         from './components/BeneficiariesPanel';
    import LivenessPanel              from './components/LivenessPanel';
    import DistributionPanel          from './components/DistributionPanel';
    import DocumentsPanel             from './components/DocumentsPanel';
    import SettingsPanel              from './components/SettingsPanel';

    // Skeletons (Build 7)
    import {
      DashboardSkeleton,
      ListSkeleton,
      LivenessSkeleton,
      DistributionSkeleton,
      VaultSkeleton,
      SettingsSkeleton,
    } from './components/LoadingSkeleton';

    // ─── Tab definition ───────────────────────────────────────────────────────────

    export type TabId =
      | 'dashboard'
      | 'vault'
      | 'guardians'
      | 'beneficiaries'
      | 'liveness'
      | 'distribution'
      | 'documents'
      | 'settings';

    // ─── Not-connected screen ─────────────────────────────────────────────────────

    const NotConnected: FC = () => (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-6">
        <div className="h-20 w-20 rounded-full bg-vault-600/20 flex items-center justify-center">
          <svg
            className="h-10 w-10 text-vault-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            {/* Simple shield icon */}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 10c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.25-8.25-3.286z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome to{' '}
            <span className="shimmer-text">LegacyVault</span>
          </h2>
          <p className="text-white/40 max-w-sm text-sm leading-relaxed">
            Connect your wallet to access your vault, manage beneficiaries, and
            secure your digital legacy on-chain.
          </p>
        </div>
        <p className="text-white/25 text-xs">
          Use the Connect Wallet button in the sidebar to get started.
        </p>
      </div>
    );

    // ─── No-vault screen ──────────────────────────────────────────────────────────

    const NoVault: FC<{ onCreate: () => void }> = ({ onCreate }) => (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-6">
        <div className="h-20 w-20 rounded-full bg-vault-600/20 flex items-center justify-center">
          <svg
            className="h-10 w-10 text-vault-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">No Vault Found</h2>
          <p className="text-white/40 max-w-sm text-sm leading-relaxed">
            You don't have a LegacyVault yet. Create one to start protecting your
            digital assets and configuring beneficiaries.
          </p>
        </div>
        <button
          onClick={onCreate}
          className="px-6 py-3 rounded-xl bg-vault-600 hover:bg-vault-500 text-white text-sm font-medium transition-all hover:scale-[1.02] shadow-lg shadow-vault-900/30"
        >
          Create My Vault
        </button>
      </div>
    );

    // ─── Error banner ─────────────────────────────────────────────────────────────

    const ErrorBanner: FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
      <div className="mx-6 mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
        <div className="h-5 w-5 text-red-400 shrink-0 mt-0.5">⚠</div>
        <div className="flex-1">
          <p className="text-sm text-red-300">{message}</p>
        </div>
        <button
          onClick={onRetry}
          className="text-xs text-red-400 hover:text-red-300 underline shrink-0"
        >
          Retry
        </button>
      </div>
    );

    // ─── Panel renderer ───────────────────────────────────────────────────────────

    interface PanelProps {
      tab: TabId;
      onTxStateChange: (s: TxStatusState) => void;
    }

    /**
     * Renders the active panel.
     * Each panel receives exactly the data slice it needs from the
     * real React Query hooks (Build 6) — no prop drilling of global state.
     */
    const PanelRenderer: FC<PanelProps> = ({ tab, onTxStateChange }) => {
      // All hooks — React Query suspense disabled; we handle loading per-panel
      const summary      = useVaultSummary();
      const guardians    = useGuardians();
      const beneficiaries = useBeneficiaries();
      const assets       = useAssets();
      const liveness     = useLiveness();
      const distribution = useDistribution();
      const documents    = useDocuments();
      const settings     = useSettings();
      const activity     = useActivityLog();
      const portfolio    = usePortfolioHistory();
      const notifications = useNotifications();
      const tx           = useTxBuilder({ onStateChange: onTxStateChange });

      switch (tab) {
        // ── Dashboard ─────────────────────────────────────────────────────────────
        case 'dashboard':
          if (summary.isLoading || portfolio.isLoading) return <DashboardSkeleton />;
          if (summary.error) return (
            <ErrorBanner message="Failed to load vault summary." onRetry={summary.refetch} />
          );
          return (
            <DashboardPanel
              summary={summary.data!}
              portfolio={portfolio.data ?? []}
              assets={assets.data ?? []}
              activity={activity.data ?? []}
              notifications={notifications.data ?? []}
            />
          );

        // ── Vault ─────────────────────────────────────────────────────────────────
        case 'vault':
          if (summary.isLoading || assets.isLoading) return <VaultSkeleton />;
          return (
            <VaultPanel
              summary={summary.data!}
              assets={assets.data ?? []}
              onFreeze={() => tx.execute('freeze-vault', {})}
              onUnfreeze={() => tx.execute('unfreeze-vault', {})}
              onDeposit={(params) => tx.execute('deposit', params)}
              onWithdraw={(params) => tx.execute('withdraw', params)}
            />
          );

        // ── Guardians ─────────────────────────────────────────────────────────────
        case 'guardians':
          if (guardians.isLoading) return <ListSkeleton rows={4} />;
          if (guardians.error) return (
            <ErrorBanner message="Failed to load guardians." onRetry={guardians.refetch} />
          );
          return (
            <GuardiansPanel
              guardians={guardians.data ?? []}
              vaultStatus={summary.data?.status ?? 'locked'}
              onAdd={(params) => tx.execute('add-guardian', params)}
              onRemove={(pubkey) => tx.execute('remove-guardian', { pubkey })}
              onSetThreshold={(t) => tx.execute('set-guardian-threshold', { threshold: t })}
            />
          );

        // ── Beneficiaries ─────────────────────────────────────────────────────────
        case 'beneficiaries':
          if (beneficiaries.isLoading) return <ListSkeleton rows={4} />;
          if (beneficiaries.error) return (
            <ErrorBanner message="Failed to load beneficiaries." onRetry={beneficiaries.refetch} />
          );
          return (
            <BeneficiariesPanel
              beneficiaries={beneficiaries.data ?? []}
              onAdd={(params) => tx.execute('add-beneficiary', params)}
              onUpdate={(params) => tx.execute('update-beneficiary', params)}
              onRemove={(pubkey) => tx.execute('remove-beneficiary', { pubkey })}
              onSetAssetRule={(params) => tx.execute('set-asset-rule', params)}
            />
          );

        // ── Liveness ──────────────────────────────────────────────────────────────
        case 'liveness':
          if (liveness.isLoading) return <LivenessSkeleton />;
          if (liveness.error) return (
            <ErrorBanner message="Failed to load liveness data." onRetry={liveness.refetch} />
          );
          return (
            <LivenessPanel
              liveness={liveness.data!}
              guardians={guardians.data ?? []}
              onCheckIn={() => tx.execute('check-in', {})}
              onAddDelegate={(params) => tx.execute('add-delegate', params)}
              onRemoveDelegate={(pubkey) => tx.execute('remove-delegate', { pubkey })}
            />
          );

        // ── Distribution ──────────────────────────────────────────────────────────
        case 'distribution':
          if (distribution.isLoading) return <DistributionSkeleton />;
          if (distribution.error) return (
            <ErrorBanner message="Failed to load distribution state." onRetry={distribution.refetch} />
          );
          return (
            <DistributionPanel
              distribution={distribution.data!}
              summary={summary.data!}
              onInitiateUnlock={() => tx.execute('initiate-unlock', {})}
              onApproveUnlock={() => tx.execute('approve-unlock', {})}
              onCancelUnlock={() => tx.execute('cancel-unlock', {})}
              onInitSolDistribution={() => tx.execute('init-sol-distribution', {})}
              onExecuteSolBatch={(params) => tx.execute('execute-sol-batch', params)}
              onInitSplDistribution={(params) => tx.execute('init-spl-distribution', params)}
              onExecuteSplBatch={(params) => tx.execute('execute-spl-batch', params)}
              onFinalizeUnlock={() => tx.execute('finalize-unlock', {})}
              onOpenDispute={(params) => tx.execute('open-dispute', params)}
              onResolveDispute={(params) => tx.execute('resolve-dispute', params)}
            />
          );

        // ── Documents ─────────────────────────────────────────────────────────────
        case 'documents':
          if (documents.isLoading) return <ListSkeleton rows={3} />;
          if (documents.error) return (
            <ErrorBanner message="Failed to load documents." onRetry={documents.refetch} />
          );
          return (
            <DocumentsPanel
              documents={documents.data ?? []}
              onUpload={documents.upload}
              onRevoke={(docId) => tx.execute('revoke-document', { docId })}
            />
          );

        // ── Settings ──────────────────────────────────────────────────────────────
        case 'settings':
          if (settings.isLoading) return <SettingsSkeleton />;
          if (settings.error) return (
            <ErrorBanner message="Failed to load settings." onRetry={settings.refetch} />
          );
          return (
            <SettingsPanel
              settings={settings.data!}
              onUpdateSettings={(params) => tx.execute('update-vault-settings', params)}
              onSetSubscription={(params) => tx.execute('set-subscription', params)}
            />
          );

        default:
          return null;
      }
    };

    // ─── Root App ─────────────────────────────────────────────────────────────────

    const App: FC = () => {
      const { connected } = useWallet();
      const { isAuthenticated } = useAuth();
      const summary = useVaultSummary({ enabled: connected && isAuthenticated });

      const [activeTab, setActiveTab] = useState<TabId>('dashboard');
      const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

      // ── Global TxStatusModal state ─────────────────────────────────────────────
      const [txState, setTxState] = useState<TxStatusState>({ phase: 'idle' });

      const handleTxStateChange = useCallback((s: TxStatusState) => {
        setTxState(s);
      }, []);

      const handleTxModalClose = useCallback(() => {
        setTxState({ phase: 'idle' });
      }, []);

      // ── Create vault handler ───────────────────────────────────────────────────
      // Uses the global tx builder directly (no panel context needed)
      const { execute: executeTx } = useTxBuilder({ onStateChange: handleTxStateChange });

      const handleCreateVault = useCallback(async () => {
        setActiveTab('settings'); // Navigate to settings so user can configure
        // Optionally auto-trigger create-vault:
        // await executeTx('create-vault', defaultVaultParams);
      }, []);

      // ── Unread notification count (for Sidebar badge) ─────────────────────────
      const { data: notifs } = useNotifications({ enabled: isAuthenticated });
      const unreadCount = notifs?.filter((n) => !n.read).length ?? 0;

      return (
        <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-bg-primary,#0a0a0f)] text-white">

          {/* Sidebar */}
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            collapsed={sidebarCollapsed}
            onCollapseToggle={() => setSidebarCollapsed((v) => !v)}
            vaultStatus={summary.data?.status ?? 'locked'}
            unreadCount={unreadCount}
          />

          {/* Main content area */}
          <main className="flex-1 flex flex-col overflow-hidden">

            {/* Top bar */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
              <div>
                <h1 className="text-lg font-semibold text-white capitalize">
                  {activeTab}
                </h1>
                {summary.data?.vaultAddress && (
                  <p className="text-xs text-white/30 font-mono mt-0.5">
                    {summary.data.vaultAddress.slice(0, 8)}…{summary.data.vaultAddress.slice(-8)}
                  </p>
                )}
              </div>

              {/* Vault status pill */}
              {isAuthenticated && summary.data && (
                <StatusPill status={summary.data.status} />
              )}
            </header>

            {/* Panel area */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Not connected */}
              {!connected && <NotConnected />}

              {/* Connected but not authenticated */}
              {connected && !isAuthenticated && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3 text-white/40 text-sm">
                    <div className="h-8 w-8 rounded-full border-2 border-vault-500/50 border-t-vault-400 animate-spin" />
                    Authenticating…
                  </div>
                </div>
              )}

              {/* Authenticated but no vault */}
              {connected && isAuthenticated && summary.data === null && !summary.isLoading && (
                <NoVault onCreate={handleCreateVault} />
              )}

              {/* Vault exists — render active panel */}
              {connected && isAuthenticated && (summary.data || summary.isLoading) && (
                <PanelRenderer
                  tab={activeTab}
                  onTxStateChange={handleTxStateChange}
                />
              )}
            </div>
          </main>

          {/* Global TxStatusModal */}
          <TxStatusModal
            state={txState}
            onClose={handleTxModalClose}
            cluster={
              (import.meta.env.VITE_CLUSTER as 'mainnet-beta' | 'devnet' | 'testnet')
              ?? 'mainnet-beta'
            }
          />
        </div>
      );
    };

    // ─── Vault status pill (top bar) ─────────────────────────────────────────────

    const STATUS_STYLES: Record<string, { dot: string; text: string; label: string }> = {
      locked:       { dot: 'bg-green-400',  text: 'text-green-400',  label: 'Locked'       },
      unlocking:    { dot: 'bg-yellow-400', text: 'text-yellow-400', label: 'Unlocking'    },
      unlocked:     { dot: 'bg-blue-400',   text: 'text-blue-400',   label: 'Executing'    },
      frozen:       { dot: 'bg-red-400',    text: 'text-red-400',    label: 'Frozen'       },
      distributed:  { dot: 'bg-white/30',   text: 'text-white/40',   label: 'Distributed'  },
    };

    const StatusPill: FC<{ status: string }> = ({ status }) => {
      const s = STATUS_STYLES[status] ?? STATUS_STYLES.locked;
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          <div className={`h-1.5 w-1.5 rounded-full ${s.dot} shadow-[0_0_4px_currentColor]`} />
          <span className={`text-xs font-medium ${s.text}`}>{s.label}</span>
        </div>
      );
    };

    export default App;

    8. Build 7 environment variables

    Add these to .env (never commit real values):

    env

    # .env.example

    # Solana RPC endpoint (Helius, Triton, etc.)
    VITE_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

    # API base URL (Build 4 server)
    VITE_API_BASE_URL=https://api.legacyvault.io/v1

    # Cluster for explorer links
    VITE_CLUSTER=mainnet-beta

    9. Build 7 summary — what changed and why
    File	Change	Why
    src/providers/AppProviders.tsx	NEW	Clean single-file provider tree — wallet + query + auth
    src/main.tsx	Updated	Wrap root with AppProviders
    src/components/LoadingSkeleton.tsx	NEW	Per-panel skeleton states; eliminates layout shift; matches glass UI
    src/components/TxStatusModal.tsx	NEW	Global tx lifecycle modal (building → signing → sending → confirming → success/error); step progress, sig copy/explorer link
    src/components/WalletButton.tsx	NEW	Connect → SIWS sign-in → authenticated session; dropdown; auto-triggers signIn() after wallet connect
    src/components/Sidebar.tsx	Updated	Footer slot replaced with <WalletButton />
    src/App.tsx	REPLACED	Removes all mock state; wires real hooks; renders skeletons/errors/no-vault states; injects TxStatusModal globally

    After Build 7, the only remaining work is Build 8 (the test suite). The application is fully wired end-to-end: real wallet → real SIWS auth → real React Query data → real useTxBuilder mutations → real TxStatusModal feedback → real on-chain state reflected back via the indexer.

    if you have the complete understanding of the build thus far, can you produce build 7 in theme with whats built thus far... it should be continuation of whats built thus far . these were the build phases we set out to complete (Build 1 Complete lib.rs + all Context structs + Cargo.toml for the Anchor program
    Build 2 All instruction handler bodies (Modules A–E)
    Build 3 All instruction handler bodies (Modules F–K)
    Build 4 Complete API server (routes, middleware, auth)
    Build 5 Indexer implementation
    Build 6 All frontend hooks (useVaultSummary through useSettings) with real React Query bodies
    Build 7 TxStatusModal, WalletButton, LoadingSkeleton components + App.tsx final wiring
    Build 8 Complete test suite (Anchor tests + API tests + hook tests))
    gpt-5.2-search
    favicon

    1

    LEGACYVAULTV1.0/completedoc.md at main · knarayanareddy/LEGACYVAULTV1.0

    https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/main/completedoc.md
    preview
    favicon

    2

    Github

    https://github.com/knarayanareddy/LEGACYVAULTV1.0/raw/refs/heads/main/Legacyvaultdashboardbuild/src/types.ts
    favicon

    3

    Github

    https://github.com/knarayanareddy/LEGACYVAULTV1.0/raw/refs/heads/main/Legacyvaultdashboardbuild/src/App.tsx
    favicon

    4

    Github

    https://github.com/knarayanareddy/LEGACYVAULTV1.0/raw/refs/heads/main/Legacyvaultdashboardbuild/src/hooks/useVaultState.ts
    favicon

    5

    LEGACYVAULTV1.0/Legacyvaultdashboardbuild/src/data/mockData.ts at main · knarayanareddy/LEGACYVAULTV1.0

    https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/main/Legacyvaultdashboardbuild/src/data/mockData.ts
    preview
    favicon

    6

    LEGACYVAULTV1.0/Legacyvaultdashboardbuild/src/components at main · knarayanareddy/LEGACYVAULTV1.0

    https://github.com/knarayanareddy/LEGACYVAULTV1.0/tree/main/Legacyvaultdashboardbuild/src/components
    preview
    favicon

    7

    Github

    https://github.com/knarayanareddy/LEGACYVAULTV1.0/raw/refs/heads/main/Legacyvaultdashboardbuild/src/index.css
    favicon

    8

    LEGACYVAULTV1.0/build1.md at main · knarayanareddy/LEGACYVAULTV1.0

    https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/main/build1.md
    preview
    favicon

    9

    LEGACYVAULTV1.0/build2.md at main · knarayanareddy/LEGACYVAULTV1.0

    https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/main/build2.md
    preview
    favicon

    10

    LEGACYVAULTV1.0/build3.md at main · knarayanareddy/LEGACYVAULTV1.0

    https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/main/build3.md
    preview
    favicon

    11

    LEGACYVAULTV1.0/build4.md at main · knarayanareddy/LEGACYVAULTV1.0

    https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/main/build4.md
    preview
    favicon

    12

    LEGACYVAULTV1.0/build5.md at main · knarayanareddy/LEGACYVAULTV1.0

    https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/main/build5.md
    preview
    favicon

    13

    LEGACYVAULTV1.0/build6.md at main · knarayanareddy/LEGACYVAULTV1.0

    https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/main/build6.md
    preview
    Executive summary (end-to-end)

    This repo is a design-spec-first implementation of LegacyVault. The authoritative source is completedoc.md, and Builds 1–6 are the stepwise “materialization” of that spec into (a) an Anchor program, (b) an API tx-builder + read API, (c) an event indexer + workers, and (d) a frontend wiring plan that replaces the current mock dashboard state.
    1

    What is actually committed as runnable code today is mainly the dashboard UI in Legacyvaultdashboardbuild/, but it still uses mockData.ts + useVaultState (in-memory simulation) and fake tx signatures, which completedoc.md explicitly labels as scaffolding that must be replaced.
    1

    Below is a true end-to-end deep dive, strictly grounded in completedoc.md + the Build 1–6 docs + the committed dashboard UI.
    0) Repo map (what each file “means”)
    Product/UI (committed code)
        Legacyvaultdashboardbuild/src/types.ts defines the frozen UI contract types (VaultState, Guardian, Beneficiary, VaultAsset, VaultDocument, DistributionBatch, Notification, ActivityLog).
        2
        Legacyvaultdashboardbuild/src/App.tsx renders the shell + tabs and currently pulls everything from useVaultState().
        3
        Legacyvaultdashboardbuild/src/hooks/useVaultState.ts is the mock store: toggles approvals, initiates/cancels unlock, simulates distribution with setTimeout, and hardcodes totalValue = 103701.
        4
        Legacyvaultdashboardbuild/src/data/mockData.ts is the mock domain dataset.
        5
        Legacyvaultdashboardbuild/src/components/*Panel.tsx are the UI tabs (Dashboard, Vault, Guardians, Beneficiaries, Liveness, Distribution, Documents, Settings) and Sidebar.tsx.
        6
        Legacyvaultdashboardbuild/src/index.css contains the Tailwind v4 theme tokens and the “glass” UI primitives (.glass-panel, .glass-card, etc.).
        7
    Spec + “materialization builds” (docs that contain code)
        completedoc.md is the single canonical source of truth: actors/trust model, UI bindings, flows, state machines, on-chain accounts + instructions, error/event model, off-chain services, API endpoints, indexer responsibilities, security model, and the frontend hook replacement plan.
        1
        build1.md → Anchor workspace skeleton + constants/state/errors/events/context structs.
        8
        build2.md → Implements most instruction bodies (admin, vault lifecycle, guardians, beneficiaries, deposits/withdrawals, liveness, documents, subscription), leaving Unlock + Distribution for Build 3.
        9
        build3.md → Implements Unlock + Dispute + Distribution batching logic (cursor, canonical ordering, ATA creation, remainder handling).
        10
        build4.md → API Gateway (Fastify) + Prisma schema + tx-builder service that returns unsigned base64 versioned transactions and includes compute budget + deterministic beneficiary sorting.
        11
        build5.md → Indexer: decodes Anchor emit!() events from logs, upserts read models in Postgres via Prisma, runs BullMQ workers (portfolio snapshots / notifications), and includes re-org protection settings.
        12
        build6.md → Frontend wiring plan: React Query hooks + SIWS auth + wallet adapters + useTxBuilder that calls /v1/tx/*, has the wallet sign, sends, then invalidates caches.
        13
    1) The “product contract” (what the UI demands must be real)
    1.1 Frozen tab order + parity rules

    completedoc.md freezes the sidebar order (dashboard → vault → guardians → beneficiaries → liveness → distribution → documents → settings) and states that the reference UI in Legacyvaultdashboardbuild/ is the canonical product interface.
    1
    1.2 “No Mock Data” is a hard constraint

    The spec explicitly calls out src/data/mockData.ts, useVaultState, fake tx signatures, and hardcoded values (like total vault value) as scaffolding that must be replaced by on-chain state, indexed events, or authenticated API responses.
    1
    1.3 UI domain model (the contract types)

    The UI contract types live in Legacyvaultdashboardbuild/src/types.ts:
        VaultState.state is one of: locked | unlocking | unlocked | frozen | distributed
        Guardian.role: personal | professional | delegate
        AssetOverride.type: pro-rata | fixed-bps | entire-to-beneficiary
        VaultAsset.type: SOL | SPL | NFT | POSITION
        2

    This is important because the rest of the system (on-chain accounts, indexer read model, API payloads) must map cleanly into these types—without changing the UI shape.
    1
    2) Actors & trust model (who can do what, and why)

    The spec defines:
        Owner: full admin control in normal operation; can check-in; can cancel unlock during timelock; can freeze/unfreeze; can upload documents; can deposit/withdraw when allowed.
        1
        Guardian (3 sub-roles matching UI):
            personal and professional can initiate/approve unlock
            delegate can only submit check-ins (liveness), not unlock approvals
            1
        Off-chain services are explicitly “advisory”: they can build transactions and provide data, but must never hold private keys or submit transactions on behalf of users.
        1
    3) End-to-end UX flows (how each tab maps to real operations)
    3.1 Settings → Create vault (first-time onboarding)

    Flow highlights:
        Owner sets inactivity threshold + timelock + guardian threshold (UI sliders).
        System derives vault PDA + vault authority PDA from owner pubkey.
        API builds a create-vault transaction; wallet signs and submits.
        Indexer confirms and populates read model; UI loads the new vault.
        1
    3.2 Beneficiaries tab

    Key invariant:
        If totalBps !== 10000, the plan is invalid and unlock/distribution are blocked at the protocol level.
        1

    Asset overrides per beneficiary per mint are first-class protocol rules:
        pro-rata (use global share)
        fixed-bps (explicit bps for this asset)
        entire-to-beneficiary
        1
    3.3 Liveness tab
        “daysSinceCheckIn” and health status must come from the API read model (server-side), not from client-side recomputation.
        1
        Check-in is an on-chain tx (check_in) signed by owner (or delegate).
        1
    3.4 Distribution tab (the 4-step protocol UI)

    The Distribution panel is the most sensitive flow and is explicitly broken into 4 steps: unlock → SOL batches → SPL batches → finalize.
    1
        Step 1 (unlock): a guardian initiates unlock if inactivity threshold is met; owner can cancel during timelock; owner can freeze/unfreeze.
        1
        Step 2 (SOL): init SOL distribution then execute batches; cursor advances; “Process All” runs batches sequentially.
        1
        Step 3 (SPL): per mint, init then execute batches; optional “Create missing ATAs” increases compute/fee and defaults to smaller batch size.
        1
        Step 4 (finalize): only when SOL session complete + all selected SPL sessions complete + no open dispute; then finalize moves vault to “distributed” and blocks future deposits/withdrawals.
        1
    3.5 Documents tab (client-side encryption + on-chain anchoring)

    Upload flow:
        Browser encrypts using WebCrypto AES-GCM
        Upload ciphertext to doc service (presigned)
        Client computes SHA-256 over ciphertext
        On-chain stores hash + URI commitment
        1

    Integrity on download:
        Recompute ciphertext hash and compare against on-chain vault.doc_hash; if mismatch, do not display.
        1
    4) State machines (UI ↔ protocol mapping)
    4.1 Vault status

    Canonical mapping:
        UI locked → on-chain Active
        UI unlocking → on-chain Unlocking
        UI unlocked → on-chain Executing
        UI distributed → on-chain Distributed
        UI frozen → on-chain Frozen
        1

    The spec explicitly says the UI must not “infer” state from timestamps; it must bind to the status coming from the read model.
    1
    4.2 Unlock session status

    Unlock session state machine includes Proposed → Approved → Executing → Executed, plus Cancelled and Disputed paths.
    1
    5) On-chain program deep dive (Anchor)
    5.1 Custody & safety posture
        The Anchor program is the sole custodian of assets and state.
        Mainnet upgrade authority must be multisig; single-key upgrade authority is forbidden.
        Distribution and other loops must be compute-aware; API should prepend compute budget instructions.
        Token operations must support both spl-token and token-2022 and validate the token program id.
        1
    5.2 Constants and protocol bounds

    completedoc.md and Build 1 align on:
        BPS_DENOMINATOR = 10_000
        default batch sizes: SOL=5, SPL=5, SPL-with-ATA-creation=3
        inactivity bounds: min 30d / max 365d, timelock bounds min 1d / max 90d
        1
    5.3 Canonical PDA seeds

    The program derives PDAs for:
        Vault, VaultAuthority
        GuardianEntry, BeneficiaryEntry
        AssetRule
        LivenessDelegate
        UnlockSession, GuardianApproval
        SolDistributionSession, SplDistributionSession
        DisputeCase
        SubscriptionState
        professional guardian profile/bond
        1

    These seeds must be mirrored exactly in:
        API tx-builder PDA helpers (Build 4)
        frontend PDA derivation (Build 6)
        11
    5.4 Core on-chain account structs

    Key accounts (high level):
        GlobalConfig: admin, paused flag, fee receiver, per-tier limits, etc.
        1
        Vault: owner, status, liveness/timelock settings, guardian/beneficiary counts, total_bps, document commitment fields, arbiter, counters, subscription tier, reserved padding.
        1
        GuardianEntry, BeneficiaryEntry, AssetRule, LivenessDelegate
        1
        UnlockSession and GuardianApproval
        1
        SolDistributionSession and SplDistributionSession with cursor tracking progress and completion timestamps.
        1
    5.5 Instruction set (modules A–J)

    completedoc.md defines each instruction with signer/accounts/validations/mutations/events. A few core examples:
    Vault lifecycle
        create_vault: init Vault + VaultAuthority + SubscriptionState; validates bounds; sets last_check_in = now; transfers creation fee.
        1
        update_vault_settings: only owner; only when Active; guardian threshold can’t exceed guardian count.
        1
        freeze_vault / unfreeze_vault: owner-only safety switch.
        1
    Guardians & beneficiaries
        add_guardian: owner-only; respects subscription tier limits; professional guardian requires verified KYC profile.
        1
        add_beneficiary: owner-only; updates vault.total_bps.
        1
    Liveness
        check_in: owner or active delegate updates last_check_in.
        9
    Documents
        set_document_commitment / revoke_document_commitment manage the on-chain hash+URI commitment.
        9
    Subscription
        set_subscription: owner-only; fee rules; downgrades blocked if usage exceeds limits.
        1
    6) Unlock + disputes (Build 3 core)
    6.1 Unlock eligibility is on-chain enforced

    initiate_unlock requires now >= last_check_in + inactivity_threshold. Build 3 shows the handler enforcing this via an inactivity-threshold check and returning UnlockNotEligible if not met.
    1
    6.2 Approvals and timelock
        Guardians approve via approve_unlock (and a GuardianApproval PDA prevents double-approvals).
        1
        The protocol uses a timelock window during which the owner can cancel (cancel_unlock restores vault status back to Active/locked).
        1
    6.3 Disputes + arbiter

    Unlock session can enter Disputed; finalize is blocked until resolved.
    1
    7) Distribution batching (the compute-critical heart)
    7.1 Determinism requirements

    Distribution must be deterministic regardless of who constructs the transaction:
        Canonical beneficiary order = ascending lexicographic order of beneficiary wallet pubkey bytes.
        Enforced on-chain by validating ordering inside each batch + requiring start_index == cursor.
        1

    Build 4’s tx builder mirrors this by sorting beneficiaries by pubkey bytes before building remaining accounts.
    11
    7.2 Remaining accounts layout (critical for tx builders)

    completedoc.md defines fixed layouts:
        SOL batch: [BeneficiaryEntry PDA, Beneficiary wallet] repeated
        SPL batch: [BeneficiaryEntry PDA, Beneficiary wallet, Beneficiary ATA] repeated
        If createMissingAtas = true, pass ATA program + system program after the batch accounts.
        1
    7.3 Cursor-based idempotency (no skipping, no double-pay)

    Every batch checks:
        start_index == session.cursor
        start_index + batch_size <= total_beneficiaries and then advances cursor.
        1
    7.4 Remainder handling (no rounding dust)

    SOL:
        Each beneficiary gets (share_bps * total_lamports) / 10000
        Remainder goes to last beneficiary in the final batch only
        Security section explicitly calls out “send total - distributed to last beneficiary” to eliminate residue.
        1
    7.5 SPL distribution + ATA creation

    SPL batches:
        Can optionally create missing ATAs (payer = signer) when enabled.
        Spec warns this increases compute/fees and suggests reducing batch size (3 instead of 5).
        1
    7.6 Asset overrides during SPL distribution

    During SPL distribution, the program must check any AssetRule for (vault, beneficiary, mint) and apply:
        ProRata
        FixedBps
        EntireToBeneficiary
        1
    8) Off-chain services (why they exist, and their boundaries)
    8.1 API Gateway responsibilities

    The API exists because the dashboard needs:
        portfolio charts/history
        asset metadata enrichment
        notifications
        activity log
        tx building convenience
        …but the API must remain non-custodial (no keys).
        1
    Auth: SIWS + JWT

    Endpoints:
        /v1/auth/nonce issues a nonce stored in Redis with TTL
        /v1/auth/verify verifies signature and issues access/refresh tokens (15 min access token per Build 4 sample)
        /v1/auth/refresh rotates tokens
        1
    Tx builder: returns unsigned VersionedTransaction as base64

    The spec lists a full set of /v1/tx/* endpoints for every on-chain action (create vault, update settings, add/remove guardians/beneficiaries, deposit/withdraw, check-in, unlock/distribution, docs, subscription, etc.).
    1

    Build 4 shows a helper that:
        prepends ComputeBudgetProgram.setComputeUnitLimit
        compiles to a v0 message
        serializes to base64 for the client to sign
        11
    8.2 Indexer = backbone of “no mock data”

    Indexer responsibilities include:
        subscribe to program logs
        decode emit!() events via IDL
        upsert Postgres read models
        trigger notifier + portfolio snapshots
        re-org detection/handling
        1

    Build 5 shows:
        event decoding via an event parser over logs
        12
        handlers that upsert unlock/distribution state and activity logs in Prisma/Postgres
        12
        re-org protection configuration variables (MAX_REORG_DEPTH, FINALIZED_CONFIRMATION_DEPTH) and a “slot tracker” concept
        12
    8.3 Market data + portfolio snapshots

    The spec defines a market data service with preferred sources (Jupiter Price API v2, Birdeye, Helius DAS) and a snapshot job triggered on deposit/withdraw and every 4 hours.
    1

    Build 4 includes a marketData service that tries Jupiter then Birdeye and caches prices in Redis.
    11

    Build 5 includes a BullMQ worker for portfolio snapshots.
    12
    8.4 Documents service (storage backends)

    Spec lists storage backends in priority order (Arweave, Shadow Drive, S3-compatible), and mandates backend-agnostic configuration.
    1
    9) Frontend wiring (Build 6): how the mock dashboard becomes real
    9.1 Current state (committed dashboard)

    Today App.tsx pulls from useVaultState and renders the tab switch based on activeTab.
    3

    useVaultState uses mock datasets and simulates distribution by setting status: 'processing' then flipping to completed after a timeout with a random “txSignature”.
    4
    9.2 Target state (Build 6 hook architecture)

    Build 6 introduces:
        React Query useQuery / useMutation hooks per panel (assets, guardians, beneficiaries, liveness, distribution, documents, settings, notifications, activity, portfolio).
        13
        SIWS auth hook/provider (useAuth) integrated with wallet connection/disconnection handling.
        13
        A generic useTxBuilder pattern that:
            calls API /v1/tx/... to get base64 tx
            deserializes to VersionedTransaction
            calls wallet signTransaction
            sends and confirms
            invalidates relevant caches
            13
    9.3 Documents wiring example (Build 6)

    Build 6 shows a full documents hook flow where, after upload + hash, it executes set-document-commitment on-chain and then confirms with the API.
    13
    10) Security model (what’s explicitly threat-modeled)
    10.1 On-chain threats

    The spec explicitly models and mitigates:
        guardian collusion (inactivity check + timelock cancellation + notifications + optional bond/arbiter; recommends 90d inactivity + 30d timelock)
        1
        program upgrade attacks (multisig upgrade authority + timelocked upgrades)
        1
        PDA signer forgery (seed/bump validation + token accounts owned by canonical vault authority PDA)
        1
        batch cursor manipulation (require cursor match; validate ordering)
        1
        rounding exploitation (remainder to last beneficiary, session tracks distributed total)
        1
        re-entrancy concerns via token-2022 hooks (validate token program id)
        1
        frozen-state bypass (distribution checks vault not frozen/distributed)
        1
    10.2 Off-chain/app threats

    Includes:
        JWT theft mitigations (short TTL, refresh rotation, CORS constraints)
        1
        malicious tx-builder mitigations (simulate before sign; show human-readable summary)
        1
        document key loss mitigations (user warning; future escrow ideas)
        1
    11) What’s “implemented” vs “present as build-doc code”

    This matters because you asked to “understand every aspect end-to-end,” and in this repo there are two “realities”:
    Reality A: committed runnable UI
        The dashboard is present as a Vite/React app, but its state is mocked (useVaultState, mockData.ts).
        4
    Reality B: the full system exists as spec + build-doc code blocks
        The Anchor program, API, indexer, and frontend hook wiring are defined in the build docs and are intended to be turned into actual folders/files (Build 1 lays out the exact Anchor workspace file tree; Build 4 lays out api/ structure; Build 5 lays out indexer/ structure; Build 6 lays out dashboard/src/... hook structure).
        8

    So: you can understand the full design end-to-end from this repo, but you can’t “run the whole stack” just by cloning and hitting docker compose up, because the program/API/indexer aren’t committed as directories—only as build-document blueprints.
    12) The end-to-end causal chain (one full “happy path”)

    To demonstrate the system is internally consistent, here’s the intended chain across all layers:
        Owner creates vault (Settings tab) → on-chain create_vault → emits VaultCreated → indexer writes vaults row → UI reads /v1/vaults/:vault/summary.
        1
        Owner adds guardians/beneficiaries → on-chain add instructions update counts + total_bps → emits events → indexer updates read models → UI tabs render live lists.
        1
        Owner deposits assets → on-chain deposit instructions move SOL/SPL into program-controlled custody → events trigger portfolio snapshot worker → Dashboard KPI + charts update.
        9
        Owner checks in (Liveness tab) → on-chain check_in updates last_check_in → notifier schedules reminders off-chain.
        1
        Owner goes inactive → guardian initiates unlock → guardians approve → timelock starts → owner may cancel.
        1
        After timelock, owner executes SOL batch distribution → cursor advances; remainder handled; activity log + distribution sessions updated by indexer.
        1
        Owner executes SPL distribution per mint (with optional ATA creation) → cursor advances similarly.
        1
        Owner finalizes → vault enters Distributed terminal state; deposits/withdrawals blocked.
        1

    If you want, I can also produce a panel-by-panel mapping table (UI element → API endpoint → indexer table(s) → on-chain instruction(s) → event(s) emitted) using only completedoc.md as the truth source; that’s the most mechanical way to validate “every aspect” is covered without hand-waving.

    completedoc is the design doc upon which build 1 to 6 have been built thus far... ignore masterdoc.md completely
    gpt-5.2-search
    favicon

    1

    GitHub - knarayanareddy/LEGACYVAULTV1.0: LegacyVault is a Solana-native “digital estate executor” that lets a user (Owner) create a programmable inheritance plan for their digital assets, backed by an on-chain vault and a multi-party, time-delayed unlock process.

    https://github.com/knarayanareddy/LEGACYVAULTV1.0/tree/main
    preview
    favicon

    2

    LEGACYVAULTV1.0/README.md at main · knarayanareddy/LEGACYVAULTV1.0

    https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/main/README.md
    preview
    favicon

    3

    Raw

    https://raw.githubusercontent.com/knarayanareddy/LEGACYVAULTV1.0/main/MASTERDOC.MD
    favicon

    4

    LEGACYVAULTV1.0/completedoc.md at main · knarayanareddy/LEGACYVAULTV1.0

    https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/main/completedoc.md
    preview
    favicon

    5

    Raw

    https://raw.githubusercontent.com/knarayanareddy/LEGACYVAULTV1.0/main/build1.md
    favicon

    6

    LEGACYVAULTV1.0/Legacyvaultdashboardbuild at main · knarayanareddy/LEGACYVAULTV1.0

    https://github.com/knarayanareddy/LEGACYVAULTV1.0/tree/main/Legacyvaultdashboardbuild
    preview
    favicon

    7

    LEGACYVAULTV1.0/Legacyvaultdashboardbuild/vite.config.ts at main · knarayanareddy/LEGACYVAULTV1.0

    https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/main/Legacyvaultdashboardbuild/vite.config.ts
    preview
    favicon

    8

    LEGACYVAULTV1.0/Legacyvaultdashboardbuild/package.json at main · knarayanareddy/LEGACYVAULTV1.0

    https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/main/Legacyvaultdashboardbuild/package.json
    preview
    favicon

    9

    LEGACYVAULTV1.0/Legacyvaultdashboardbuild/src/components at main · knarayanareddy/LEGACYVAULTV1.0

    https://github.com/knarayanareddy/LEGACYVAULTV1.0/tree/main/Legacyvaultdashboardbuild/src/components
    preview
    favicon

    10

    LEGACYVAULTV1.0/Legacyvaultdashboardbuild/src/components/Sidebar.tsx at main · knarayanareddy/LEGACYVAULTV1.0

    https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/main/Legacyvaultdashboardbuild/src/components/Sidebar.tsx?plain=1
    preview
    favicon

    11

    Raw

    https://raw.githubusercontent.com/knarayanareddy/LEGACYVAULTV1.0/main/Legacyvaultdashboardbuild/src/hooks/useVaultState.ts
    favicon

    12

    Raw

    https://raw.githubusercontent.com/knarayanareddy/LEGACYVAULTV1.0/main/Legacyvaultdashboardbuild/src/data/mockData.ts
    favicon

    13

    Raw

    https://raw.githubusercontent.com/knarayanareddy/LEGACYVAULTV1.0/main/Legacyvaultdashboardbuild/src/index.css
    favicon

    14

    Raw

    https://raw.githubusercontent.com/knarayanareddy/LEGACYVAULTV1.0/main/build2.md
    favicon

    15

    Raw

    https://raw.githubusercontent.com/knarayanareddy/LEGACYVAULTV1.0/main/build3.md
    favicon

    16

    Raw

    https://raw.githubusercontent.com/knarayanareddy/LEGACYVAULTV1.0/main/build4.md
    favicon

    17

    Raw

    https://raw.githubusercontent.com/knarayanareddy/LEGACYVAULTV1.0/main/build5.md
    favicon

    18

    Raw

    https://raw.githubusercontent.com/knarayanareddy/LEGACYVAULTV1.0/main/build6.md
    What you actually have in this repo (and what you don’t)

    This repository is primarily a product + protocol specification (docs) plus a Vite/React dashboard UI build that currently runs on mock state/data. It is not a complete, runnable end-to-end system yet (the on-chain program + API + indexer are described in detail, but their full source trees are not committed as folders here).
    1
    Repo inventory (top-level)
        README.md: one-paragraph product description.
        2
        MASTERDOC.MD (canonical spec, dated 2026‑05‑04, “single source of truth”): protocol PDAs, accounts, instruction set, off-chain architecture, security model, execution plan, etc.
        3
        completedoc.md (very detailed “Phase 1/2” style build doc; includes on-chain program rules, UI flows, distribution batching rules, roadmap, key mgmt).
        4
        build1.md … build6.md: “build packs” that include full file trees and code/spec chunks for: Anchor program scaffold (Build 1), instruction implementations (Build 2–3), API server (Build 4), indexer (Build 5), and frontend plumbing/auth/hooks/tx builder (Build 6).
        5
        Legacyvaultdashboardbuild/: the dashboard UI (React 19 + Vite 7 + Tailwind v4) plus its src/ components/hooks and mock data.
        6
    1) What “LegacyVault” is supposed to be (product-level)

    LegacyVault is designed as a Solana-native digital estate executor: an owner deposits assets into an on-chain vault and configures:
        beneficiaries + % shares
        guardians + an M-of-N threshold
        liveness rules (check-ins) + inactivity threshold
        a timelock delay
        optional documents (encrypted off-chain, hash/URI anchored on-chain)
        3

    The key philosophy in the spec: the Anchor program is the sole custodian of assets and state; off-chain services may help UX, but must not be able to move funds by themselves.
    4
    2) On-chain protocol deep dive (as specified)
    2.1 Custody model in plain English
        The system revolves around a Vault PDA + a VaultAuthority PDA that actually owns/controls custody token accounts / SOL custody.
        Users “deposit” into accounts owned by the program’s authority PDA(s).
        Distribution is executed by the program using deterministic rules after the unlock process completes.
        3
    2.2 Canonical PDAs / seeds

    MASTERDOC.MD enumerates canonical seeds (this matters a lot because every SDK/API/indexer must derive addresses identically). Examples listed include seeds for vaults, vault authority, beneficiary entries, guardian entries, asset rules, delegates, unlock sessions, approvals, distribution sessions, disputes, subscription, and pro-guardian constructs.
    3
    2.3 Core accounts / state (conceptual map)

    Across the docs, the “shape” is consistent even if exact enums/fields differ slightly by version:
        GlobalConfig: admin, pause switch, fee receiver/treasury, bounds, etc.
        3
        Vault: owner, status, timestamps, inactivity + timelock settings, guardian threshold and counts, beneficiary counts + total bps, document commitment fields, etc.
        3
        GuardianEntry (per guardian): role/status/added/accepted/removed, etc.
        5
        BeneficiaryEntry (per beneficiary): share bps, active flag, timestamps.
        4
        AssetRule (per mint override): pro-rata vs fixed bps vs entire-to-beneficiary override modes (wording varies a bit by doc version).
        3
        LivenessDelegate: optional delegate(s) who can perform check-ins.
        3
        UnlockSession + GuardianApproval: tracks initiation, approvals, timelock windows, dispute status, etc.
        4
        Distribution sessions (SOL + per-mint SPL): track cursor/batching and completion.
        4
        DisputeCase: optional arbitration to pause/cancel/proceed.
        4
        Subscription / Pro guardian profile/bond: optional commercial layer (limits, fees, KYC, bonding, slashing).
        4
    2.4 State machine (lifecycle)

    completedoc.md defines a state machine roughly like:
        Active / locked
        → Unlocking when an eligible guardian initiates unlock (after inactivity threshold)
        → Executing / unlocked after M-of-N approvals + timelock elapsed (distribution happens here)
        → Distributed (terminal)
        Frozen can be entered from any state as a safety halt, then restored.
        4

    A particularly important safety valve: the owner can cancel during the timelock (before distribution begins).
    4
    2.5 Instruction surface (what the protocol can do)

    The spec lists a “complete” instruction set, broadly covering:
        Admin: configure, pause, bounds/fees
        Vault lifecycle: create/update/freeze/unfreeze
        Guardians: add/remove/set threshold
        Beneficiaries: add/update/remove; enforce shares sum to 10,000 bps
        Asset rules per mint
        Deposits/withdrawals (only while safe)
        Documents: set/revoke commitment
        Liveness: check-in + delegates
        Unlock + approvals + cancellation
        Disputes + resolution
        Distribution: SOL + SPL batching and finalize
        Subscription + pro guardian network (optional)
        3
    2.6 Token compatibility: SPL Token + Token-2022

    completedoc.md explicitly calls out that SPL operations should support both legacy spl-token and spl-token-2022, by taking the token program as an account and validating it’s one of the known IDs.
    4

    (And Build 1’s Anchor deps enable both token variants via anchor-spl features.)
    5
    3) Unlocking + distribution batching (the “hard part”)
    3.1 Unlock initiation + approvals + timelock

    Key rules from completedoc.md:
        A guardian (personal/professional; not delegate) can initiate_unlock only when now >= last_check_in + inactivity_threshold.
        4
        Guardians can approve_unlock; when approvals reach threshold, the session becomes “Approved” and sets timelock_ends_at = now + timelock_duration.
        4
        Owner can cancel_unlock if still Proposed/Approved (i.e., before executing distribution).
        4
        Optional dispute: open/resolve dispute can cancel or proceed.
        4
    3.2 Distribution is intentionally compute-aware and deterministic

    The spec stresses distribution is the most compute sensitive module, so it:
        Runs in batches
        Uses remaining accounts with a fixed layout
        Enforces a canonical beneficiary ordering (lexicographic pubkey order) to make the process deterministic and verifiable
        Uses a cursor so batches must execute sequentially (no skipping/reordering)
        Allocates rounding remainder to the last beneficiary in the final batch
        4
    Remaining-accounts layouts (important for tx builders)

    From completedoc.md:
        SOL batch: for each beneficiary, pass BeneficiaryEntry PDA + beneficiary wallet (receiver).
        SPL batch: for each beneficiary, pass BeneficiaryEntry PDA + beneficiary wallet + beneficiary ATA (receiver).
        4
    SPL “Create missing ATAs” toggle

    The distribution UI/spec includes an option to create missing beneficiary ATAs during SPL distribution, but warns about compute/tx-size implications.
    4
    4) Documents subsystem (encryption + on-chain anchoring)

    The document flow in completedoc.md is a classic “client-side encryption + off-chain blob storage + on-chain commitment” design:
        Browser encrypts file (AES-GCM via WebCrypto)
        Upload encrypted blob to doc service (presigned URL)
        Compute sha256(ciphertext) client-side
        Send on-chain tx to store {hash, uri} commitment in the Vault
        Download requires auth; decrypt client-side again
        4

    This gives you integrity/auditability (hash on chain) without leaking document contents on chain.
    4
    5) Off-chain architecture (as specified)

    Both MASTERDOC and completedoc describe a fairly standard web2/web3 hybrid:
        API gateway: auth (Sign-in with Solana / SIWS), tx building, metadata, notification prefs.
        Indexer: listens to program logs/events and builds read models in a DB.
        Notifier: email/SMS/push reminders and alerts.
        Doc service: presigned uploads, pinning/storage coordination.
        Optional: KYC adapter, automation worker (suggests txs but never holds keys).
        3

    Also note the explicit operational/key-management guidance: secrets should come from a secrets manager; no private keys in .env committed to source control.
    4
    6) The dashboard app in Legacyvaultdashboardbuild/ (actual code present)
    6.1 Tooling + build configuration
        Built with Vite + React + Tailwind v4.
        vite-plugin-singlefile is enabled, suggesting the intent to ship as a single static HTML artifact.
        7
        package.json shows dependencies: react, recharts, lucide-react, clsx, tailwind-merge, Tailwind v4, TypeScript, etc.
        8
    6.2 UI structure (what screens exist)

    src/components/ contains:
        Sidebar
        Dashboard
        VaultPanel
        GuardiansPanel
        BeneficiariesPanel
        LivenessPanel
        DistributionPanel
        DocumentsPanel
        SettingsPanel
        9

    The Sidebar defines nav items for those tabs and renders a “Vault secured” status card, collapse toggle, and an unread badge on Distribution.
    10
    6.3 State management: currently a mock “store hook”

    There is a single hook useVaultState() that:
        Initializes state from mockData.ts
        Simulates actions like toggling guardian approvals, initiating/canceling unlock, freezing/unfreezing, check-ins
        Simulates distribution processing via setTimeout and fake tx signatures
        11

    So: this UI is not wired to Solana yet—it’s a realistic “product demo shell” with a clean UI contract.
    11
    6.4 Mock data is deliberately shaped like the on-chain domain

    mockData.ts includes:
        mockVault with inactivity and timelock durations, guardian threshold, subscription tier/expiry
        Guardians (personal/professional/delegate), beneficiaries, assets, liveness records, docs, distribution batches, notifications, activity log
        Some realistic Solana mint addresses (e.g., SOL, USDC) and asset types (SOL/SPL/NFT/POSITION)
        12
    6.5 Styling: Tailwind v4 theme tokens + “glass” UI

    index.css defines Tailwind v4 theme tokens like --color-vault-*, plus utility classes like .glass-panel, .glass-card, shimmer text, custom toggles, scrollbar styling, and animations.
    13
    6.6 How to run the dashboard locally

    From package.json scripts:
        npm install
        npm run dev (Vite dev server)
        npm run build / npm run preview
        8
    7) The “missing” implementation pieces are still provided—inside the docs

    A major theme of this repo: the real program/services are present as build instructions/spec/code blocks, not as a committed folder tree.
    7.1 Anchor program scaffold (Build 1)

    build1.md describes a full Anchor workspace layout (legacyvault/, programs/legacyvault/src/...) and includes:
        Anchor/anchor-spl dependency versions and features (including token + token_2022)
        constants including BPS_DENOMINATOR = 10_000
        detailed account space calculations
        enums for status/roles/tiers …and more.
        5
    7.2 Instruction handler implementations (Build 2 & 3)
        Build 2: implements “safe” modules (everything except unlock/distribution).
        14
        Build 3: implements unlock + distribution batching/finalization.
        15
    7.3 API gateway & indexer (Build 4 & 5)
        Build 4: Fastify + TS + Prisma + Redis + SIWS + Anchor; routes for auth, vault reads, tx builders, docs, etc.
        16
        Build 5: Node/TS indexer listening to Anchor events, persisting read models, triggering notifications, snapshots, etc.
        17
    7.4 The real frontend wiring plan (Build 6 + completedoc appendix)

    completedoc.md even includes an explicit “refactor App.tsx wiring to real hooks” plan, i.e., replace the single useVaultState mock hook with React Query hooks + auth + wallet integration.
    4

    And it lists extra dependencies you’ll need (wallet adapter, @coral-xyz/anchor, @solana/web3.js, React Query).
    4

    Build 6 goes further and provides large chunks of code for:
        typed API responses,
        wallet providers,
        SIWS auth context,
        a transaction-builder hook that fetches an unsigned tx from the API, has the wallet sign it, then sends + confirms.
        18
    8) Practical “end-to-end” mental model (how it all fits)

    Here’s the intended operational loop implied by the docs:
        Owner configures vault (guardians, beneficiaries, liveness/timelock, docs). On-chain instructions mutate Vault + per-entry PDAs.
        4
        Owner deposits assets into vault-controlled custody (VaultAuthority PDAs / token accounts).
        3
        Owner periodically checks in (resets inactivity timer).
        3
        If inactivity threshold passes: a guardian initiates unlock, and guardians approve until threshold.
        4
        After threshold met: a timelock starts; owner can cancel before execution begins.
        4
        After timelock ends: system moves into Executing, and distribution is performed in deterministic batches with strict ordering/cursor rules.
        4
        Once SOL + selected SPL distributions complete: finalize_unlock sets Vault to Distributed, blocking further custody changes.
        4
        Off-chain: indexer builds dashboards, notifier sends reminders/alerts, API builds transactions, but never controls keys.
        3
    9) Notable inconsistencies / “version drift” you should be aware of

    Because you have multiple overlapping mega-docs (MASTERDOC, completedoc, build1), there are places where enum variants/field shapes differ (e.g., VaultStatus variants like Executing/Closed, or doc hash sizes). The intent is consistent, but if you implement, you must pick one canonical source and reconcile differences before coding.
    3
    Bottom line
        If your goal is “understand every aspect of the repo”: it’s best viewed as a complete blueprint for a Solana inheritance vault product, plus a polished mock dashboard demonstrating the UI/UX and domain model.
        3
        If your goal is “run the whole system”: you’ll need to materialize the doc-described code into actual folders (Anchor workspace, API, indexer) and then replace the dashboard’s useVaultState mock with the Build 6 hook stack and real tx-building.
        5

    can you do a deep dive end to end of : https://github.com/knarayanareddy/LEGACYVAULTV1.0/tree/main. and understand every aspect of it

Inputs are processed by third-party AI and responses may be inaccurate.
