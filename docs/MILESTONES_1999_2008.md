# Milestones 1999–2008 — Qualification observation v9 support-contract integrity-v49 hardening

This tranche recursively hardens the source-only qualification-support evidence introduced by integrity-v48. It does not create, infer, or substitute Chromium or Firefox runtime observations. Issue #10 remains the sole authoritative real-browser qualification gate.

## Completed milestones

- **M1999** centralized the exact six-source integrity-v48 privacy-review authority, with descriptor-safe frozen path admission and 64 KiB/source / 384 KiB aggregate ceilings.
- **M2000** descriptor-snapshotted the canonical 20 privacy matchers, rejecting mutable tuples, accessors, extras, duplicate labels, stateful regular expressions, and overlong labels/patterns.
- **M2001** routed historical M1996 privacy success through an exact frozen four-field result containing complete ordered `{ path, bytes }` evidence.
- **M2002** locked the integrity-v48 privacy contract to six sources, 20 matchers, four result fields, and the unchanged historical M1996 marker.
- **M2003** routed historical M1998 closeout success through an exact frozen four-field closeout result constructor.
- **M2004** locked the integrity-v48 closeout projection to four exact result fields, six reviewed privacy sources, and the unchanged M1998 marker.
- **M2005** composed support-contract integrity v49 from the exact v48 integration, privacy-contract, closeout-contract, and historical closeout evidence.
- **M2006** added a bounded six-source source-only privacy audit over the new v49 support modules and refused the canonical browser/network/storage/environment/timing/subprocess/dynamic-execution surfaces.
- **M2007** bound exact v49 integration and privacy evidence to the repository default test/check path without changing package scripts.
- **M2008** closes this source-only tranche with a dedicated v49 closeout and advances the canonical roadmap.

## Retained invariants

- Zero telemetry or analytics.
- No browsing/request history, matched-element history, DOM/page snapshots, retained statistics/counts, timestamps, user/device identifiers, or environment/host profiling.
- No owned Drop Ads backend, embedded writable GitHub token, remote executable code, or new extension permissions.
- Connector-created source/tests/audits are supporting evidence only and are not represented as having run locally, in CI, Chromium, or Firefox.
- Issue #10 remains the sole authority for exact-head real Chromium + Firefox observations.
