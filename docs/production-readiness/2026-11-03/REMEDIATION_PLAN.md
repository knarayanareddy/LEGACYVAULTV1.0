# LEGACYVAULTV1.0 remediation plan

Proposed only; no target code, wallets, infrastructure, or accounts were executed or accessed. This plan remains bounded to the sampled evidence in [REVIEW.md](REVIEW.md).

## 1. Phased roadmap with explicit entry and exit criteria

| Phase | Focus | Entry criteria | Exit criteria |
| --- | --- | --- | --- |
| P1 / LV-T1 | Baseline, CI reproduction, authority map | Reviewed SHA and evidence set are fixed; owner provides isolated test network and synthetic data only | Historical failure is classified by exact job/step; seed-path drift is resolved or explicitly blocked; authority/data-flow map exists |
| P2 / LV-T2 | On-chain, identity, and private-data controls | P1 complete; owner approves threat model and specialist review scope | Asset-moving/auth/document flows have stated invariants and negative-test plan |
| P3 / LV-T3 | Honest automation and regression gates | P2 complete | Required suites fail on no-tests/broken behavior; toolchain and IDL checks are reproducible |
| P4 / LV-T4 | Release, rollback, and recovery | P3 complete; owner approves target environment and recovery objectives | Off-chain release + restore + replay procedure is observed on staging and documented |
| P5 / LV-T5 | Independent acceptance and bounded launch decision | P4 complete; independent reviewers available | Residual risk record, owner approvals, and go/no-go decision are documented without claiming legal or security certification |

## 2. Tasks

### LV-T1 — Baseline and authority map

