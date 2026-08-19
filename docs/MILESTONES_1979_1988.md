# Milestones 1979–1988 — Qualification observation v9 support-contract integrity-v47 hardening

This tranche recursively hardens the source-only qualification-support evidence introduced by integrity-v46. It does not create, infer, or substitute Chromium or Firefox runtime observations. Issue #10 remains the sole authoritative real-browser qualification gate.

## Completed milestones

- **M1979** centralized the exact six-source integrity-v46 privacy-review authority, with descriptor-safe frozen path admission and 64 KiB/source / 384 KiB aggregate ceilings.
- **M1980** descriptor-snapshotted the canonical 20 privacy matchers, rejecting mutable tuples, accessors, extras, duplicate labels, stateful regular expressions, and overlong labels/patterns.
- **M1981** routed historical M1976 privacy success through an exact frozen four-field result containing complete ordered `{ path, bytes }` evidence.
- **M1982** locked the integrity-v46 privacy contract to six sources, 20 matchers, four result fields, and the unchanged historical M1976 marker.
- **M1983** routed historical M1978 closeout success through an exact frozen four-field closeout result constructor.
- **M1984** locked the integrity-v46 closeout projection to four exact result fields, six reviewed privacy sources, and the unchanged M1978 marker.
- **M1985** composed support-contract integrity v47 from the exact v46 integration, privacy-contract, closeout-contract, and historical closeout evidence.
- **M1986** added a bounded six-source source-only privacy audit over the new v47 support modules and refused the canonical browser/network/storage/environment/timing/subprocess/dynamic-execution surfaces.
- **M1987** bound exact v47 integration and privacy evidence to the repository default test/check path without changing package scripts.
- **M1988** closes this source-only tranche with a dedicated v47 closeout and advances the canonical roadmap.

## Retained invariants

- Zero telemetry or analytics.
- No browsing/request history, matched-element history, DOM/page snapshots, retained statistics/counts, timestamps, user/device identifiers, or environment/host profiling.
- No owned Drop Ads backend, embedded writable GitHub token, remote executable code, or new extension permissions.
- Connector-created source/tests/audits are supporting evidence only and are not represented as having run locally, in CI, Chromium, or Firefox.
- Issue #10 remains the sole authority for exact-head real Chromium + Firefox observations.
