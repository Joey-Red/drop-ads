# Milestones 1709–1718 — Qualification observation v9 support-contract integrity-v20 hardening

This tranche remains **source-only supporting evidence**. It does not create, infer, or replace real Firefox or Chromium runtime observations. Issue #10 remains the sole browser-qualification authority for the exact packaged head.

## M1709 — Centralize integrity-v19 privacy source contract

Centralized the exact six-source M1706 privacy-review inventory, 64 KiB per-source ceiling, and 384 KiB aggregate ceiling behind an immutable descriptor-safe source contract.

## M1710 — Descriptor-snapshot integrity-v19 privacy matchers

Hardened the twenty forbidden-surface matchers into an exact frozen inventory that rejects holes, accessors, extras, duplicate labels, stateful regular expressions, and oversized labels/patterns while executing only through captured RegExp primitives.

## M1711 — Exact integrity-v19 privacy evidence result

Required successful privacy review to publish complete ordered `{ path, bytes }` evidence for all six sources through an exact frozen four-field result. Aggregate bytes are recomputed rather than trusted.

## M1712 — Exact integrity-v19 privacy audit contract

Bound the six-source limits, twenty matchers, four result fields, and historical M1706 privacy marker into a dedicated exact source-only contract audit.

## M1713 — Exact integrity-v19 closeout result

Routed historical M1708 closeout publication through an exact frozen four-field constructor while preserving the historical marker and six-source cardinality.

## M1714 — Exact integrity-v19 closeout contract audit

Locked the historical closeout projection to exactly four result fields and six reviewed privacy sources.

## M1715 — Compose support-contract integrity v20

Composed the M1705 integrity-v19 marker, M1712 privacy-contract marker/cardinalities, M1714 closeout-contract marker/cardinalities, and historical M1708 closeout marker into the next frozen integrity-v20 result.

## M1716 — Privacy-audit new integrity-v20 support modules

Added a bounded six-source review over the newly introduced support modules. The review rejects browser/network/storage access, environment or host identity collection, timing collection, subprocess/worker surfaces, and dynamic execution.

## M1717 — Default-test-gate binding

Added a repository-wide test that exercises the M1715 integration and M1716 privacy evidence and locks the normal `npm run check` → `npm run test` → `node --test tests/*.test.js` path.

## M1718 — Source-only closeout

Composed the exact M1715 integrity-v20 and M1716 privacy evidence into a dedicated closeout marker, documented this tranche, advanced the canonical roadmap, and retained Issue #10 as the authoritative browser runtime gate.

## Retained invariants

- No telemetry, analytics, browsing/request history, matched-element history, page/DOM snapshots, retained statistics, timestamps, or user/device identifiers.
- No environment/user/host profiling.
- No embedded GitHub credentials or writable token.
- No owned Drop Ads backend requirement.
- No new extension permissions.
- No remote executable code.
- Connector-created tests/audits are source changes only; they are not represented as locally executed, CI-executed, or browser-executed evidence.
- Real Chromium and Firefox observations must continue to be recorded only through Issue #10 on the exact current packaged head.
