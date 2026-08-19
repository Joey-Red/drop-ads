# Milestones 1649–1658 — Qualification observation v9 support-contract integrity-v14 hardening

This tranche continues source-only qualification-support hardening. It does not create, infer, or substitute Chromium or Firefox observations. Issue #10 remains the sole exact-head browser qualification authority.

- **M1649** centralized the integrity-v13 privacy review's exact six-source inventory and 64 KiB per-source / 384 KiB aggregate limits in a descriptor-safe frozen contract.
- **M1650** hardened the integrity-v13 privacy matcher inventory into an exact frozen 20-matcher descriptor snapshot with bounded labels/patterns and stateless captured `RegExp.prototype.test` execution.
- **M1651** made integrity-v13 privacy success publish only through a frozen exact four-field result containing complete ordered `{ path, bytes }` source evidence.
- **M1652** added an exact privacy audit contract locking six reviewed sources, twenty matchers, four result fields, and the historical M1646 marker.
- **M1653** routed the historical M1648 integrity-v13 closeout through an exact frozen four-field constructor without changing its marker.
- **M1654** added an exact integrity-v13 closeout contract audit locking four result fields, six reviewed privacy sources, and the M1648 marker.
- **M1655** composed support-contract integrity v14 from the M1645 integrity-v13 integration, M1652 privacy contract, M1654 closeout contract, and historical M1648 closeout marker.
- **M1656** bounded a source-only privacy review over the six new integrity-v14 support modules and rejects browser/network/storage, host/environment identity, timing, subprocess/worker, and dynamic-execution surfaces.
- **M1657** bound M1655/M1656 evidence to the normal repository-wide `npm test` path reached by `npm run check`.
- **M1658** closes the tranche with a dedicated source-only closeout, this narrative, ROADMAP advancement, and a supporting-evidence note on Issue #10.

## Retained invariants

- No telemetry, analytics, browsing/request history, matched-element history, page/DOM snapshots, retained statistics, timestamps, user/device identifiers, environment/user/host profiling, embedded credentials/tokens, or owned Drop Ads backend behavior.
- No remote executable code.
- Source-only tests, audits, fixtures, deterministic packages, generated records, and markers are supporting evidence only.
- Connector-created tests/audits in this tranche are not represented as locally executed, CI-executed, or browser-qualified.
- Real Chromium and Firefox qualification must be recorded against the exact current head through Issue #10.
