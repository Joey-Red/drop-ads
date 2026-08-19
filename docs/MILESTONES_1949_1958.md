# Milestones 1949–1958 — Qualification observation v9 support-contract integrity-v44 hardening

This tranche continues source-only qualification-support hardening. It does **not** create or substitute for real Chromium or Firefox runtime observations. Issue #10 remains the sole authoritative cross-browser runtime qualification gate.

- **M1949** centralized the exact six-source integrity-v43 privacy authority with immutable descriptor-safe ordering and 64 KiB/source / 384 KiB aggregate ceilings.
- **M1950** hardened the canonical 20 privacy matchers with descriptor-safe tuple admission, captured RegExp execution, duplicate/stateful rejection, and bounded label/pattern bytes.
- **M1951** required complete ordered `{ path, bytes }` privacy evidence and exact four-field result publication.
- **M1952** locked the integrity-v43 privacy contract to 6 sources, 20 matchers, 4 result fields, and the historical M1946 marker.
- **M1953** routed the historical M1948 closeout through an exact frozen four-field result constructor.
- **M1954** locked that closeout projection to four exact fields and six reviewed privacy sources.
- **M1955** composed support-contract integrity v44 from the prior integration, privacy contract, closeout contract, and historical closeout markers.
- **M1956** reviewed exactly the six new v44 support modules under bounded source-only privacy scanning.
- **M1957** bound the v44 integration/privacy evidence to the repository's default `npm test` / `npm run check` gate.
- **M1958** closes the tranche with an exact v44 source-only closeout and ROADMAP advancement.

## Retained invariants

- No telemetry, analytics, browsing/request history, matched-element history, DOM/page snapshots, retained statistics, timestamps, identifiers, or environment/user/host profiling.
- No embedded writable GitHub credentials, owned Drop Ads backend, new extension permissions, or remote executable code.
- Connector-created tests/audits are repository evidence only and are not represented as executed locally, in GitHub Actions, or in browsers.
- Real Firefox + Chromium qualification remains Issue #10 and must be repeated on the exact current head whenever source/package identity changes.
