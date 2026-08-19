# Milestones 1569–1578 — Qualification observation v9 support-contract integrity-v6 hardening

This tranche is **source-only qualification support**. It does not create, infer, substitute, or carry forward Firefox/Chromium browser observations. Issue #10 remains the sole exact-head runtime qualification gate.

## Completed milestones

- **M1569** centralized the six-source integrity-v5 privacy path/byte contract with exact canonical ordering and 64 KiB per-source / 384 KiB aggregate ceilings.
- **M1570** descriptor-hardened the 20-entry forbidden-surface matcher inventory and captured matcher inspection/execution intrinsics.
- **M1571** published M1566 privacy success through an exact frozen four-field result with complete ordered `{ path, bytes }` evidence.
- **M1572** added an exact source-only audit contract for source limits, matcher cardinality, result keys, and the historical M1566 marker.
- **M1573** routed the historical M1568 integrity-v5 closeout through an exact frozen four-field constructor.
- **M1574** added an exact source-only contract audit for the integrity-v5 closeout surface and historical M1568 marker.
- **M1575** composed integrity-v5, privacy-contract, closeout-contract, and prior-closeout evidence into support-contract integrity v6.
- **M1576** added a bounded privacy scan over the six new M1569–M1575 support modules.
- **M1577** bound M1575/M1576 evidence to the repository-wide default `npm test` path reached by `npm run check`.
- **M1578** closes the tranche with one source-only composition marker, documentation, ROADMAP advancement, and supporting-evidence linkage to Issue #10.

## Privacy and release invariants

Qualification/runtime tooling retains **zero telemetry or tracking**: no browsing/request history, page/DOM snapshots, retained statistics, timestamps, identifiers, environment/user/host profiling, embedded credentials/tokens, or owned Drop Ads backend behavior. Remote executable code remains forbidden.

Repository audits, tests, fixtures, deterministic packages, source-only markers, and this document are supporting/preflight evidence only. Real Chromium and Firefox observations must be recorded against the exact current source/package head in Issue #10; any source or package identity change invalidates earlier browser observations.

Connector-created tests and audits in this tranche are not represented as executed locally or in browsers.
