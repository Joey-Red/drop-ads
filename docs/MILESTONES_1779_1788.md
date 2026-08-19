# Milestones 1779–1788 — Qualification observation v9 support-contract integrity-v27 hardening

This tranche recursively hardens the source-only qualification-support evidence added by the integrity-v26 generation. It does not create, infer, or replace real Firefox or Chromium observations. Issue #10 remains the sole authoritative browser runtime qualification gate.

## M1779 — Centralize integrity-v26 privacy source contract

The historical M1776 privacy review now consumes one immutable descriptor-safe six-source authority with exact 64 KiB per-source and 384 KiB aggregate ceilings. Mutable, reordered, accessor-backed, or widened path inventories are rejected while the historical M1776 marker remains unchanged.

## M1780 — Descriptor-snapshot integrity-v26 privacy matchers

The privacy review now admits only the canonical frozen 20-matcher inventory. Matcher tuples, labels, regex identity/flags/state, byte ceilings, duplicate labels, holes, accessors, and extras are checked using captured primitives, and matching executes through captured `RegExp.prototype.test`.

## M1781 — Exact integrity-v26 privacy evidence result

Privacy success now publishes through an exact frozen four-field result: `files`, `reviewedSources`, `aggregateBytes`, and `marker`. Every canonical source contributes an ordered frozen `{ path, bytes }` record and the aggregate is recomputed before publication.

## M1782 — Exact integrity-v26 privacy audit contract

The privacy contract binds the six-source authority, 64 KiB / 384 KiB ceilings, 20 canonical matchers, four result fields, and the unchanged historical M1776 marker. Its contract marker is `canonical M1782 qualification observation contract-integrity v9 support contract integrity-v26 privacy audit contract verified`.

## M1783 — Exact integrity-v26 closeout result

The historical M1778 closeout now publishes through an exact frozen four-field constructor for `integrityMarker`, `privacyMarker`, `reviewedPrivacySources`, and `marker`, with reviewed privacy-source cardinality fixed at six.

## M1784 — Exact integrity-v26 closeout contract

The closeout contract binds the four-field M1783 projection, six-source privacy cardinality, and unchanged historical M1778 closeout marker. Its contract marker is `canonical M1784 qualification observation contract-integrity v9 support contract integrity-v26 closeout contract verified`.

## M1785 — Compose support-contract integrity v27

The v27 integration descriptor-reads the M1775 integrity-v26 result, M1782 privacy contract, M1784 closeout contract, and historical M1778 closeout. It requires exact privacy 6/20/4 and closeout 4/6 cardinalities before publishing `canonical M1785 qualification observation contract-integrity v9 support contract integrity v27 verified`.

## M1786 — Bounded integrity-v27 privacy review

A new source-only privacy review covers exactly the five new integrity-v26 support-contract modules plus the integrity-v27 integration audit. It enforces 64 KiB per source / 384 KiB aggregate and rejects browser/network/storage, host/environment identity, timing, subprocess/worker, and dynamic-execution surfaces. Its marker is `canonical M1786 qualification observation contract-integrity v9 support contract integrity-v27 privacy verified`.

## M1787 — Default-test-gate binding

A repository-wide regression composes the M1785 integrity-v27 integration evidence and M1786 six-source privacy evidence, then locks the normal `npm run check` → `npm run test` path and the exact `node --test tests/*.test.js` test script. Connector-created tests are source changes only and are not represented as locally or browser-executed qualification.

## M1788 — Source-only closeout

The dedicated v27 closeout composes the exact M1785 and M1786 markers plus six reviewed privacy sources and publishes `canonical M1788 qualification observation contract-integrity v9 support contract integrity-v27 closeout verified`.

## Retained invariants

- Issue #10 remains the sole authoritative real Firefox + Chromium runtime qualification gate.
- Source-only audits, tests, fixtures, markers, docs, builds, and packages cannot substitute for real exact-head browser observations.
- No telemetry, analytics, browsing/request history, matched-element history, DOM/page snapshots, retained statistics/counts, timestamps, identifiers, user/device/environment profiling, embedded writable credentials, or owned Drop Ads backend were introduced.
- No new extension permissions or remote executable code were introduced.
- Community contribution remains optional and user-reviewed; private/LAN identifiers remain excluded from contribution URLs.
