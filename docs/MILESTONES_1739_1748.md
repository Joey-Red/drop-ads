# Milestones 1739–1748 — Qualification observation v9 support-contract integrity-v23 hardening

This tranche extends the source-only qualification support-contract integrity chain without creating, inferring, or substituting any real browser observation. Issue #10 remains the sole authoritative Chromium + Firefox runtime qualification gate.

## M1739 — integrity-v22 privacy source contract

Centralized the exact six-source authority used by the historical M1736 integrity-v22 privacy review. The contract descriptor-snapshots one frozen canonical path inventory and centralizes the 64 KiB per-source / 384 KiB aggregate ceilings.

## M1740 — descriptor-safe privacy matcher inventory

Hardened integrity-v22 privacy matching into a frozen exact 20-matcher inventory. Matcher admission rejects holes, accessors, extras, duplicate labels, mutable tuples, stateful regular expressions, and over-limit labels/patterns while matching through captured `RegExp.prototype.test`.

## M1741 — exact privacy evidence result

Added the exact ordered `files`, `reviewedSources`, `aggregateBytes`, `marker` privacy result contract. The M1736 marker remains unchanged and successful privacy evidence now includes all six canonical source paths with bounded byte counts.

## M1742 — privacy audit contract

Bound the six-source contract, 64 KiB / 384 KiB ceilings, 20 matcher count, four result fields, and the historical M1736 marker into a dedicated source-only audit contract.

## M1743 — exact integrity-v22 closeout result

Added an exact four-field closeout result constructor for `integrityMarker`, `privacyMarker`, `reviewedPrivacySources`, and `marker`, preserving the historical M1738 closeout marker and six-source cardinality.

## M1744 — integrity-v22 closeout contract audit

Locked the exact closeout result projection, six-source privacy cardinality, and historical M1738 marker into a dedicated source-only closeout contract audit.

## M1745 — support-contract integrity v23

Composed the M1735 integrity-v22 integration evidence, M1742 privacy contract, M1744 closeout contract, and historical M1738 closeout marker into support-contract integrity v23.

## M1746 — bounded integrity-v23 privacy review

Reviewed exactly the five new integrity-v22 support-contract modules plus the integrity-v23 integration audit under 64 KiB per-source / 384 KiB aggregate ceilings. The review rejects browser/network/storage access, host/environment identity collection, timing collection, subprocess/worker creation, and dynamic execution surfaces.

## M1747 — default test-gate binding

Added a regression that reaches the integrity-v23 integration and privacy audits through the repository-wide test path and locks `npm test` to `node --test tests/*.test.js` while requiring `npm run check` to include `npm run test`.

## M1748 — source-only closeout

Added a dedicated source-only integrity-v23 closeout that composes the exact M1745 and M1746 markers and six-source privacy cardinality. This closeout is supporting evidence only.

## Retained invariants

- Issue #10 is the sole authority for real Chromium and Firefox runtime qualification.
- Repository tests, audits, docs, deterministic packaging, and source-only markers do not manufacture browser observations.
- No telemetry, analytics, browsing/request history, matched-element history, page/DOM snapshots, retained statistics, timestamps, identifiers, or environment/user/host profiling are introduced.
- No embedded writable GitHub credentials or tokens are introduced.
- No owned Drop Ads backend is introduced.
- No new extension permissions are introduced.
- No remote executable code is introduced.
- Connector-created regressions are not represented as actually executed locally, in CI, or in a browser.
