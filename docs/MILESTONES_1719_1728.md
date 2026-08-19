# Milestones 1719–1728 — Qualification observation v9 support-contract integrity-v21 hardening

This tranche remains **source-only supporting evidence**. It does not create, infer, or replace real Firefox or Chromium runtime observations. Issue #10 remains the sole browser-qualification authority for the exact packaged head.

## M1719 — Centralize integrity-v20 privacy source contract

Centralized the exact six-source M1716 privacy-review inventory, 64 KiB per-source ceiling, and 384 KiB aggregate ceiling behind an immutable descriptor-safe source contract.

## M1720 — Descriptor-snapshot integrity-v20 privacy matchers

Hardened the twenty forbidden-surface matchers into an exact frozen inventory that rejects holes, accessors, extras, duplicate labels, stateful regular expressions, and oversized labels/patterns while executing only through captured RegExp primitives.

## M1721 — Exact integrity-v20 privacy evidence result

Required successful privacy review to publish complete ordered `{ path, bytes }` evidence for all six sources through an exact frozen four-field result. Aggregate bytes are recomputed rather than trusted.

## M1722 — Exact integrity-v20 privacy audit contract

Bound the six-source limits, twenty matchers, four result fields, and historical M1716 privacy marker into a dedicated exact source-only contract audit.

## M1723 — Exact integrity-v20 closeout result

Routed historical M1718 closeout publication through an exact frozen four-field constructor while preserving the historical marker and six-source cardinality.

## M1724 — Exact integrity-v20 closeout contract audit

Locked the historical closeout projection to exactly four result fields and six reviewed privacy sources.

## M1725 — Compose support-contract integrity v21

Composed the M1715 integrity-v20 marker, M1722 privacy-contract marker/cardinalities, M1724 closeout-contract marker/cardinalities, and historical M1718 closeout marker into the next frozen integrity-v21 result.

## M1726 — Privacy-audit new integrity-v21 support modules

Added a bounded six-source review over the newly introduced support modules. The review rejects browser/network/storage access, environment or host identity collection, timing collection, subprocess/worker surfaces, and dynamic execution.

## M1727 — Default-test-gate binding

Added a repository-wide test that exercises the M1725 integration and M1726 privacy evidence and locks the normal `npm run check` → `npm run test` → `node --test tests/*.test.js` path.

## M1728 — Source-only closeout

Composed the exact M1725 integrity-v21 and M1726 privacy evidence into a dedicated closeout marker, documented this tranche, advanced the canonical roadmap, and retained Issue #10 as the authoritative browser runtime gate.

## Retained invariants

- No telemetry, analytics, browsing/request history, matched-element history, page/DOM snapshots, retained statistics, timestamps, or user/device identifiers.
- No environment/user/host profiling.
- No embedded GitHub credentials or writable token.
- No owned Drop Ads backend requirement.
- No new extension permissions.
- No remote executable code.
- Connector-created tests/audits are source changes only; they are not represented as locally executed, CI-executed, or browser-executed evidence.
- Real Chromium and Firefox observations must continue to be recorded only through Issue #10 on the exact current packaged head.
