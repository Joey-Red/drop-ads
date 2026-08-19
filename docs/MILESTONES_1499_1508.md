# Milestones 1499–1508 — Qualification observation contract-integrity v8/privacy/generation hardening

This tranche extends source-only qualification support without replacing Issue #10 browser qualification.

- **M1499:** centralized the exact five-source v7 privacy support contract with 64 KiB per-source and 320 KiB aggregate ceilings.
- **M1500:** descriptor-snapshotted the canonical v7 privacy source-path projection.
- **M1501:** added the bounded v7 privacy support-surface audit.
- **M1502:** captured matcher intrinsics and descriptor-validated the exact stateless matcher inventory.
- **M1503:** routed privacy success through an exact frozen five-source result constructor.
- **M1504:** added the exact v7 privacy audit-contract verifier.
- **M1505:** extended cross-generation privacy invariants through v6 with source counts 3/4/4/5/5/5.
- **M1506:** composed contract-integrity v8 from v7 integrity, v7 privacy-contract, six-generation, and prior-closeout evidence.
- **M1507:** wired v7 privacy, generation-v4, and v8 integrity audits into `npm run check` before qualification I/O.
- **M1508:** added a dedicated source-only closeout that requires five reviewed privacy sources and six reviewed privacy-contract generations.

These checks are supporting/preflight evidence only. They do not manufacture, infer, or preserve Chromium/Firefox runtime observations. Any exact-head source/package/qualification-record change still invalidates prior browser observations under Issue #10.

Privacy invariants remain unchanged: no telemetry, analytics, browsing/request history, page/DOM snapshots, retained statistics, timestamps, user/device/environment/host profiling, embedded credentials/tokens, or owned Drop Ads backend behavior.