**Linked finding(s):** LV-1, LV-5  
**Prerequisites:** owner supplies isolated environment, synthetic seed data, and designated reviewers.  
**Observed evidence:**
- Body-inspected: `.github/workflows/test.yml:23-60` — “`Install Solana`”, “`Patch truncated IDL`”, “`Run Anchor tests`” ([immutable anchor](https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/fccb21f183e68d4ccdcb0b751f00c73c6f6736d3/.github/workflows/test.yml#L23-L60))
- Body-inspected: `api/package.json:11-15` — “`db:seed`” points to “`tsx scripts/init-db.ts`” ([immutable anchor](https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/fccb21f183e68d4ccdcb0b751f00c73c6f6736d3/api/package.json#L11-L15))
- Tree-only for later inspection: `fleet-hardening-review/evidence/LEGACYVAULTV1.0/snapshot.json:197-203` lists `legacyvault/programs/legacyvault/src/**`; bodies were not inspected in the current review.

1. Reproduce the exact failing Test Suite job on an isolated environment using the reviewed SHA and recorded toolchain versions only.
2. Trace each declared script and workflow entry point to a real committed file, resolving the `db:seed` path drift or blocking the workflow until corrected.
3. Produce an authority/data-flow map covering wallet signer, API auth, program authority, indexer ingestion, queue workers, and outward messaging/document services.

**Expected deliverable:** baseline report with failing-step evidence, script/path disposition, and an authority/data-flow diagram or table.  
**Verification procedure:** independent reviewer follows one synthetic vault lifecycle from client intent to on-chain/indexed/off-chain records and confirms each enforcement point is named.  
**Definition of done:**
- [ ] The historical failure is tied to a specific job and step, not inferred from status alone.
- [ ] The seed-script path is corrected or formally blocked with owner acknowledgement.
- [ ] The authority/data-flow map names all trust boundaries and credentials.

### LV-T2 — Contract, identity, and private-data controls

**Linked finding(s):** LV-3, LV-4  
**Prerequisites:** LV-T1 complete; owner approves threat model; independent smart-contract/security reviewer engaged.  
**Observed evidence:**
- Body-inspected: `README.md:2` — “`multi-party, time-delayed unlock process`” ([immutable anchor](https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/fccb21f183e68d4ccdcb0b751f00c73c6f6736d3/README.md#L2-L2))
- Tree-only for later inspection: `snapshot.json:37-45,131-145,197-203` lists `api/src/middleware/auth.ts`, `api/src/routes/documents.ts`, `api/src/routes/transactions.ts`, `dashboard/src/hooks/useTxBuilder.ts`, and `legacyvault/programs/legacyvault/src/lib.rs`.
- Body-inspected dependency surface: `api/package.json:23-41` includes `@prisma/client`, `firebase-admin`, `jsonwebtoken`, `arweave`, `resend`, and `twilio` ([immutable anchor](https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/fccb21f183e68d4ccdcb0b751f00c73c6f6736d3/api/package.json#L23-L41))

1. Write explicit invariants for signer thresholds, unlock delays, beneficiary changes, document access, replay prevention, and upgrade authority.
2. Inspect and harden the tree-listed contract/API/dashboard enforcement points at source-body level, distinguishing proven controls from assumptions.
3. Add adversarial tests with disposable keys and synthetic documents for early unlock, wrong signer, replayed action, cross-owner reads, and mismatched transaction intent.

**Expected deliverable:** reviewed threat model, invariant list, findings log, and landed negative-test plan against the actual enforcement bodies.  
**Verification procedure:** deliberately remove one signer/auth/object-ownership check in an isolated mutation and confirm the targeted negative test fails.  
**Definition of done:**
- [ ] Every asset-moving and document-reading path has a named authorization rule.
- [ ] At least one deliberately broken signer/authorization path is detected by tests.
- [ ] The final record separates verified controls from unresolved owner/runtime risks.

### LV-T3 — Make automation fail honestly

**Linked finding(s):** LV-1, LV-2  
**Prerequisites:** LV-T2 complete.  
**Observed evidence:**
- Body-inspected: `.github/workflows/test.yml:56-153` defines Anchor, API, frontend, and indexer jobs ([immutable anchor](https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/fccb21f183e68d4ccdcb0b751f00c73c6f6736d3/.github/workflows/test.yml#L56-L153))
- Body-inspected: `api/package.json:15`, `dashboard/package.json:6-10`, `indexer/package.json:11`, `legacyvault/package.json:6-8` — current test commands and runners
- Tree-only for later inspection: `snapshot.json:66-70,106-109,207-208` lists API, dashboard, and Anchor test files.

1. Remove `--passWithNoTests` from required suites and enforce explicit test discovery/output so empty suites fail.
2. Add regression coverage for contract invariants, API authorization, indexer duplicate/out-of-order/restart handling, and dashboard transaction-intent display.
3. Freeze toolchain expectations for Solana/Anchor/IDL generation and require candidate builds to prove the generated interface still matches the program surface.

**Expected deliverable:** reproducible CI gate set with non-empty required suites and targeted negative tests.  
**Verification procedure:** in an isolated branch, temporarily empty a required suite and mutate one invariant; both changes must fail the gate for different reasons.  
**Definition of done:**
- [ ] Empty required suites fail CI.
- [ ] At least one broken contract/API behavior is detected by tests.
- [ ] Toolchain and IDL checks are reproducible at the candidate SHA.

### LV-T4 — Release, rollback, and recovery

**Linked finding(s):** preventive requirement from REVIEW sections 4-5  
**Prerequisites:** LV-T3 complete; owner approves deployment accounts, target network, and recovery objectives.  
**Observed evidence:**
- Body-inspected: `api/Dockerfile:1-38` and `indexer/Dockerfile:1-35` define separate container builds ([API anchor](https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/fccb21f183e68d4ccdcb0b751f00c73c6f6736d3/api/Dockerfile#L1-L38), [indexer anchor](https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/fccb21f183e68d4ccdcb0b751f00c73c6f6736d3/indexer/Dockerfile#L1-L35))
- Body-inspected: `.github/workflows/deploy-showcase.yml:21-58` deploys only the showcase site.
- Tree-only for later inspection: `snapshot.json:163,188-189` lists `indexer/prisma/schema.prisma`, `infra/docker-compose.yml`, and `infra/prometheus/prometheus.yml`; bodies were not inspected here.

1. Define versioned release inputs for API, indexer, dashboard, schema changes, and on-chain upgrade authority, including what must be signed or approved.
2. Exercise staging deploy, restart, index replay, and synthetic backup/restore against approved objectives using only non-production keys and data.
3. Record off-chain rollback steps, database restore order, and the explicit limits of on-chain reversibility so operators do not assume chain rollback exists.

**Expected deliverable:** release runbook, recovery runbook, and observed staging evidence pack.  
**Verification procedure:** an independent observer performs a staged restore/replay drill from the runbook and checks resulting state against expected synthetic chain/application records.  
**Definition of done:**
- [ ] Release inputs, approvals, and artifact identities are documented.
- [ ] Restore and replay are observed, not merely planned.
- [ ] On-chain irreversible actions are called out explicitly in operator guidance.

### LV-T5 — Independent acceptance and bounded launch decision

**Linked finding(s):** preventive requirement from REVIEW sections 4-5  
**Prerequisites:** LV-T4 complete; independent reviewers and owner approvers assigned.  
**Observed evidence:**
- Body-inspected: `dashboard/package.json:10-10` — “`vitest run`” ([immutable anchor](https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/fccb21f183e68d4ccdcb0b751f00c73c6f6736d3/dashboard/package.json#L10-L10))
- Tree-only for later inspection: `snapshot.json:110-127,131-145` lists approvals/beneficiaries/documents/unlock/withdraw panels and wallet/auth/tx-builder hooks.

1. Run an independent walkthrough on staging with synthetic users, covering beneficiary changes, delayed unlock warnings, document access, and transaction review before signature.
2. Re-run the contract/security/recovery checks from prior phases with a reviewer who did not author the fixes.
3. Produce a bounded go/no-go memo that records residual risks, owner approvals, and any usage restrictions without claiming legal certification or deployed security guarantees.

**Expected deliverable:** independent acceptance packet and signed owner decision record.  
**Verification procedure:** observer confirms a malicious or mismatched transaction intent is clearly rejectable in the UI flow and that unresolved risks are explicitly documented.  
**Definition of done:**
- [ ] Synthetic users can identify signer, amount, network, and irreversible consequences before approval.
- [ ] Independent reviewer evidence exists for security and recovery, not only author self-attestation.
- [ ] Final launch decision is bounded and does not overclaim legal/security status.

## 3. Task dependency map

| Task | Depends on | Why |
| --- | --- | --- |
| LV-T1 | none | Establishes actual failing baseline, script truth, and trust map |
| LV-T2 | LV-T1 | Security review needs a verified authority/data-flow baseline |
| LV-T3 | LV-T2 | Tests must enforce the invariants and controls identified in T2 |
| LV-T4 | LV-T3 | Release/recovery drills are meaningful only after honest gates exist |
| LV-T5 | LV-T4 | Independent acceptance depends on a working staged release and recovery story |

## 4. Production acceptance checklist

- [ ] Candidate SHA has passing required Anchor/API/dashboard/indexer gates with no empty-suite bypass.
- [ ] Asset-moving and document-access controls have source-body review plus failing negative tests.
- [ ] Upgrade authority, deployment authority, and custody ownership are recorded and approved.
- [ ] Staging restore/replay drill is observed successfully with synthetic data.
- [ ] UI acceptance confirms signer/network/amount/irreversibility are visible before approval.
- [ ] Residual risks and usage restrictions are documented in the final go/no-go memo.

## 5. Changes requiring owner approval

- Solana network choice, custody model, and all signing/upgrade authorities
- Whether the product is positioned only as software support or makes any legal/estate-effectiveness claims
- Document retention, deletion, encryption, and third-party storage/messaging providers
- Recovery objectives, acceptable data loss windows, and staging/production environments
- Any change that affects beneficiary rules, unlock timing, or irreversible asset movement semantics

## 6. Release policy

Release only from a reviewed candidate SHA with passing required gates, recorded approvers, and a staging evidence pack attached. Treat the showcase Pages workflow as separate from transactional release approval. If contract/API/dashboard/indexer changes do not share a compatible release record, hold release until compatibility is re-verified.

## 7. Rollback policy

Rollback off-chain services only to a previously verified artifact set with matching schema/index expectations and an available restore point. Rebuild derived index state from chain data when needed, and verify restored state against synthetic expectations. Do not assume on-chain rollback exists; any contract upgrade or asset movement reversal must be explicitly proven possible before it is named as a rollback path.

## 8. Independent verification rule

Negative tests must fail when signer, authorization, replay, or timing protections are deliberately broken. Test counts are not acceptance criteria. Deployment and restore claims require direct observation and recorded outputs, not job-complete status alone.
