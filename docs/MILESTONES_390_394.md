# Milestones 390–394 — Background runtime policy and DNR boundaries

This block hardens direct refresh admission, storage-policy fingerprint work, browser dynamic-rule result admission, and managed DNR semantic comparison. It does not add request observation, retained browsing data, telemetry, analytics, identifiers, permissions, or a Drop Ads backend.

## Milestone 390 — Strict direct list-refresh force admission

The background controller's direct `refreshListsOnce(force)` and `queueListRefresh(force)` paths now accept only primitive booleans. Omission remains `false`; strings such as `"false"`, numbers, boxed booleans, objects, and other type-confused inputs are rejected before state/cache reads, queued work, source parsing, or network fetches. The runtime-message path still deliberately maps only strict `true` to a forced refresh.

Repository coverage: `tests/runtime-refresh-force-v390.test.js`.

## Milestone 391 — Bounded policy fingerprint snapshots

Policy and session fingerprint inputs now pass through a descriptor-only bounded JSON-data snapshot. Reviewed limits are:

- maximum nesting depth: **16**
- maximum own data fields per object: **64**
- maximum dense entries per array: **10,000**
- maximum visited values per policy snapshot: **250,000**

Only null, strings, booleans, finite numbers, normal dense arrays, and ordinary/null-prototype enumerable own-data objects are admitted. Sparse/extra-property/custom-prototype arrays, accessors, symbols, custom-prototype objects, cycles, unsupported values, non-finite numbers, revoked proxies, and work overflow fail closed rather than being coerced or truncated. Background own-data event discrimination also contains revoked `Array.isArray()` failures.

Repository coverage: `tests/runtime-policy-snapshot-v391.test.js`.

## Milestone 392 — Dynamic-rule result boundary

Every `declarativeNetRequest.getDynamicRules()` result used for activation or rollback now passes through a normal dense array boundary capped at **100,000 entries**. Each returned rule must be a plain object exposing an own enumerable positive safe-integer `id`; duplicate ids fail before managed-namespace classification or unmanaged-capacity arithmetic. Managed filtering and capacity accounting consume detached validated ids rather than normal rule property reads.

The rule objects themselves continue to the separate managed-rule semantic boundary described below.

Repository coverage: `tests/runtime-dynamic-rule-result-v392.test.js`.

## Milestone 393 — Bounded managed-rule canonical comparison

Managed current/desired DNR rules are canonicalized as descriptor-only JSON-like data before diffing. Reviewed per-rule limits are:

- maximum nesting depth: **16**
- maximum own data fields per object: **64**
- maximum dense entries per nested array: **10,000**
- maximum visited values per rule: **50,000**

Object keys are sorted for deterministic signatures while array order is preserved. Accessors, symbols, custom prototypes, sparse/extra arrays, cycles, unsupported values, non-finite numbers, and work overflow fail closed. Positive safe-integer own-data ids are required, duplicate ids are rejected, each canonical signature is computed once, and rules sent in `addRules` are detached canonical data rather than caller-owned objects.

Repository coverage: `tests/runtime-managed-rule-canonical-v393.test.js`, including behavioral cases for key-order equality, accessor non-execution, duplicate rejection, and detached additions.

## Milestone 394 — Documentation and exact-head release gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized to this boundary. PR #7 remains draft and Issue #10 remains the authoritative Chromium + Firefox exact-head qualification gate.

The regression files above are repository coverage only. They were created/edited through the GitHub connector and were **not executed in this work session**. No claim is made that `npm ci`, `npm run check`, packaging, release verification, reproducibility, source qualification, qualification-record generation, or either browser matrix passed on this head.

Any later source commit invalidates browser observations made against an older head. The privacy model remains unchanged: zero telemetry, zero browsing/request history, zero retained matched-rule statistics, zero identifiers, and no custom Drop Ads tracking backend.
