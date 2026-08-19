# Milestones 1489–1498 — Qualification observation contract-integrity v7/privacy/generation hardening

This tranche extends the source-only qualification-observation support contract without changing the authority boundary: **Issue #10 remains the only authoritative real Firefox + Chromium runtime qualification gate.** Repository audits, tests, fixtures, result constructors, generation invariants, and closeout markers are preflight/supporting evidence only.

- **M1489** — Centralized the exact five-source contract-integrity v6 privacy support inventory and 64 KiB/320 KiB source ceilings.
- **M1490** — Descriptor-snapshotted the canonical v6 privacy source-path projection and rejected holes, accessors, extras, and reordering.
- **M1491** — Added the bounded v6 privacy support-surface audit for browser/network/storage, environment/host, timing, subprocess/worker, and dynamic-execution refusal.
- **M1492** — Descriptor-locked the v6 privacy matcher inventory, captured matcher intrinsics, bounded labels/patterns, and removed live `RegExp.prototype.test` dependence.
- **M1493** — Routed v6 privacy success through an exact frozen four-field result constructor with complete five-source evidence and recomputed aggregate bytes.
- **M1494** — Added an exact source-only v6 privacy audit-contract verifier for limits, paths, matcher cardinality, result keys, and the historical M1491 marker.
- **M1495** — Extended cross-generation privacy-contract invariants through v5 with exact 3/4/4/5/5 source cardinalities and aggregate arithmetic.
- **M1496** — Composed contract-integrity v7 from M1486 v6 integrity, M1494 v6 privacy contract, M1495 generation-v3 evidence, and the M1488 prior closeout marker.
- **M1497** — Wired v6 privacy, v6 privacy-contract, generation-v3, and contract-integrity v7 audits into the normal `npm run check` source-only gate before qualification I/O.
- **M1498** — Added the dedicated v7 closeout audit, tranche documentation, ROADMAP progression, closeout regression, and Issue #10 supporting-evidence update.

## Privacy and evidence invariants

The tranche adds no telemetry, analytics, browsing/request-history retention, page/DOM snapshots, retained statistics, timestamps, user/device identifiers, environment/user/host profiling, embedded credentials/tokens, or owned Drop Ads backend behavior. It does not manufacture browser evidence. Any real release qualification still requires exact-head observations in both Firefox and Chromium under Issue #10.
