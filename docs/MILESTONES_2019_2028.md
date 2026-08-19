# Milestones 2019–2028 — Qualification observation v9 support-contract integrity-v51 hardening

This tranche recursively hardens the source-only qualification-support evidence introduced by integrity-v50. It does not create, infer, or substitute Chromium or Firefox runtime observations. Issue #10 remains the sole authoritative real-browser qualification gate.

## Completed milestones

- **M2019** centralized the exact six-source integrity-v50 privacy-review authority, with descriptor-safe frozen path admission and 64 KiB/source / 384 KiB aggregate ceilings.
- **M2020** descriptor-snapshotted the canonical 20 privacy matchers, rejecting mutable tuples, accessors, extras, duplicate labels, stateful regular expressions, and overlong labels/patterns.
- **M2021** routed historical M2016 privacy success through an exact frozen four-field result containing complete ordered `{ path, bytes }` evidence.
- **M2022** locked the integrity-v50 privacy contract to six sources, 20 matchers, four result fields, and the unchanged historical M2016 marker.
- **M2023** routed historical M2018 closeout success through an exact frozen four-field closeout result constructor.
- **M2024** locked the integrity-v50 closeout projection to four exact result fields, six reviewed privacy sources, and the unchanged M2018 marker.
- **M2025** composed support-contract integrity v51 from the exact v50 integration, privacy-contract, closeout-contract, and historical closeout evidence.
- **M2026** added a bounded six-source source-only privacy audit over the new v51 support modules and refused the canonical browser/network/storage/environment/timing/subprocess/dynamic-execution surfaces.
- **M2027** bound exact v51 integration and privacy evidence to the repository default test/check path without changing package scripts.
- **M2028** closes this source-only tranche with a dedicated v51 closeout and advances the canonical roadmap.

## Retained invariants

- Zero telemetry or analytics.
- No browsing/request history, matched-element history, DOM/page snapshots, retained statistics/counts, timestamps, user/device identifiers, or environment/host profiling.
- No owned Drop Ads backend, embedded writable GitHub token, remote executable code, or new extension permissions.
- Connector-created source/tests/audits are supporting evidence only and are not represented as having run locally, in CI, Chromium, or Firefox.
- Issue #10 remains the sole authority for exact-head real Chromium + Firefox observations.
