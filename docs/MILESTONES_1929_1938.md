# Milestones 1929–1938 — Qualification observation v9 support-contract integrity-v42 hardening

This tranche is source-only hardening. It does not create, infer, or substitute Chromium/Firefox runtime observations. Issue #10 remains the sole authoritative browser qualification gate for an exact packaged head.

- **M1929** centralized the exact six-source integrity-v41 privacy authority behind a frozen descriptor-safe source contract with 64 KiB/source and 384 KiB aggregate ceilings.
- **M1930** hardened the canonical 20 privacy matchers with descriptor-safe tuple admission, captured RegExp inspection/test primitives, duplicate-label refusal, exact `u` flags, and bounded label/pattern bytes.
- **M1931** required historical M1926 privacy success to publish complete frozen ordered `{ path, bytes }` evidence through an exact four-field result constructor.
- **M1932** locked the integrity-v41 privacy surface into an exact contract: 6 sources, 20 matchers, 4 result fields, and the unchanged M1926 marker.
- **M1933** routed historical M1928 closeout through an exact frozen four-field closeout result constructor without changing its marker.
- **M1934** locked that closeout projection into an exact contract with 4 result fields and 6 reviewed privacy sources.
- **M1935** composed support-contract integrity v42 from M1925 integrity-v41, M1932 privacy-contract, M1934 closeout-contract, and historical M1928 closeout evidence.
- **M1936** added a bounded six-source source-only privacy review over the new v42 support modules and retained the canonical 20 forbidden runtime/privacy surfaces.
- **M1937** bound M1935/M1936 evidence to the repository default test/check path without changing package scripts.
- **M1938** composes the integrity-v42 source-only closeout and binds this narrative, ROADMAP advancement, default-gate coverage, and Issue #10 authority.

The tranche adds no telemetry, analytics, browsing/request history, matched-element history, page/DOM snapshots, retained statistics, timestamps, identifiers, user/device/environment/host profiling, embedded writable credentials or tokens, owned Drop Ads backend behavior, new extension permissions, or remote executable code. Connector-created tests and audits are repository evidence only and are not represented as having run locally, in CI, or in either browser.
