# Milestones 1939–1948 — Qualification observation v9 support-contract integrity-v43 hardening

This tranche continues source-only qualification-support hardening. It does **not** create, infer, or substitute Chromium or Firefox runtime observations; Issue #10 remains the sole authoritative browser qualification gate.

## M1939 — integrity-v42 privacy source contract

Centralized the exact six-source authority used by historical M1936 privacy review, with descriptor-safe frozen ordering and 64 KiB/source plus 384 KiB aggregate ceilings.

## M1940 — integrity-v42 privacy matcher snapshot

Locked the canonical 20 forbidden-source matchers behind descriptor-safe frozen tuple validation, duplicate-label rejection, stateless `u` RegExp requirements, and bounded label/pattern byte lengths.

## M1941 — exact integrity-v42 privacy result

Made historical M1936 privacy success publish through an exact frozen four-field result containing complete ordered `{ path, bytes }` evidence, reviewed-source cardinality, recomputed aggregate bytes, and the unchanged historical marker.

## M1942 — integrity-v42 privacy contract audit

Bound six sources, 64 KiB/source, 384 KiB aggregate, 20 matchers, four result fields, and the historical M1936 marker into one exact source-only privacy contract.

## M1943 — exact integrity-v42 closeout result

Routed historical M1938 closeout through an exact frozen four-field constructor while preserving its marker and six-source privacy cardinality.

## M1944 — integrity-v42 closeout contract audit

Locked the exact four-field closeout projection, six-source privacy cardinality, and historical M1938 closeout marker.

## M1945 — support-contract integrity v43

Composed M1935 integrity-v42 evidence with the M1942 privacy contract, M1944 closeout contract, and historical M1938 closeout marker. Cardinalities remain privacy 6/20/4 and closeout 4/6.

## M1946 — bounded integrity-v43 privacy review

Reviews exactly the six new support modules introduced by M1939–M1945 under 64 KiB/source and 384 KiB aggregate ceilings, rejecting the canonical browser/network/storage, host/environment identity, timing, subprocess/worker, and dynamic-execution source surfaces.

## M1947 — default-test-gate binding

Binds exact M1945 integrity-v43 and M1946 privacy evidence to the repository-wide default test path and verifies that `npm run check` includes `npm run test` and `npm test` remains `node --test tests/*.test.js`.

## M1948 — source-only closeout

Composes exact M1945 integrity-v43 and M1946 six-source privacy evidence into the canonical closeout marker:

`canonical M1948 qualification observation contract-integrity v9 support contract integrity-v43 closeout verified`

## Retained invariants

- Issue #10 remains the sole authority for real Firefox + Chromium runtime qualification.
- Source-only audits, tests, fixtures, deterministic packaging, and markers are supporting/preflight evidence only.
- Connector-created tests/audits are not represented as executed locally, in CI, or in browsers.
- Zero telemetry, analytics, browsing/request history, matched-element history, page/DOM snapshots, retained statistics/counts, timestamps, identifiers, user/device/environment/host profiling, or tracking.
- No embedded writable GitHub credential/token and no owned Drop Ads backend.
- No new extension permissions and no remote executable code.
