# LegacyVault review

## Scope and verdict

Multi-component implementation at `fccb21f183e68d4ccdcb0b751f00c73c6f6736d3`. Snapshot review covers the README, component manifests, two workflows and API/indexer Dockerfiles; on-chain program, API authentication and routes, indexer processing and dashboard implementations were not inspected. No program, test, wallet, deployment or transaction was run. This is not a smart-contract audit. [Plan](REMEDIATION_PLAN.md).

## Architecture and product boundary

The README describes a Solana estate executor with a multi-party delayed unlock ([README.md:1-2](https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/fccb21f183e68d4ccdcb0b751f00c73c6f6736d3/README.md#L1-L2)). The tree separately identifies an Anchor program, API, event indexer, dashboard, workers and a showcase site. API dependencies include Solana, Prisma, Redis, messaging and Arweave ([api/package.json:17-42](https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/fccb21f183e68d4ccdcb0b751f00c73c6f6736d3/api/package.json#L17-L42)); actual integration and security properties are not established by dependencies. The showcase deployment is not the transactional application.

## Findings

- **LV-1 — High, historical CI:** [Test Suite run 25729913360](https://github.com/knarayanareddy/LEGACYVAULTV1.0/actions/runs/25729913360) failed on the reviewed SHA. Failure details were not included in the snapshot; diagnose the actual step before making causal claims. The same-SHA [showcase deployment](https://github.com/knarayanareddy/LEGACYVAULTV1.0/actions/runs/25729913383) succeeded, but only covers the website.
- **LV-2 — Medium, confirmed static:** API and indexer test scripts use `--passWithNoTests` ([api/package.json:15](https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/fccb21f183e68d4ccdcb0b751f00c73c6f6736d3/api/package.json#L15), [indexer/package.json:11](https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/fccb21f183e68d4ccdcb0b751f00c73c6f6736d3/indexer/package.json#L11)). An empty or misconfigured suite can report success; remove this bypass for required suites and assert discovered tests.
- **LV-3 — High, unverified risk:** the product handles timed unlocks and asset distribution, but the program and account constraints were not sampled. Guardian authority, replay, timing, PDA ownership, upgrade authority and asset conservation need independent adversarial smart-contract review before any real funds.
- **LV-4 — High, unverified risk:** the API tree contains auth, document and transaction routes, while the dashboard has wallet hooks. Authentication, object-level authorization, document confidentiality, signature replay and transaction intent verification remain uninspected. Do not use real estate documents or credentials until verified.
- **LV-5 — Medium, confirmed static:** the API seed script points to `scripts/init-db.ts` ([api/package.json:11-15](https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/fccb21f183e68d4ccdcb0b751f00c73c6f6736d3/api/package.json#L11-L15)); that path is absent from the complete listed tree. Confirm whether it is generated externally or fix the documented script; it was not run.

## Five disciplines

- **Correctness:** on-chain invariants, indexer replay/reorg handling, transaction construction and API consistency remain unverified. The Anchor manifest enables overflow checks in release ([Cargo.toml:7-10](https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/fccb21f183e68d4ccdcb0b751f00c73c6f6736d3/legacyvault/Cargo.toml#L7-L10)); that is not proof of correct distribution.
- **Automation:** Anchor, API and dashboard test scripts exist; LV-1 and LV-2 limit confidence. CI installs a remote Solana installer and patches an IDL ([test.yml:23-25,44-54](https://github.com/knarayanareddy/LEGACYVAULTV1.0/blob/fccb21f183e68d4ccdcb0b751f00c73c6f6736d3/.github/workflows/test.yml#L23-L54)); tool provenance and generated-interface correctness require review.
- **DevOps:** separate API/indexer images and showcase deployment exist. Database migration, queue recovery, chain indexing, immutable releases, signing and restore are unverified.
- **OWASP:** identity and object authorization, input injection, secrets, dependency integrity and sensitive document protection need end-to-end review. A keypair-generating CI step is visible, but no key material was inspected or reproduced.
- **UI/UX:** dashboard wallet, beneficiaries and transaction panels exist in the tree; accessibility, signer clarity, irreversible-action warnings and error recovery were not tested. The showcase site is not evidence for dashboard usability.

## Owner decisions and limits

Owner must approve threat model, chain/network, upgrade and signing authorities, custody, legal/compliance review, document retention, deployment and recovery objectives. Real assets are blocked pending independent contract review and adversarial tests. Snapshot evidence: README 1-2; root, API, dashboard, indexer, showcase and Anchor manifests; test/showcase workflows; API/indexer Dockerfiles. Other source, test results, deployed contracts, legal validity, external accounts and restore were not examined.
