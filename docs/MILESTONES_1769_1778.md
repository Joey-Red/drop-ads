# Milestones 1769–1778 — Qualification observation v9 support-contract integrity-v26 hardening

This tranche continues the source-only qualification-support hardening chain. It strengthens the integrity-v25 support evidence and composes integrity-v26 without representing repository-side audits, fixtures, generated records, or connector-created regressions as real browser observations.

## M1769 — Centralized integrity-v25 privacy source authority

The historical M1766 privacy review now consumes one immutable descriptor-safe six-source contract. The authority fixes exact source order, a 64 KiB ceiling per source, and a 384 KiB aggregate ceiling while rejecting mutable, reordered, accessor-backed, or widened source inventories.

## M1770 — Descriptor-safe integrity-v25 privacy matchers

The privacy review exports one frozen 20-matcher inventory and snapshots matcher tuples through captured primitives. Holes, accessors, extra tuple fields, duplicate labels, global/sticky regexes, and oversized labels/patterns fail closed. Matching is performed only through the captured `RegExp.prototype.test` intrinsic.

## M1771 — Exact integrity-v25 privacy evidence result

Privacy success is published only through an exact frozen four-field result: `files`, `reviewedSources`, `aggregateBytes`, and `marker`. Six ordered frozen `{ path, bytes }` entries are mandatory; aggregate bytes and source count are recomputed before publication.

## M1772 — Integrity-v25 privacy contract audit

A dedicated source-only contract audit binds the six-source authority, 64 KiB/384 KiB ceilings, 20 matcher cardinality, exact four-field result surface, and unchanged historical M1766 privacy marker.

## M1773 — Exact integrity-v25 closeout result

The historical M1768 closeout now publishes through an exact frozen four-field constructor for `integrityMarker`, `privacyMarker`, `reviewedPrivacySources`, and `marker`, with reviewed privacy sources fixed at six and historical markers preserved.

## M1774 — Integrity-v25 closeout contract audit

The closeout contract locks the exact four-field projection, six-source privacy cardinality, and historical M1768 closeout marker before later generations may consume it.

## M1775 — Support-contract integrity v26

Integrity v26 composes the M1765 integrity-v25 marker, M1772 privacy-contract evidence (6/20/4), M1774 closeout-contract evidence (4/6), and historical M1768 closeout marker into one frozen source-only result.

## M1776 — Privacy review for new integrity-v26 support modules

The six new support modules introduced by M1769–M1775 are reviewed under 64 KiB/source and 384 KiB aggregate ceilings. The review rejects browser/network/storage access, environment/host identity collection, timing collection, subprocess/worker execution, dynamic import, `eval`, and `Function` construction.

## M1777 — Default test-gate binding

A repository regression exercises both M1775 integrity-v26 integration evidence and M1776 privacy evidence and locks the normal script topology: `npm run check` must continue to reach `npm run test`, and `npm test` remains `node --test tests/*.test.js`.

## M1778 — Source-only closeout

The dedicated integrity-v26 closeout composes exact M1775 and M1776 markers plus the six-source privacy cardinality. This remains supporting/preflight evidence only.

## Browser qualification authority

Issue #10 remains the sole authoritative real Firefox + Chromium runtime qualification gate. Source-only audits, tests, fixtures, deterministic builds/packages, generated qualification records, and these closeout markers never substitute for exact-head browser observations.

No browser observations were manufactured in this tranche. Connector-created tests and audits are not represented as executed locally, in CI, or in a browser.

## Privacy and architecture invariants retained

The tranche adds no telemetry, analytics, browsing/request history, matched-element history, page/DOM snapshots, retained blocked-request or contribution statistics, timestamps, identifiers, user/device/environment profiling, embedded writable credentials/tokens, owned Drop Ads backend, new extension permissions, or remote executable code.
