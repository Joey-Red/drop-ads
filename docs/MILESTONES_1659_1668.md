# Milestones 1659–1668 — Qualification observation v9 support-contract integrity-v15 hardening

This tranche continues source-only qualification-support hardening. It does **not** create, infer, or substitute for Chromium/Firefox runtime observations. Issue #10 remains the sole browser qualification authority for the exact current source/package head.

## M1659 — Centralized integrity-v14 privacy source authority

The historical M1656 privacy audit now consumes one descriptor-safe six-source contract with exact source order, a 64 KiB per-source ceiling, and a 384 KiB aggregate ceiling. Mutable, reordered, accessor-backed, or widened source inventories are rejected.

## M1660 — Descriptor-safe privacy matcher inventory

The integrity-v14 privacy review now snapshots an exact frozen 20-matcher inventory through captured intrinsics. Holes, accessors, extras, duplicate labels, stateful regular expressions, and oversized labels/patterns fail closed; matching uses captured `RegExp.prototype.test`.

## M1661 — Exact privacy evidence result

Successful integrity-v14 privacy review publishes only through an exact frozen four-field result containing complete ordered `{ path, bytes }` evidence, reviewed-source count, recomputed aggregate bytes, and the unchanged historical M1656 marker.

## M1662 — Exact privacy contract audit

A dedicated source-only contract audit binds the six-source limits, 20 matcher cardinality, exact four-field privacy result, and historical M1656 marker. It publishes the M1662 contract marker.

## M1663 — Exact integrity-v14 closeout result

The historical M1658 closeout now publishes through an exact frozen four-field constructor, with canonical field order, six reviewed privacy sources, and unchanged historical integrity/privacy/closeout markers.

## M1664 — Exact closeout contract audit

A dedicated source-only audit locks the M1663 result surface, six-source privacy cardinality, and historical M1658 closeout marker, publishing the M1664 contract marker.

## M1665 — Support-contract integrity v15 composition

The next integration generation descriptor-reads and composes M1655 integrity-v14 evidence, M1662 privacy-contract evidence, M1664 closeout-contract evidence, and the historical M1658 closeout marker. Exact 6/20/4 and 4/6 cardinalities remain required.

## M1666 — Bounded privacy review of the new support generation

The six new M1659–M1665 support modules are reviewed under 64 KiB per-source and 384 KiB aggregate ceilings. Browser/network/storage access, environment or host identity collection, timing collection, subprocess/worker surfaces, and dynamic execution are rejected.

## M1667 — Default test-gate binding

A repository-wide default-gated regression composes M1665 and M1666 evidence while asserting that `npm run check` still reaches `npm run test` and `npm test` remains `node --test tests/*.test.js`.

## M1668 — Source-only closeout

A dedicated closeout composes the exact M1665 integrity-v15 marker and M1666 six-source privacy marker. The roadmap advances to M1669 and Issue #10 receives only a supporting-evidence delta; it remains open and authoritative for real browser observations.

## Invariants retained

- No telemetry, analytics, browsing/request history, matched-element history, page/DOM snapshots, retained statistics, timestamps, user/device identifiers, environment/user/host profiling, embedded GitHub credentials/tokens, or owned Drop Ads backend behavior.
- No new extension permissions or remote executable code.
- Connector-created tests and audits are source changes only; they are not represented as executed local validation, CI validation, or browser qualification.
- Any real Firefox/Chromium qualification must be performed on the exact current head/package identities and recorded through Issue #10.
