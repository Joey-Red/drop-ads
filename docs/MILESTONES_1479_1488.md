# Milestones 1479–1488 — Qualification observation contract-integrity v6 privacy/generation hardening

This tranche continues source-only qualification-support hardening. It does **not** create Firefox or Chromium runtime evidence and does not replace Issue #10 as the exact-head browser qualification authority.

- **M1479** centralized the next v5 privacy support-source limits: five exact reviewed modules, 64 KiB per source, 320 KiB aggregate.
- **M1480** made the five-source projection descriptor-safe, frozen, dense, and order-exact.
- **M1481** added bounded privacy-surface scanning over that exact support surface while retaining the historical M1481 success marker.
- **M1482** descriptor-snapshotted the 20 privacy matchers, bounded matcher text, rejected stateful/duplicate patterns, and captured matcher inspection/execution intrinsics.
- **M1483** routed v5 privacy success through one exact frozen four-field result constructor and recomputed source/aggregate evidence.
- **M1484** added an exact source-only v5 privacy audit-contract verifier.
- **M1485** added a new non-mutating generation-v2 audit covering privacy contracts v1–v4 with exact source cardinalities 3/4/4/5.
- **M1486** composed v5 integrity, v5 privacy-contract, generation-v2, and M1478 prior-closeout evidence into exact contract-integrity v6 output.
- **M1487** wired v5 privacy, its contract audit, generation-v2, and v6 into the normal source-only `npm run check` gate before qualification I/O.
- **M1488** composes the v6 integration, exact v5 privacy evidence, and four-generation evidence in one dedicated closeout audit and synchronizes canonical roadmap numbering.

## Retained invariants

Qualification support retains zero telemetry, analytics, browsing/request history, matched-element history, page/DOM snapshots, retained statistics, timestamps, user/device identifiers, environment/user/host profiling, embedded GitHub credentials/tokens, and owned Drop Ads backend behavior. Network/storage/browser APIs, subprocess/worker creation, and dynamic execution remain excluded from the reviewed privacy-support surface.

All connector-created source/tests/audits in this tranche are source-only repository changes. They were not represented as locally executed or as Firefox/Chromium observations. Any new source head invalidates earlier browser qualification evidence; Issue #10 remains authoritative.

`canonical M1488 qualification observation contract-integrity v6 privacy/generation closeout verified`
