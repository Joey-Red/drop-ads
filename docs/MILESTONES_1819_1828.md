# Milestones 1819–1828 — Qualification observation v9 support-contract integrity-v31 hardening

This tranche continues source-only hardening around the qualification observation support contracts. It does not create, infer, or substitute real Chromium or Firefox observations. Issue #10 remains the sole authoritative browser-runtime qualification gate.

## M1819 — Centralize integrity-v30 privacy source contract

The historical M1816 privacy review now consumes one descriptor-safe immutable six-source authority with exact source order, a 64 KiB ceiling per source, and a 384 KiB aggregate ceiling.

## M1820 — Descriptor-snapshot integrity-v30 privacy matchers

The integrity-v30 privacy review now admits only the canonical frozen 20-matcher inventory. Matcher tuples are descriptor-snapshotted; duplicate labels, accessors, holes, extras, stateful regexes, and label/pattern size overruns are rejected. Matching uses captured `RegExp.prototype.test`.

## M1821 — Exact integrity-v30 privacy result

Privacy success now publishes through an exact frozen four-field result: `files`, `reviewedSources`, `aggregateBytes`, and `marker`. Six ordered `{ path, bytes }` evidence entries are required and aggregate bytes are recomputed.

## M1822 — Exact integrity-v30 privacy contract audit

The privacy contract audit binds six sources, 64 KiB/source, 384 KiB aggregate, 20 matchers, four result fields, and the unchanged historical M1816 privacy marker.

## M1823 — Exact integrity-v30 closeout result

The historical M1818 closeout now publishes through an exact frozen four-field constructor without changing its historical marker.

## M1824 — Exact integrity-v30 closeout contract audit

The closeout contract binds the exact four-key closeout projection, six reviewed privacy sources, and the unchanged M1818 closeout marker.

## M1825 — Compose support-contract integrity v31

Integrity v31 composes the M1815 integrity-v30 integration marker, M1822 privacy-contract evidence, M1824 closeout-contract evidence, and the historical M1818 closeout marker.

## M1826 — Privacy-audit new integrity-v31 modules

A bounded source-only privacy audit reviews exactly the five new integrity-v30 support-contract modules plus the integrity-v31 integration audit. Browser/network/storage APIs, environment or host identity discovery, timing collection, subprocess/worker execution, and dynamic execution remain forbidden.

## M1827 — Default test-gate binding

A repository regression binds M1825 and M1826 evidence to the normal test path and locks `npm test` to `node --test tests/*.test.js`. The regression itself is source-only evidence; connector-created tests are not represented as executed locally, in CI, or in browsers.

## M1828 — Source-only closeout

The dedicated integrity-v31 closeout composes exact M1825 integration evidence and M1826 six-source privacy evidence. ROADMAP advances to canonical milestone 1829 while Issue #10 remains open and authoritative for real Firefox and Chromium observations.

## Retained invariants

- Zero telemetry or analytics.
- No browsing/request history, matched-element history, page/DOM snapshots, retained statistics, timestamps, identifiers, or user/device/environment profiling.
- No embedded writable GitHub credentials or owned Drop Ads backend.
- No new extension permissions.
- No remote executable code or procedural scriptlets.
- Source-only audits, tests, docs, and markers never substitute for real exact-head browser observations recorded through Issue #10.
