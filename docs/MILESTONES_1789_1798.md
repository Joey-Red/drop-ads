# Milestones 1789–1798 — Qualification observation v9 support-contract integrity-v28 hardening

This tranche continues source-only hardening around the qualification observation support contracts. It does not create, infer, or substitute real Chromium or Firefox observations. Issue #10 remains the sole authoritative browser-runtime qualification gate.

## M1789 — Centralize integrity-v27 privacy source contract

The historical M1786 privacy review now consumes one descriptor-safe immutable six-source authority with exact source order, a 64 KiB ceiling per source, and a 384 KiB aggregate ceiling.

## M1790 — Descriptor-snapshot integrity-v27 privacy matchers

The integrity-v27 privacy review now admits only the canonical frozen 20-matcher inventory. Matcher tuples are descriptor-snapshotted; duplicate labels, accessors, holes, extras, stateful regexes, and label/pattern size overruns are rejected. Matching uses captured `RegExp.prototype.test`.

## M1791 — Exact integrity-v27 privacy result

Privacy success now publishes through an exact frozen four-field result: `files`, `reviewedSources`, `aggregateBytes`, and `marker`. Six ordered `{ path, bytes }` evidence entries are required and aggregate bytes are recomputed.

## M1792 — Exact integrity-v27 privacy contract audit

The privacy contract audit binds six sources, 64 KiB/source, 384 KiB aggregate, 20 matchers, four result fields, and the unchanged historical M1786 privacy marker.

## M1793 — Exact integrity-v27 closeout result

The historical M1788 closeout now publishes through an exact frozen four-field constructor without changing its historical marker.

## M1794 — Exact integrity-v27 closeout contract audit

The closeout contract binds the exact four-key closeout projection, six reviewed privacy sources, and the unchanged M1788 closeout marker.

## M1795 — Compose support-contract integrity v28

Integrity v28 composes the M1785 integrity-v27 integration marker, M1792 privacy-contract evidence, M1794 closeout-contract evidence, and the historical M1788 closeout marker.

## M1796 — Privacy-audit new integrity-v28 modules

A bounded source-only privacy audit reviews exactly the five new integrity-v27 support-contract modules plus the integrity-v28 integration audit. Browser/network/storage APIs, environment or host identity discovery, timing collection, subprocess/worker execution, and dynamic execution remain forbidden.

## M1797 — Default test-gate binding

A repository regression binds M1795 and M1796 evidence to the normal test path and locks `npm test` to `node --test tests/*.test.js`. The regression itself is source-only evidence; connector-created tests are not represented as executed locally, in CI, or in browsers.

## M1798 — Source-only closeout

The dedicated integrity-v28 closeout composes exact M1795 integration evidence and M1796 six-source privacy evidence. ROADMAP advances to canonical milestone 1799 while Issue #10 remains open and authoritative for real Firefox and Chromium observations.

## Retained invariants

- Zero telemetry or analytics.
- No browsing/request history, matched-element history, page/DOM snapshots, retained statistics, timestamps, identifiers, or user/device/environment profiling.
- No embedded writable GitHub credentials or owned Drop Ads backend.
- No new extension permissions.
- No remote executable code or procedural scriptlets.
- Source-only audits, tests, docs, and markers never substitute for real exact-head browser observations recorded through Issue #10.
