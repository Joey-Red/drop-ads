# Milestones 1599–1608 — Qualification observation v9 support-contract integrity-v9 hardening

This tranche hardens source-only qualification support contracts. It does **not** create, infer, or substitute Chromium/Firefox runtime observations; Issue #10 remains the authoritative exact-head browser qualification gate.

## Completed work

- **M1599** centralized the exact six-source integrity-v8 privacy inventory with descriptor-safe frozen path admission and 64 KiB per-source / 384 KiB aggregate ceilings.
- **M1600** replaced the ad-hoc forbidden-surface list with a descriptor-safe frozen 20-matcher contract using captured inspection and RegExp execution primitives.
- **M1601** routed integrity-v8 privacy success through an exact frozen four-field result constructor with ordered `{ path, bytes }` evidence and recomputed cardinality/aggregate values.
- **M1602** added an exact source-only audit contract for the six sources, 20 matchers, four result fields, and historical M1596 privacy marker.
- **M1603** routed the historical M1598 integrity-v8 closeout through an exact frozen four-field result constructor.
- **M1604** added an exact closeout-contract audit locking the M1603 projection, six-source privacy cardinality, and historical M1598 marker.
- **M1605** composed support-contract integrity v9 from M1595 integrity-v8 evidence, M1602 privacy-contract evidence, M1604 closeout-contract evidence, and the historical M1598 closeout marker.
- **M1606** added a bounded source-only privacy audit over the six new integrity-v9 support modules.
- **M1607** bound M1605/M1606 evidence to the existing repository-wide default `npm test` path reached by `npm run check`.
- **M1608** adds the dedicated integrity-v9 source-only closeout, updates canonical roadmap history/numbering, and records the tranche as supporting evidence on Issue #10.

## Preserved product and privacy invariants

- No telemetry, analytics, browsing/request history, matched-element/page/DOM snapshots, retained statistics, timestamps, user/device identifiers, environment/user/host profiling, or cookie-database access.
- No embedded GitHub credentials or tokens and no owned Drop Ads backend.
- No remote executable code; remote lists remain bounded hostile declarative data.
- Network precedence remains personal allow > personal block > shared allow > shared block.
- Cosmetic precedence remains personal allow > personal hide > shared allow > shared hide.
- Firefox and Chromium remain one reviewed product line where practical.

## Qualification boundary

Connector-created or connector-edited tests/audits in this tranche are source changes only. They are not represented as locally executed, packaged, or browser-observed validation. Any real Chromium or Firefox result must be recorded against the exact current clean head/package identities through Issue #10.
