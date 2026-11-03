# LEGACYVAULTV1.0 review

## 1. Scope and verdict

Repository reviewed: `knarayanareddy/LEGACYVAULTV1.0` at pinned SHA `fccb21f183e68d4ccdcb0b751f00c73c6f6736d3`. Stage: **implementation**. Sampled source bodies in this documentation pass were limited to the README, root/package manifests, `.github/workflows/test.yml`, `.github/workflows/deploy-showcase.yml`, `api/package.json`, `dashboard/package.json`, `indexer/package.json`, `legacyvault/package.json`, `legacyvault/Cargo.toml`, `api/Dockerfile`, and `indexer/Dockerfile`. Tree listings for program/API/dashboard/indexer/infra paths were also inspected through the local snapshot artifact. Program instruction bodies, API route/middleware bodies, dashboard hook/component bodies, Prisma schemas, infra compose content, deployments, wallets, and hosted services were **not** run or validated. Runtime status: **NOT RUN**. See the paired [remediation plan](REMEDIATION_PLAN.md).

Bounded verdict: the sampled evidence supports a multi-component Solana estate-product implementation, not only a marketing site, but it does **not** support production claims for real assets, legal effectiveness, document confidentiality, or operational recovery. The same reviewed SHA shows a failed main test workflow while a showcase-only Pages deploy succeeded.

## 2. Architecture and product boundary

