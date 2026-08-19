# Milestones 1509–1518 — Qualification observation contract-integrity v9/privacy/generation hardening

This tranche extends the source-only qualification-observation support boundary. It does **not** create, infer, or replace real Firefox or Chromium observations. Issue #10 remains the authoritative exact-head browser-runtime qualification gate.

- **M1509:** centralized the exact five-source v8 privacy support inventory and 64 KiB/source, 320 KiB aggregate ceilings.
- **M1510:** made the five-source path projection descriptor-safe, frozen, dense, and exact-order.
- **M1511:** added bounded v8 support-surface privacy scanning for browser/network/storage, host/environment identity, timing, subprocess/worker, and dynamic-execution surfaces.
- **M1512:** descriptor-snapshotted privacy matchers, bounded matcher text, rejected stateful patterns/duplicates, and captured matching/reflection intrinsics.
- **M1513:** routed v8 privacy success through an exact frozen four-field result constructor with recomputed source cardinality and aggregate bytes.
- **M1514:** added an exact source-only v8 privacy contract audit locking limits, paths, matcher cardinality, result keys, and the historical M1511 marker.
- **M1515:** extended cross-generation privacy-contract invariants through v7 with exact 3/4/4/5/5/5/5 source cardinalities.
- **M1516:** composed contract-integrity v9 from v8 integrity, the v8 privacy contract, seven-generation evidence, and the M1508 closeout marker.
- **M1517:** wired v8 privacy, its contract audit, generation-v5, and v9 integration into the normal source-only `npm run check` chain before qualification I/O.
- **M1518:** added the dedicated v9 closeout, this tranche narrative, ROADMAP progression, and Issue #10 supporting-evidence update.

## Privacy and authority invariants

Qualification support remains local and source-only. It must not add telemetry, analytics, browsing/request history, page or DOM snapshots, retained statistics, timestamps, user/device identifiers, environment/user/host profiling, embedded credentials or GitHub tokens, or an owned Drop Ads backend.

Repository tests, audits, deterministic builds, generated records, and source-only markers are preflight/supporting evidence only. Real qualification still requires exact-head observations in both Firefox and Chromium through Issue #10. Any source or qualification artifact change invalidates older browser evidence and requires qualification on the new exact head.
