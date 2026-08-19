# Milestones 1469–1478 — Contract-integrity v5/privacy hardening

This tranche continues source-only qualification-observation hardening. Nothing here is Chromium or Firefox runtime qualification; Issue #10 remains the only authoritative exact-head browser qualification gate.

- **M1469 — Gate contract-integrity v4 in default checks.** The M1465 v4 integration audit became an explicit `npm run check` dependency before qualification I/O.
- **M1470 — Gate cross-generation contract audit in default checks.** The M1466 3/4/4 privacy-contract generation invariant became part of the normal source-only gate.
- **M1471 — Centralize contract-integrity v4 privacy source limits.** One immutable five-source contract owns the 64 KiB per-source and 320 KiB aggregate ceilings.
- **M1472 — Descriptor-snapshot v4 privacy source paths.** The five reviewed source paths are frozen, dense, exact, own-data elements in canonical order.
- **M1473 — Descriptor-snapshot v4 privacy matcher inventory.** The 20 forbidden-surface matchers are exact frozen tuples with bounded labels/patterns and duplicate rejection.
- **M1474 — Capture v4 privacy matcher intrinsics.** Matcher inspection/execution no longer depends on live mutable Array/Object/Reflect/Set/RegExp/Number prototype behavior.
- **M1475 — Exact v4 privacy success constructor.** Complete five-source `{ path, bytes }` evidence is recomputed and published only through one exact frozen result contract while preserving the M1467 marker.
- **M1476 — Exact v4 privacy audit contract.** A dedicated source-only audit locks limits, path projection, matcher count, result keys, and the historical privacy marker.
- **M1477 — Contract-integrity v5 composition.** The historical v4 integrity result, M1476 privacy contract, M1466 generation audit, and M1468 prior closeout marker compose into one exact frozen v5 result.
- **M1478 — Source-only closeout.** The v5 integration and exact five-source v4 privacy evidence compose into `canonical M1478 qualification observation contract-integrity v5 privacy closeout verified`; the v5 audit is wired into the default check gate and ROADMAP advances to M1479.

## Preserved invariants

- No telemetry, analytics, browsing/request history, page/DOM snapshots, retained blocked-request/contribution statistics, timestamps, user/device identifiers, environment/user/host profiling, embedded credentials/tokens, or owned Drop Ads backend behavior.
- Source-only tests/audits/markers are preflight evidence only and never substitute for real exact-head Firefox + Chromium observations.
- Browser evidence remains invalidated by source/build/package identity changes and must be re-recorded only through Issue #10.
