# Milestones 1629–1638 — Qualification observation v9 support-contract integrity-v12 hardening

This tranche extends source-only qualification-support integrity without changing the real-browser release authority.

- **M1629** centralized the six-source integrity-v11 privacy inventory and 64 KiB/source, 384 KiB aggregate ceilings in one immutable descriptor-safe contract.
- **M1630** made the 20 forbidden-surface privacy matcher inventory exact, bounded, frozen, descriptor-safe, and dependent on captured inspection/execution intrinsics.
- **M1631** routed integrity-v11 privacy success through a frozen exact four-field result backed by complete ordered `{ path, bytes }` evidence.
- **M1632** added an exact source-only integrity-v11 privacy contract audit for source limits, matcher cardinality, result shape, and the historical M1626 marker.
- **M1633** routed the historical M1628 integrity-v11 closeout through an exact four-field result constructor.
- **M1634** added an exact source-only contract audit for the integrity-v11 closeout result and historical M1628 marker.
- **M1635** composed integrity-v11, privacy-contract, closeout-contract, and prior-closeout evidence into support-contract integrity v12.
- **M1636** added a bounded privacy audit over the six new integrity-v12 support modules.
- **M1637** bound M1635/M1636 evidence to the repository-wide default test gate through the existing `npm run test` path.
- **M1638** adds the dedicated source-only closeout, this tranche record, ROADMAP advancement, and Issue #10 supporting-evidence note.

## Preserved invariants

Issue #10 remains the sole exact-head browser qualification authority. Source tests, audits, markers, docs, deterministic packaging, and generated records are supporting/preflight evidence only and never substitute for real Chromium + Firefox observations on the exact packaged head.

Qualification/runtime tooling continues to prohibit telemetry, analytics, browsing/request history, matched-element or page/DOM history, retained statistics, timestamps, user/device identifiers, environment/user/host profiling, embedded GitHub credentials/tokens, owned Drop Ads backend behavior, and remote executable code.

Connector-created tests/audits in this tranche are not represented as executed locally or in browsers.