The sampled README states that the project is a Solana-native estate product: `README.md:2` — “`digital estate executor`” with an “`on-chain vault`” and “`multi-party, time-delayed unlock process`” ([immutable anchor](https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/fccb21f183e68d4ccdcb0b751f00c73c6f6736d3/README.md#L2-L2)). The snapshot tree separately lists an Anchor program, API, dashboard, indexer, workers, infra, and a standalone showcase site: `fleet-hardening-review/evidence/LEGACYVAULTV1.0/snapshot.json:30-73,102-188,197-208` — e.g. “`api/src/server.ts`”, “`dashboard/src/hooks/useTxBuilder.ts`”, “`indexer/src/services/eventProcessor.ts`”, “`infra/docker-compose.yml`”, and “`legacyvault/programs/legacyvault/src/lib.rs`”.

The API manifest shows external boundaries for storage, queues, messaging, identity, and chain integration: `api/package.json:17-42` — “`@prisma/client`”, “`bullmq`”, “`firebase-admin`”, “`jsonwebtoken`”, “`resend`”, “`twilio`”, and “`arweave`” ([immutable anchor](https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/fccb21f183e68d4ccdcb0b751f00c73c6f6736d3/api/package.json#L17-L42)). Those dependencies justify privacy/identity/storage caution, but they do not prove that the corresponding controls are correct. Separately, the Pages workflow builds only `./build-legacyvault-showcase-website` (`.github/workflows/deploy-showcase.yml:21-47`) ([immutable anchor](https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/fccb21f183e68d4ccdcb0b751f00c73c6f6736d3/.github/workflows/deploy-showcase.yml#L21-L47)), so showcase deployment evidence is not evidence for the transactional application.

## 3. Findings ledger

### LV-1 — High — historical CI

**Status:** historical CI  
**Impact:** the reviewed SHA does not have a clean evidence trail for core test automation, so shipping confidence for the application stack is materially limited even though the showcase site deployed.  
**Recommended correction:** inspect the failed workflow run, record the actual failing job/step, fix the cause, and require a candidate SHA with successful application-relevant gates before any release decision.

**Evidence**
- `fleet-hardening-review/evidence/LEGACYVAULTV1.0/snapshot.json:316-320` — “`"name": "Test Suite"`”, “`"conclusion": "failure"`”; immutable run URL: <https://github.com/knarayanareddy/LEGACYVAULTV1.0/actions/runs/25729913360>
- `fleet-hardening-review/evidence/LEGACYVAULTV1.0/snapshot.json:309-313` — “`"Deploy Showcase Website to GitHub Pages"`”, “`"conclusion": "success"`”; immutable run URL: <https://github.com/knarayanareddy/LEGACYVAULTV1.0/actions/runs/25729913383>
- `.github/workflows/deploy-showcase.yml:23-23,47-47` — “`working-directory: ./build-legacyvault-showcase-website`” and “`path: './build-legacyvault-showcase-website/dist'`” ([immutable anchor](https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/fccb21f183e68d4ccdcb0b751f00c73c6f6736d3/.github/workflows/deploy-showcase.yml#L23-L47))

### LV-2 — Medium — confirmed static

**Status:** confirmed static  
**Impact:** empty or miswired API/indexer test suites can report success, which weakens regression detection and can hide missing coverage in security-critical flows.  
**Recommended correction:** remove `--passWithNoTests` from required suites, assert non-zero test discovery, and make failed discovery block the pipeline.

**Evidence**
- `api/package.json:14-15` — “`"db:seed": "tsx scripts/init-db.ts"`” and “`"test": "node --experimental-vm-modules ... --passWithNoTests --runInBand"`” ([immutable anchor](https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/fccb21f183e68d4ccdcb0b751f00c73c6f6736d3/api/package.json#L14-L15))
- `indexer/package.json:10-11` — “`"prisma:generate": "prisma generate"`” and “`"test": "jest --passWithNoTests"`” ([immutable anchor](https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/fccb21f183e68d4ccdcb0b751f00c73c6f6736d3/indexer/package.json#L10-L11))

### LV-3 — High — unverified risk

**Status:** unverified risk  
**Impact:** because the sampled evidence describes delayed unlock and inheritance behavior, but not the actual instruction/account logic, real-fund use would carry unresolved risk around signer thresholds, time gates, PDA ownership, replay protection, upgrade control, and asset conservation.  
**Recommended correction:** inspect and test every asset-moving and authority-changing instruction body, define invariants explicitly, and require an independent smart-contract review before any real-asset deployment.

**Evidence**
- `README.md:2-2` — “`digital estate executor`”, “`on-chain vault`”, and “`multi-party, time-delayed unlock process`” ([immutable anchor](https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/fccb21f183e68d4ccdcb0b751f00c73c6f6736d3/README.md#L2-L2))
- `fleet-hardening-review/evidence/LEGACYVAULTV1.0/snapshot.json:197-203` — tree-listed only, not body-inspected: “`legacyvault/programs/legacyvault/src/constants.rs`”, “`.../context.rs`”, “`.../errors.rs`”, “`.../events.rs`”, “`.../lib.rs`”, “`.../state.rs`”; corresponding immutable directory root: <https://github.com/knarayanareddy/LEGACYVAULTV1.0/tree/fccb21f183e68d4ccdcb0b751f00c73c6f6736d3/legacyvault/programs/legacyvault/src>
- `legacyvault/Cargo.toml:7-10` — “`overflow-checks = true`” ([immutable anchor](https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/fccb21f183e68d4ccdcb0b751f00c73c6f6736d3/legacyvault/Cargo.toml#L7-L10)); this is a narrow safety setting, not proof that instruction logic is correct.

### LV-4 — High — unverified risk

**Status:** unverified risk  
**Impact:** the repo layout and dependencies indicate identity, document, and transaction surfaces, but the enforcement points were not body-inspected here. Authentication, object-level authorization, document confidentiality, signature replay handling, and transaction-intent confirmation remain unverified.  
**Recommended correction:** inspect the auth, document, transaction, and wallet-building paths at source-body level; add negative tests for cross-owner access, replay, mismatched signer intent, and unauthorized document retrieval.

**Evidence**
- `fleet-hardening-review/evidence/LEGACYVAULTV1.0/snapshot.json:37-45` — tree-listed only, not body-inspected: “`api/src/middleware/auth.ts`”, “`api/src/routes/auth.ts`”, “`api/src/routes/documents.ts`”, “`api/src/routes/transactions.ts`”, “`api/src/routes/users.ts`”, “`api/src/routes/vaults.ts`”; immutable tree roots: <https://github.com/knarayanareddy/LEGACYVAULTV1.0/tree/fccb21f183e68d4ccdcb0b751f00c73c6f6736d3/api/src/middleware> and <https://github.com/knarayanareddy/LEGACYVAULTV1.0/tree/fccb21f183e68d4ccdcb0b751f00c73c6f6736d3/api/src/routes>
- `fleet-hardening-review/evidence/LEGACYVAULTV1.0/snapshot.json:131-145` — tree-listed only, not body-inspected: “`dashboard/src/hooks/useAuth.tsx`”, “`dashboard/src/hooks/useDocuments.ts`”, “`dashboard/src/hooks/useTxBuilder.ts`”, “`dashboard/src/hooks/useWallet.ts`”; immutable tree root: <https://github.com/knarayanareddy/LEGACYVAULTV1.0/tree/fccb21f183e68d4ccdcb0b751f00c73c6f6736d3/dashboard/src/hooks>
- `api/package.json:23-41` — “`@prisma/client`”, “`firebase-admin`”, “`jsonwebtoken`”, “`arweave`”, “`resend`”, and “`twilio`” ([immutable anchor](https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/fccb21f183e68d4ccdcb0b751f00c73c6f6736d3/api/package.json#L23-L41))

### LV-5 — Medium — confirmed static

**Status:** confirmed static  
**Impact:** the checked-in API manifest points to a seed script path that is not present in the sampled tree, which makes bootstrap/recovery instructions harder to trust and raises drift risk for database setup.  
**Recommended correction:** either commit the referenced file at the declared path, or update the script to the real maintained entry point and document when seeding is permitted.

**Evidence**
- `api/package.json:11-15` — “`"prisma:generate": "prisma generate"`”, “`"prisma:migrate": "prisma migrate dev"`”, “`"prisma:deploy": "prisma migrate deploy"`”, and “`"db:seed": "tsx scripts/init-db.ts"`” ([immutable anchor](https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/fccb21f183e68d4ccdcb0b751f00c73c6f6736d3/api/package.json#L11-L15))
- `fleet-hardening-review/evidence/LEGACYVAULTV1.0/snapshot.json:47-54` — the sampled tree lists only `api/src/scripts/...` entries such as “`api/src/scripts/init-protocol.ts`” and “`api/src/scripts/seed-demo-vault.ts`”; no `api/scripts/init-db.ts` entry appears anywhere in the complete listed tree.

## 4. Five-discipline assessment

- **Correctness/code review:** the reviewed evidence shows an on-chain program and application stack, but instruction bodies and business-rule enforcement were not inspected. `legacyvault/Cargo.toml:7-10` shows “`overflow-checks = true`”, which is beneficial but far short of proving safe inheritance, unlock, or distribution behavior.
- **Automation/testing:** `.github/workflows/test.yml:56-153` defines Anchor, API, frontend, and indexer jobs, and the tree lists API/frontend/program test files in `snapshot.json:66-70,106-109,207-208`; however `api/package.json:15` and `indexer/package.json:11` still permit pass-with-no-tests, and the reviewed SHA has a failed Test Suite run.
- **DevOps/operations:** `api/Dockerfile:1-38` and `indexer/Dockerfile:1-35` support separate containerization, and `deploy-showcase.yml:21-58` supports Pages deployment for the showcase site. `snapshot.json:187-189` also lists `infra/.env.example`, `infra/docker-compose.yml`, and `infra/prometheus/prometheus.yml`, but those bodies were not inspected, so migration, replay, backup, and restore claims remain unverified.
- **OWASP/security:** the tree and API dependencies support concern for auth, authorization, secret handling, messaging, and document storage, but the sampled pass did not inspect enforcement bodies. No deployed security claim is justified from manifests alone.
- **UI/UX/accessibility:** `dashboard/package.json:6-10` exposes a `vitest run` path, and `snapshot.json:110-127` lists signer- and asset-related UI panels/modals such as “`ApprovalsPanel.tsx`”, “`DocumentsPanel.tsx`”, “`InitiateUnlockModal.tsx`”, and “`WithdrawModal.tsx`”. Those bodies were not inspected or exercised, so clarity of irreversible actions, accessibility, and error recovery remain open.

## 5. Production blockers and owner questions

Blocked for any real-fund or sensitive-document production use until the owner answers and evidences at least these points:

1. Which Solana network, custody model, and upgrade/signing authorities are intended, and who controls each key?
2. Is the product meant as software-assisted estate planning only, or is any legal effectiveness being claimed? This review does **not** certify estate, probate, executor, or jurisdictional validity.
3. What document classes are stored, where are they stored, what encryption/retention/deletion rules apply, and which vendors/accounts hold the data?
4. What is the release path for API, indexer, dashboard, and on-chain components, and what rollback/recovery objectives are required for each?
5. What staging environment, synthetic datasets, and independent reviewers will be used to validate unlock timing, beneficiary changes, and recovery?

## 6. Evidence inventory and limitations

**Body-inspected ranges in this pass**

- `fleet-hardening-review/evidence/LEGACYVAULTV1.0/numbered-sources/README.md.txt:1-2`
- `fleet-hardening-review/evidence/LEGACYVAULTV1.0/numbered-sources/package.json.txt:1-7`
- `fleet-hardening-review/evidence/LEGACYVAULTV1.0/numbered-sources/api/package.json.txt:1-59`
- `fleet-hardening-review/evidence/LEGACYVAULTV1.0/numbered-sources/dashboard/package.json.txt:1-50`
- `fleet-hardening-review/evidence/LEGACYVAULTV1.0/numbered-sources/indexer/package.json.txt:1-35`
- `fleet-hardening-review/evidence/LEGACYVAULTV1.0/numbered-sources/legacyvault/package.json.txt:1-24`
- `fleet-hardening-review/evidence/LEGACYVAULTV1.0/numbered-sources/legacyvault/Cargo.toml.txt:1-21`
- `fleet-hardening-review/evidence/LEGACYVAULTV1.0/numbered-sources/.github/workflows/test.yml.txt:1-153`
- `fleet-hardening-review/evidence/LEGACYVAULTV1.0/numbered-sources/.github/workflows/deploy-showcase.yml.txt:1-58`
- `fleet-hardening-review/evidence/LEGACYVAULTV1.0/numbered-sources/api/Dockerfile.txt:1-38`
- `fleet-hardening-review/evidence/LEGACYVAULTV1.0/numbered-sources/indexer/Dockerfile.txt:1-35`
- `fleet-hardening-review/evidence/LEGACYVAULTV1.0/snapshot.json:1-331`

**Tree-only, not body-inspected in this pass**

- API route/middleware/service files under `api/src/**`
- dashboard component/hook/provider files under `dashboard/src/**`
- indexer handler/service/job files under `indexer/src/**`
- program files under `legacyvault/programs/legacyvault/src/**`
- Prisma schemas and `infra/docker-compose.yml`

**Explicit limitations**

- No code execution, install, build, test replay, wallet use, chain interaction, deployment check, restore drill, secret access, or account access was performed.
- Historical workflow conclusions were taken from the local evidence snapshot; failure root cause was not re-fetched from GitHub logs in this pass.
- This document does not claim production readiness, legal certification, smart-contract audit completion, or deployed security effectiveness.
