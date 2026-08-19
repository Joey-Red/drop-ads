# Milestones 1729–1738 — Qualification observation v9 support-contract integrity-v22 hardening

This tranche continues source-only qualification-support hardening. It does **not** manufacture or substitute Chromium/Firefox observations; Issue #10 remains the sole authoritative real-browser release gate.

- **M1729** centralized the exact six-source integrity-v21 privacy authority with descriptor-safe frozen path snapshots and 64 KiB/source, 384 KiB aggregate ceilings.
- **M1730** hardened the integrity-v21 privacy matcher inventory into an exact frozen 20-matcher descriptor snapshot with bounded labels/patterns and captured `RegExp.prototype.test` execution.
- **M1731** made integrity-v21 privacy success publish through an exact four-field frozen evidence result containing complete ordered `{ path, bytes }` evidence.
- **M1732** locked the integrity-v21 privacy surface into an exact 6-source / 20-matcher / 4-result-field audit contract while preserving the historical M1726 marker.
- **M1733** routed the historical integrity-v21 closeout through an exact frozen four-field constructor without changing its M1728 marker.
- **M1734** locked the integrity-v21 closeout projection into an exact four-field / six-source closeout contract.
- **M1735** composed support-contract integrity v22 from exact integrity-v21 integration, privacy-contract, closeout-contract, and historical closeout evidence.
- **M1736** added a bounded six-source privacy review over the newly introduced integrity-v22 support modules.
- **M1737** bound integrity-v22 integration/privacy evidence to the repository's default test/check path.
- **M1738** closes the tranche with a dedicated source-only integrity-v22 closeout and regression binding documentation, ROADMAP advancement, the default gate, and Issue #10 authority.

## Retained invariants

- No telemetry, analytics, browsing/request history, matched-element history, DOM/page snapshots, retained statistics/counts, timestamps, user/device/environment identifiers, or host profiling.
- No owned/custom Drop Ads backend and no embedded writable GitHub credential or token.
- No new extension permissions and no remote executable code.
- Third-party list input remains hostile declarative data and cannot become executable support code.
- Connector-created source/tests/audits are not represented as having run locally, in CI, or in a browser.
- Real Firefox + Chromium runtime qualification remains exclusively Issue #10 on an exact current head/package identity.
