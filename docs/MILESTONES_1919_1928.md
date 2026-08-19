# Milestones 1919–1928 — Qualification observation v9 support-contract integrity-v41 hardening

This tranche continues source-only qualification-support hardening. It does not create, infer, or replace real Firefox/Chromium observations; Issue #10 remains the sole runtime qualification authority.

## M1919 — Integrity-v40 privacy source contract

Centralized the exact six-source M1916 privacy-review authority with immutable descriptor-safe path admission, a 64 KiB per-source ceiling, and a 384 KiB aggregate ceiling.

## M1920 — Integrity-v40 privacy matcher snapshot

Replaced ad-hoc matcher consumption with a frozen descriptor-snapshotted 20-matcher inventory. Matcher labels and pattern text are bounded; holes, accessors, duplicate labels, non-RegExp values, and stateful/global/sticky patterns fail closed.

## M1921 — Exact integrity-v40 privacy result

Privacy success now publishes complete ordered `{ path, bytes }` evidence through an exact four-field frozen result. Aggregate bytes are recomputed rather than trusted.

## M1922 — Integrity-v40 privacy contract audit

Locked the privacy contract to six sources, 64 KiB/source, 384 KiB aggregate, 20 matchers, four result fields, and the unchanged historical M1916 privacy marker.

## M1923 — Exact integrity-v40 closeout result

Historical M1918 closeout evidence now publishes through an exact frozen four-field constructor binding the integrity marker, privacy marker, six reviewed privacy sources, and historical closeout marker.

## M1924 — Integrity-v40 closeout contract audit

Locked the closeout projection to four exact result fields and six reviewed privacy sources while preserving the historical M1918 marker.

## M1925 — Support-contract integrity v41

Composed M1915 integrity-v40 integration evidence, M1922 privacy-contract evidence, M1924 closeout-contract evidence, and the historical M1918 closeout into the exact M1925 integrity-v41 result.

## M1926 — Integrity-v41 privacy review

Added a bounded six-source source-only privacy review over the new v40 support contracts and v41 integration audit. It rejects browser/network/storage APIs, environment or host identity, timing collection, subprocess/worker modules, and dynamic execution surfaces.

## M1927 — Default test-gate binding

Added a default-gated regression that exercises M1925 and M1926, verifies six reviewed privacy sources, and locks the existing repository test/check wiring without adding package scripts.

## M1928 — Source-only closeout

Composed exact M1925 integrity-v41 and M1926 privacy evidence into the M1928 closeout, bound this narrative and ROADMAP advancement through regression coverage, and kept Issue #10 open as the only authority for real browser observations.

## Retained invariants

Drop Ads retains zero telemetry, analytics, browsing/request history, matched-element history, page/DOM snapshots, retained statistics, timestamps, identifiers, user/device/environment/host profiling, embedded writable credentials/tokens, or owned backend behavior. No new extension permissions or remote executable code are introduced by this tranche.
