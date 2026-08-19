# Milestones 2029–2038 — Qualification observation v9 support-contract integrity-v52 hardening

This tranche is source-only support hardening for qualification evidence. It does **not** manufacture Chromium or Firefox observations; GitHub Issue #10 remains the sole authoritative runtime qualification gate.

- **M2029:** centralized the exact frozen six-source integrity-v51 privacy source contract and 64 KiB/source / 384 KiB aggregate ceilings.
- **M2030:** descriptor-snapshotted the canonical 20 privacy matchers with bounded labels/patterns and stateless `u` regexes.
- **M2031:** published integrity-v51 privacy success only through an exact frozen four-field result containing complete ordered `{ path, bytes }` evidence.
- **M2032:** locked the integrity-v51 privacy surface into an exact 6/20/4 source/matcher/result contract while preserving historical M2026 marker identity.
- **M2033:** routed historical M2028 integrity-v51 closeout through an exact four-field frozen result constructor.
- **M2034:** locked the integrity-v51 closeout projection into an exact 4/6 closeout contract while preserving the M2028 marker.
- **M2035:** composed support-contract integrity v52 from the completed v51 integration, privacy contract, closeout contract, and historical closeout marker.
- **M2036:** privacy-reviewed exactly the six newly introduced v51/v52 support modules under bounded source work and the canonical forbidden-surface policy.
- **M2037:** bound integrity-v52 integration/privacy evidence to the repository default `npm test`/`npm run check` path without changing package scripts.
- **M2038:** added a dedicated source-only integrity-v52 closeout and advanced the canonical roadmap.

## Preserved boundaries

- Zero telemetry, analytics, browsing/request history, matched-element history, DOM/page snapshots, retained statistics/counts, timestamps, identifiers, or user/device/environment profiling.
- No owned Drop Ads backend, embedded credentials/tokens, new extension permissions, or remote executable code.
- Connector-created tests and audits are repository evidence only and are not represented as executed local CI/browser validation.
- Real Firefox + Chromium qualification remains Issue #10-only and must be repeated on the exact packaged head whenever source/package identity changes.
