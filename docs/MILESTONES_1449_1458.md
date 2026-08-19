# Milestones 1449–1458 — Qualification observation contract-integrity v3/privacy hardening

This tranche continues source-only hardening around qualification-observation support contracts. It does **not** manufacture Chromium or Firefox observations. Issue #10 remains the only authoritative exact-head browser qualification gate.

## M1449 — Centralize contract-integrity v2 privacy source limits

- Added `tools/qualification-observation-contract-integrity-v2-privacy-contract.mjs`.
- The four reviewed M1447 support sources, 64 KiB per-source ceiling, source count, and 256 KiB aggregate ceiling now have one immutable authority.
- The M1447 audit consumes those shared limits instead of maintaining duplicate path/limit literals.

## M1450 — Descriptor-snapshot v2 privacy source paths

- Added `snapshotQualificationObservationContractIntegrityV2PrivacySourcePaths`.
- The source projection must be a frozen dense four-entry native array with exact own data entries in canonical order.
- Sparse, reordered, accessor-backed, symbolic, or extra-field projections fail closed.

## M1451 — Descriptor-snapshot v2 privacy matcher inventory

- Added `snapshotQualificationObservationContractIntegrityV2PrivacyMatchers` and a canonical matcher count.
- Matchers require a frozen dense array of frozen exact `[label, RegExp]` tuples.
- Matcher count, label bytes, pattern bytes, Unicode/stateless RegExp semantics, tuple descriptors, and duplicate labels are bounded and validated before scan execution.

## M1452 — Capture v2 privacy matcher intrinsics

- Captured Array/Object/Reflect/Set/RegExp/Number primitives at module load.
- Matcher inspection uses captured RegExp getters and duplicate detection uses captured Set methods.
- Privacy scans execute with captured `RegExp.prototype.test` through captured `Reflect.apply`, reducing live prototype-poisoning dependence.

## M1453 — Exact v2 privacy result constructor

- Added `tools/qualification-observation-contract-integrity-v2-privacy-result.mjs`.
- Success requires complete canonical frozen `{ path, bytes }` evidence for all four reviewed sources.
- Source byte counts and aggregate bytes are recomputed under the M1449 ceilings before publication.
- The historical M1447 marker and exact four-key result surface remain stable.

## M1454 — Exact v2 privacy audit contract

- Added `tools/qualification-observation-contract-integrity-v2-privacy-contract-audit.mjs`.
- The source-only audit locks the four-source/64 KiB/256 KiB support contract, canonical path projection, 20 matcher count, exact privacy-result keys, and historical M1447 marker.
- Exact marker: `canonical M1454 qualification observation contract-integrity v2 privacy audit contract verified`.

## M1455 — Contract-integrity v3 composition

- Added `tools/qualification-observation-contract-integrity-v3-audit.mjs`.
- It composes the historical M1445 v2 integrity result with the M1454 v2 privacy contract without widening either historical output.
- Both child markers are consumed through own data descriptors and bound to the M1448 prior closeout marker.
- Exact marker: `canonical M1455 qualification observation contract integrity v3 integrated`.

## M1456 — Default-check integration

- Added npm script `qualification-observation-contract-integrity-v3-audit`.
- `npm run check` now invokes it immediately after the historical v2 integrity gate and before qualification I/O auditing.
- This remains source-only preflight; successful execution cannot substitute for real browser observations.

## M1457 — Privacy audit for new v3 support

- Added `tools/qualification-observation-contract-integrity-v3-privacy-audit.mjs`.
- It reviews the new M1449/M1453/M1454/M1455 support modules under 64 KiB per-source and bounded four-source aggregate reads.
- It rejects browser/network/storage APIs, environment/cwd/host profiling, timestamps/performance collection, network/subprocess/worker modules, dynamic import, eval, and Function construction.
- Exact marker: `canonical M1457 qualification observation contract-integrity v3 privacy surface verified`.

## M1458 — Source-only closeout

- Added `tools/qualification-observation-contract-integrity-v3-closeout.mjs`.
- The closeout composes M1455 contract-integrity-v3 evidence with M1457 bounded privacy evidence and requires the exact four-source review count.
- Exact marker: `canonical M1458 qualification observation contract-integrity v3 privacy closeout verified`.
- ROADMAP advances to M1459 and Issue #10 receives this tranche only as supporting source evidence.

## Retained invariants

- No telemetry, analytics, browsing/request history, matched-element history, page/DOM snapshots, retained blocked-request/contribution statistics, timestamps, or user/device identifiers.
- No environment/user/host profiling, embedded credentials/tokens, or owned Drop Ads backend behavior.
- Connector-created tests/audits are source changes only unless actually executed; this tranche does not claim local test execution.
- Repository tests, deterministic packaging, generated records, fixtures, and source-only audit markers never replace real exact-head Chromium + Firefox observations.
- Any source/package/qualification-record identity change invalidates prior browser evidence and requires Issue #10 qualification on the new exact head.

`canonical M1458 qualification observation contract-integrity v3 privacy closeout verified`
