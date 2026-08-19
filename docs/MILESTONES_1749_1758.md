# Milestones 1749–1758 — Qualification observation v9 support-contract integrity-v24 hardening

This tranche recursively hardens the source-only qualification-observation support contracts. It does **not** create, infer, or substitute Chromium/Firefox runtime observations. Issue #10 remains the sole authoritative real-browser qualification gate.

## M1749 — integrity-v23 privacy source authority

Centralized the historical M1746 integrity-v23 privacy review behind one descriptor-safe, frozen six-source contract. The authority fixes source ordering and enforces 64 KiB per source / 384 KiB aggregate ceilings.

## M1750 — integrity-v23 privacy matcher snapshot

Replaced trust in ad-hoc matcher structures with a descriptor-safe canonical frozen 20-matcher inventory. Matcher labels and regular-expression sources are byte-bounded; duplicate labels, accessors, holes, extra tuple fields, global/sticky regexes, and non-`u` flags fail closed. Matching uses captured `RegExp.prototype.test`.

## M1751 — exact integrity-v23 privacy result

Published historical M1746 privacy success only through an exact frozen four-field result: `files`, `reviewedSources`, `aggregateBytes`, `marker`. Complete ordered `{ path, bytes }` evidence is required and aggregate byte evidence is recomputed.

## M1752 — integrity-v23 privacy contract audit

Locked the six-source authority, 64 KiB/384 KiB limits, 20 canonical matchers, exact four-field result surface, and unchanged historical M1746 marker behind a new M1752 contract marker.

## M1753 — exact integrity-v23 closeout result

Routed the historical M1748 closeout through an exact frozen four-field constructor: `integrityMarker`, `privacyMarker`, `reviewedPrivacySources`, `marker`. Historical marker text remains unchanged.

## M1754 — integrity-v23 closeout contract audit

Locked the exact closeout projection and its six-source privacy cardinality behind a dedicated M1754 contract marker.

## M1755 — support-contract integrity v24

Composed the M1745 integrity-v23 integration marker, M1752 privacy-contract evidence, M1754 closeout-contract evidence, and historical M1748 closeout marker into a new frozen integrity-v24 result.

## M1756 — integrity-v24 support privacy review

Added a bounded six-source privacy review over the new integrity-v23 contract/result modules and integrity-v24 integration audit. The source-only review rejects browser/network/storage APIs, environment/host identity collection, timing collection, subprocess/worker surfaces, dynamic import, `eval`, and Function-constructor execution.

## M1757 — default test-gate binding

Added a regression that composes integrity-v24 integration and privacy evidence while locking the repository's default test path: `npm run check` must reach `npm run test`, and `npm test` remains `node --test tests/*.test.js`.

## M1758 — source-only closeout

Added a dedicated integrity-v24 closeout composing exact M1755 and M1756 evidence, documented the tranche, bound it to ROADMAP/default-gate/Issue #10 assertions, advanced the next canonical milestone to 1759, and posted the source-only supporting-evidence delta to Issue #10.

## Invariants retained

- Issue #10 is the sole authority for real Firefox + Chromium observations on the exact packaged head.
- Source-only audits, tests, markers, deterministic packages, fixtures, and documentation are preflight/supporting evidence only.
- No telemetry, analytics, browsing/request history, matched-element history, page/DOM snapshots, retained statistics, timestamps, identifiers, user/device/environment/host profiling, or owned Drop Ads backend behavior.
- No embedded writable GitHub credentials/tokens.
- No new extension permissions.
- No remote executable code.
- Connector-created tests/audits are not represented as executed locally, in CI, or in browsers.
