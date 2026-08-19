# Milestones 839–848 — Picker identity stability and save-boundary hardening

This block hardens the page-local element picker without adding browsing/request history, page or DOM snapshots, retained statistics, identifiers, telemetry, analytics, or a Drop Ads backend. Repository changes and regression files in this continuation were created through the GitHub connector and were **not** executed locally or in Chromium/Firefox; Issue #10 remains the real-browser release gate.

## M839 — Bound CSS-escape output expansion

`cssEscape()` applies the global selector-length ceiling while escaped output is assembled, so escape-heavy identity cannot create oversized intermediate selector text even when raw input is within its input ceiling. Regression: `tests/picker-css-escape-output-v839.test.js`.

## M840 — Stabilize picker identity snapshots against DOM mutation

Reviewed attributes are captured through one `getAttribute` collaborator and revalidated before candidate use. Class identity likewise requires the same bounded `classList` object, length, and scanned values after capture. Torn identity fails closed. Regression: `tests/picker-identity-snapshot-v840.test.js`.

## M841 — Reject deceptive and extension-owned picker identity tokens

Stable identity tokens reject URL/query/hash-style delimiters plus invisible and generated-token patterns. Drop Ads-owned `drop-ads-*` helper classes are excluded before page-class selection. Regression: `tests/picker-identity-token-boundary-v841.test.js`.

## M842 — Prefer explicit identity before structural selectors

Direct candidates are ordered as stable ID, the fixed reviewed attribute set, then deterministic class candidates. Bare tags are not accepted as direct identity; bounded structural composition remains fallback. Regression: `tests/picker-direct-identity-order-v842.test.js`.

## M843 — Keep duplicate target and ancestor IDs out of unsafe paths

A non-unique target ID is omitted from target structural fallback. Ancestor IDs enter a saved path only after exact uniqueness validation under the same bounded generation path. Regression: `tests/picker-id-path-safety-v843.test.js`.

## M844 — Bound selector uniqueness work

One `generateStableSelector()` call has an explicit 32-query uniqueness budget shared by direct candidates, ancestor-ID admission, and structural selector checks. Existing selector-length, depth, sibling-scan, and class-token ceilings remain in force. Regression: `tests/picker-uniqueness-budget-v844.test.js`.

## M845 — Revalidate the exact target immediately before save

Immediately before the local cosmetic-rule runtime mutation, `picker-save-guard.js` verifies that the preview selector still uniquely identifies the same connected target. Detached, changed, or retargeted selection fails locally before rule dispatch. Chromium and Firefox load the guard after selector utilities and before `picker.js`. Regression: `tests/picker-save-target-revalidation-v845.test.js`.

## M846 — Preserve retryable picker save failures

Picker save stays single-flight while an attempt is in progress. A failed local cosmetic mutation clears the in-flight flag, publishes sanitized failure feedback, and restores Save/Cancel without destroying the picker session; successful saves still clean up. Regression: `tests/picker-save-retry-v846.test.js`.

## M847 — Executable picker-selector hardening gate

`picker-selector-hardening-audit` is part of `npm run check`. It enforces the canonical M839–M846 selector/save, identity-snapshot, manifest-order, bounded-work, retryability, and privacy boundaries and requires the correctly numbered regressions. Regression: `tests/picker-selector-hardening-audit-v847.test.js`.

## M848 — State synchronization

The roadmap, qualification guidance, qualification-state audit, and Issue #10 are synchronized to this block. Competing issue numbers created by overlapping continuation requests are supporting/backlog only; `ROADMAP.md` remains the canonical numbering authority. The next canonical milestone is M849. This repository state is preflight evidence only: connector-created tests/audits are not represented as executed browser qualification, and any source change requires fresh exact-head Chromium + Firefox observations.
