# Milestones 1679–1688 — Qualification observation v9 support-contract integrity-v17 hardening

This tranche continues source-only hardening of the qualification-observation support contracts. It does **not** create, infer, or substitute Chromium or Firefox runtime observations. Issue #10 remains the sole authority for real exact-head browser qualification.

## Completed work

- **M1679** centralized the exact six-source integrity-v16 privacy-review authority with immutable descriptor-safe source paths and 64 KiB per-source / 384 KiB aggregate ceilings.
- **M1680** descriptor-snapshotted the canonical 20 privacy matchers, rejecting holes, accessors, extras, duplicate labels, stateful regular expressions, and oversized labels/patterns while using captured matching primitives.
- **M1681** made integrity-v16 privacy success publish through an exact frozen four-field result backed by ordered `{ path, bytes }` evidence and recomputed aggregate bytes.
- **M1682** locked the six-source, 20-matcher, four-result-field integrity-v16 privacy audit contract and historical M1676 marker.
- **M1683** routed the historical M1678 integrity-v16 closeout through an exact frozen four-field result constructor without changing its marker.
- **M1684** locked the integrity-v16 closeout projection, six-source privacy cardinality, and historical M1678 marker into an exact source-only contract audit.
- **M1685** composed support-contract integrity v17 from exact integrity-v16 integration, privacy-contract, closeout-contract, and prior-closeout evidence.
- **M1686** added a bounded source-only privacy review over the six new integrity-v17 support modules, rejecting browser/network/storage, environment/host identity, timing, subprocess/worker, and dynamic-execution surfaces.
- **M1687** bound integrity-v17 integration/privacy evidence to the repository-wide default test path while preserving the existing `npm test` contract.
- **M1688** closes the tranche with a dedicated source-only composition and regression coverage for the tranche narrative, roadmap advancement, default-gate binding, and Issue #10 authority.

## Preserved invariants

- Zero telemetry, analytics, browsing/request history, matched-element history, page/DOM snapshots, retained statistics, timestamps, or identifiers.
- No owned Drop Ads backend, embedded writable GitHub token, or remote executable code.
- No new browser permissions or runtime observation surfaces.
- Source-only audits and connector-created regressions are supporting evidence only and are not represented as executed local/browser qualification.
- Real Chromium + Firefox observations must be recorded against the exact current head through Issue #10; any source/package identity change invalidates older observations.
