# Milestones 1809–1818 — Qualification observation v9 support-contract integrity-v30 hardening

This tranche continues source-only hardening around the qualification observation support contracts. It does not create, infer, or substitute real Chromium or Firefox observations. Issue #10 remains the sole authoritative browser-runtime qualification gate.

## M1809 — Centralize integrity-v29 privacy source contract

The historical M1806 privacy review now consumes one descriptor-safe immutable six-source authority with exact source order, a 64 KiB ceiling per source, and a 384 KiB aggregate ceiling.

## M1810 — Descriptor-snapshot integrity-v29 privacy matchers

The integrity-v29 privacy review now admits only the canonical frozen 20-matcher inventory. Matcher tuples are descriptor-snapshotted; duplicate labels, accessors, holes, extras, stateful regexes, and label/pattern size overruns are rejected. Matching uses captured `RegExp.prototype.test`.

## M1811 — Exact integrity-v29 privacy result

Privacy success now publishes through an exact frozen four-field result: `files`, `reviewedSources`, `aggregateBytes`, and `marker`. Six ordered `{ path, bytes }` evidence entries are required and aggregate bytes are recomputed.

## M1812 — Exact integrity-v29 privacy contract audit

The privacy contract audit binds six sources, 64 KiB/source, 384 KiB aggregate, 20 matchers, four result fields, and the unchanged historical M1806 privacy marker.

## M1813 — Exact integrity-v29 closeout result

The historical M1808 closeout now publishes through an exact frozen four-field constructor without changing its historical marker.

## M1814 — Exact integrity-v29 closeout contract audit

The closeout contract binds the exact four-key closeout projection, six reviewed privacy sources, and the unchanged M1808 closeout marker.

## M1815 — Compose support-contract integrity v30

Integrity v30 composes the M1805 integrity-v29 integration marker, M1812 privacy-contract evidence, M1814 closeout-contract evidence, and the historical M1808 closeout marker.

## M1816 — Privacy-audit new integrity-v30 modules

A bounded source-only privacy audit reviews exactly the five new integrity-v29 support-contract modules plus the integrity-v30 integration audit. Browser/network/storage APIs, environment or host identity discovery, timing collection, subprocess/worker execution, and dynamic execution remain forbidden.

## M1817 — Default test-gate binding

A repository regression binds M1815 and M1816 evidence to the normal test path and locks `npm test` to `node --test tests/*.test.js`. The regression itself is source-only evidence; connector-created tests are not represented as executed locally, in CI, or in browsers.

## M1818 — Source-only closeout

The dedicated integrity-v30 closeout composes exact M1815 integration evidence and M1816 six-source privacy evidence. ROADMAP advances to canonical milestone 1819 while Issue #10 remains open and authoritative for real Firefox and Chromium observations.

## Retained invariants

- Zero telemetry or analytics.
- No browsing/request history, matched-element history, page/DOM snapshots, retained statistics, timestamps, identifiers, or user/device/environment profiling.
- No embedded writable GitHub credentials or owned Drop Ads backend.
- No new extension permissions.
- No remote executable code or procedural scriptlets.
- Source-only audits, tests, docs, and markers never substitute for real exact-head browser observations recorded through Issue #10.
