# Milestones 1589–1598 — Qualification observation v9 support-contract integrity-v8 hardening

This tranche hardens source-only qualification support contracts. It does **not** create or replace real Firefox/Chromium observations; Issue #10 remains the sole exact-head browser qualification authority.

- **M1589** centralized the exact six-source integrity-v7 privacy inventory and 64 KiB/source, 384 KiB aggregate limits in a descriptor-safe contract.
- **M1590** descriptor-snapshotted the canonical 20 forbidden-surface matchers and captured their inspection/execution intrinsics.
- **M1591** routed privacy success through an exact frozen four-field result carrying complete ordered `{ path, bytes }` evidence.
- **M1592** added an exact source-only privacy audit-contract check over limits, source order, matcher cardinality, result keys, and the historical M1586 marker.
- **M1593** routed the historical M1588 integrity-v7 closeout through an exact frozen four-field result constructor.
- **M1594** added an exact source-only contract audit for that closeout result and historical marker.
- **M1595** composed support-contract integrity v8 from M1585 integrity-v7, M1592 privacy-contract, M1594 closeout-contract, and M1588 prior-closeout evidence.
- **M1596** added bounded privacy scanning over the six newly introduced integrity-v8 support modules.
- **M1597** bound M1595/M1596 evidence to the repository-wide default test path by regression-locking `npm run check` → `npm run test` → `tests/*.test.js`.
- **M1598** adds the dedicated source-only closeout, this tranche record, ROADMAP advancement, and an Issue #10 supporting-evidence delta.

## Retained invariants

- Zero telemetry, analytics, browsing/request history, matched-element history, DOM/page snapshots, retained statistics, timestamps, identifiers, user/device/host/environment profiling, or browsing-derived qualification state.
- No embedded credentials or GitHub tokens and no owned Drop Ads backend requirement.
- No remote executable code; remote material remains bounded declarative data.
- Repository tests/audits are preflight/supporting evidence only. They never manufacture browser observations or qualify a changed source head.
- Any source/package/qualification-record identity change invalidates prior exact-head browser observations; qualification must be repeated through Issue #10.

Connector-created tests/audits in this tranche are not represented as having been executed locally or in browsers.
