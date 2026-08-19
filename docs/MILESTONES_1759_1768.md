# Milestones 1759–1768 — Qualification observation v9 support-contract integrity-v25 hardening

This tranche remains **source-only preflight/supporting evidence**. It does not create, infer, or substitute any Chromium or Firefox runtime observation. GitHub Issue #10 remains the sole authoritative real cross-browser qualification gate for the exact packaged head.

## M1759 — Centralized integrity-v24 privacy source authority

The completed integrity-v24 privacy review now consumes one immutable descriptor-safe six-source contract. The contract fixes source order, a 64 KiB per-source ceiling, and a 384 KiB aggregate ceiling, rejecting mutable, reordered, accessor-backed, or widened source inventories while preserving the historical M1756 marker.

## M1760 — Descriptor-safe integrity-v24 privacy matcher inventory

The privacy review now exposes one canonical frozen 20-matcher inventory admitted through descriptor snapshots. It rejects holes, accessors, extra tuple fields, duplicate labels, non-RegExp values, global/sticky regex state, non-`u` flags, oversized labels, oversized patterns, and inventories above the configured matcher ceiling. Matching uses captured `RegExp.prototype.test` only.

## M1761 — Exact integrity-v24 privacy evidence result

Successful M1756 privacy review publication now passes through an exact frozen four-field result contract: `files`, `reviewedSources`, `aggregateBytes`, and `marker`. Each of the six source-evidence entries is an exact frozen `{ path, bytes }` object in canonical order, aggregate bytes are recomputed, and marker drift or widened/accessor-backed evidence is rejected.

## M1762 — Exact integrity-v24 privacy contract audit

A dedicated source-only audit binds the six-source authority, 64 KiB/384 KiB limits, 20 canonical privacy matchers, four-field result surface, and the historical M1756 privacy marker. It publishes the M1762 privacy-contract marker with exact 6/20/4 cardinalities.

## M1763 — Exact integrity-v24 closeout result

The historical M1758 closeout now publishes through an exact frozen constructor requiring only `integrityMarker`, `privacyMarker`, `reviewedPrivacySources`, and `marker` in canonical order. The privacy source cardinality remains exactly six and the historical M1758 marker remains unchanged.

## M1764 — Exact integrity-v24 closeout contract audit

A dedicated source-only closeout-contract audit binds the exact four-field M1763 projection, six-source privacy cardinality, and historical M1758 closeout marker. It publishes the M1764 closeout-contract marker without creating browser evidence.

## M1765 — Support-contract integrity v25

The next support generation descriptor-reads and composes the M1755 integrity-v24 integration evidence, M1762 privacy-contract evidence, M1764 closeout-contract evidence, and historical M1758 closeout marker. It verifies the exact privacy 6/20/4 and closeout 4/6 cardinalities and publishes the M1765 integrity-v25 marker.

## M1766 — Bounded privacy audit for new integrity-v25 modules

The six new support modules introduced across M1759–M1765 are reviewed under a 64 KiB per-source and 384 KiB aggregate ceiling. The source-only audit rejects browser APIs, network/storage surfaces, environment/host identity discovery, timestamps/performance timing, subprocess/worker surfaces, and dynamic execution. It publishes the M1766 privacy marker with exactly six reviewed sources.

## M1767 — Default test-gate binding

A focused regression composes M1765 integrity-v25 and M1766 privacy evidence and verifies the repository's default check path still reaches the repository-wide test suite (`npm run test`) with `npm test` bound to `node --test tests/*.test.js`. Connector-created tests are not represented as executed locally, in CI, or in browsers.

## M1768 — Source-only tranche closeout

The integrity-v25 closeout composes exact M1765 and M1766 markers with six reviewed privacy sources. ROADMAP advances to canonical milestone 1769 while retaining Issue #10 as the only real Firefox + Chromium qualification authority.

## Privacy and release invariants retained

No telemetry, analytics, browsing/request history, matched-element history, page/DOM snapshots, retained blocked-request or contribution statistics, timestamps, user/device/environment/host identifiers, embedded writable GitHub credentials, owned Drop Ads backend, new extension permissions, or remote executable code were introduced. Community contribution remains optional and user-reviewed; source-only repository evidence never substitutes for real exact-head browser observations.
