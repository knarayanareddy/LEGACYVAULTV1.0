# LegacyVault remediation plan

Proposed only; no code, chain or accounts were accessed. See [review](REVIEW.md). Dependencies: `LV-T1 → LV-T2 → LV-T3 → LV-T4 → LV-T5`.

### LV-T1 — Baseline and authority map (LV-1, LV-5)
Prerequisite: owner provides isolated test network and synthetic data. Observed paths: `.github/workflows/test.yml`, `api/package.json`, `legacyvault/programs/legacyvault/src/`.
1. Inspect the historical failed run and reproduce the failing step with recorded toolchain versions.
2. Resolve the missing seed-script target or document its verified external generation; do not run it against real data.
3. Trace wallet identity, API authorization, program instructions, account ownership, indexer and dashboard data flow.
Deliverable: baseline and trust/authority map. Verification: independent reviewer follows one synthetic vault action from user intent to on-chain state.
- [ ] CI failure and seed target are resolved or explicitly blocked.
- [ ] Authority and data paths are evidenced at actual enforcement points.

### LV-T2 — Secure contracts and private data (LV-3, LV-4)
Prerequisite: LV-T1; owner approves threat model and independent specialist review. Observed paths: `legacyvault/programs/legacyvault/src/`, `api/src/middleware/auth.ts`, `api/src/routes/`, `dashboard/src/hooks/useTxBuilder.ts`.
1. Specify conservation, signer, guardian threshold, delay, beneficiary and upgrade invariants for every instruction.
2. Review and enforce account ownership, replay resistance, API object authorization, document access and transaction-intent verification.
3. Add adversarial tests using disposable keys and synthetic documents, including early unlock, wrong signer, duplicate/replayed action and cross-owner access.
Deliverable: security corrections and independent findings record. Verification: remove a signer/ownership check in an isolated mutation and confirm a targeted negative test fails.
- [ ] Independent contract review covers all asset-moving instructions.
- [ ] Unauthorized access and early distribution are demonstrably rejected.

### LV-T3 — Make automation fail honestly (LV-1, LV-2)
Prerequisite: LV-T2. Observed paths: `api/package.json`, `indexer/package.json`, `.github/workflows/test.yml`, `legacyvault/tests/`.
1. Remove permissive empty-suite behavior for required tests and configure explicit discovery.
2. Add indexer duplicate-event, ordering, restart and chain-reconciliation tests plus API and contract security regressions.
3. Pin and verify toolchain/install provenance and generated IDL compatibility; run all component gates on the candidate.
Deliverable: reproducible component and integration tests. Verification: temporarily remove tests in a disposable branch and verify the gate fails; mutate a distribution invariant and verify detection.
- [ ] Empty suites cannot report a passing required check.
- [ ] IDL and program surface match under a reproducible build.

### LV-T4 — Release, rollback and recovery (preventive)
Prerequisite: LV-T3; owner approves network, authorities and recovery objectives. Observed paths: `infra/docker-compose.yml`, `api/Dockerfile`, `indexer/Dockerfile`, Prisma schemas.
1. Define signing and upgrade controls, immutable artifacts, database migration and queue/indexer replay policies.
2. Deploy to an isolated staging environment and exercise restart and reconciliation with test-chain events.
3. Restore a synthetic database backup, validate indexed state against chain state, and demonstrate application rollback; document limits of on-chain rollback.
Deliverable: observed recovery and release record. Verification: independent observer checks restored data and chain/index consistency, not merely job completion.
- [ ] Recovery and replay are observed against approved objectives.
- [ ] Upgrade authority and irreversible chain actions have explicit approvals.

### LV-T5 — Independent UX and production decision (preventive)
Prerequisite: LV-T4 and independent smart-contract review. Observed paths: `dashboard/src/components/`, `dashboard/src/hooks/`.
1. Test accessible wallet connection, delayed unlock warnings and transaction summaries with synthetic users.
2. Verify actual signer, amounts, network and irreversible consequences are visible before approval.
3. Independently rerun security and recovery checks and obtain legal/domain and owner sign-off.
Deliverable: bounded release acceptance and residual risk record. Verification: observe a complete test-network journey and rejection of a malicious transaction intent.
- [ ] Users can identify and reject unintended transactions.
- [ ] Independent review and owner decisions are recorded.

## Production gates and rollback

Owner must approve custody, legal use, signing, deployment and retention. No real funds before independent security review, candidate-specific tests and observed recovery. Roll back off-chain components to a verified artifact; on-chain reversibility must be explicitly established rather than assumed.
