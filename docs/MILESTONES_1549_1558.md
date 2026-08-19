# Milestones 1549–1558 — Qualification observation v9 support-contract integrity-v4 hardening

This tranche hardens source-only qualification support contracts. It does **not** create Chromium or Firefox runtime observations and does not replace Issue #10.

- **M1549** centralized the exact six-source integrity-v3 privacy source contract and 64 KiB per-source / 384 KiB aggregate ceilings.
- **M1550** descriptor-snapshotted the canonical 20 forbidden-surface privacy matchers and captured inspection/execution intrinsics.
- **M1551** published integrity-v3 privacy success through an exact frozen four-field result with complete ordered `{ path, bytes }` evidence.
- **M1552** added an exact source-only contract audit for the integrity-v3 privacy source, matcher, result, limit, and historical-marker surfaces.
- **M1553** routed the historical M1548 integrity-v3 closeout through an exact frozen four-field result constructor.
- **M1554** added an exact source-only contract audit for the M1553 closeout result and six-source privacy cardinality.
- **M1555** composed integrity-v4 from M1545 integrity-v3, M1552 privacy-contract, M1554 closeout-contract, and the historical M1548 closeout marker.
- **M1556** added a bounded six-source privacy audit over the new M1549–M1555 support modules.
- **M1557** bound M1555/M1556 evidence to the repository-wide `npm test` path reached by `npm run check`.
- **M1558** closes the tranche with a dedicated source-only closeout audit, ROADMAP advancement, regression coverage, and an Issue #10 supporting-evidence update.

## Privacy and release authority

Qualification support remains local and source-only. It retains no telemetry, analytics, browsing/request history, matched-element history, page/DOM snapshots, retained statistics, timestamps, identifiers, environment/user/host profiling, GitHub credentials/tokens, or owned Drop Ads backend behavior.

Issue #10 remains the sole authority for real exact-head Firefox + Chromium runtime qualification. Repository tests, audits, fixtures, deterministic packages, and source-only markers are preflight/supporting evidence only. Connector-created tests/audits in this tranche were not represented as executed locally or in browsers.
