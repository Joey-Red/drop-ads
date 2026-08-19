# Milestones 1559–1568 — Qualification observation v9 support-contract integrity-v5 hardening

This tranche remains source-only supporting evidence. It does not create, infer, or substitute for real Firefox/Chromium observations. Issue #10 remains the sole exact-head browser qualification gate.

- **M1559:** centralized the exact six-source integrity-v4 privacy path/byte contract with descriptor-safe snapshotting and 64 KiB per-source / 384 KiB aggregate ceilings.
- **M1560:** replaced the ad-hoc forbidden-surface inventory with a frozen descriptor-safe 20-matcher contract using captured inspection and RegExp intrinsics.
- **M1561:** routed integrity-v4 privacy success through an exact four-field result constructor carrying complete ordered `{ path, bytes }` evidence.
- **M1562:** added an exact source-only contract audit for the six-source limits/path projection, 20 matcher count, four-field result surface, and historical M1556 marker.
- **M1563:** routed the historical M1558 integrity-v4 closeout through an exact four-field result constructor.
- **M1564:** added an exact source-only contract audit for the M1563 closeout result and six-source privacy cardinality.
- **M1565:** composed M1555 integrity-v4, M1562 privacy-contract, M1564 closeout-contract, and the historical M1558 closeout into integrity v5.
- **M1566:** added a bounded six-source privacy review over the new M1559–M1565 support modules.
- **M1567:** bound M1565/M1566 evidence to the normal `npm test` path reached by `npm run check`.
- **M1568:** closes the tranche with a dedicated source-only integrity-v5 closeout, documentation, ROADMAP advancement, and an Issue #10 supporting-evidence delta.

Privacy invariants remain unchanged: no telemetry, analytics, browsing/request history, page/DOM snapshots, retained statistics, timestamps, identifiers, environment/user/host profiling, embedded credentials/tokens, or owned Drop Ads backend behavior. Remote executable code remains forbidden.

Connector-created tests and audits are repository changes only; they are not represented as locally executed or browser-qualified. Exact-head Firefox + Chromium qualification must still be recorded through Issue #10.
