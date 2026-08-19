# Milestones 405–410

This block hardens remaining runtime comparison and browser/background collaborator boundaries without changing Drop Ads privacy, permissions, retention, or product policy. Connector-created or connector-edited regression coverage described below is repository coverage only and was not executed as local/package/browser qualification in this work session.

## Milestone 405 — bounded runtime cache fingerprints

`src/core/runtime.js` no longer fingerprints candidate list cache data through the old unbounded recursive `canonicalValue()` path. Cache comparison now uses the descriptor-only bounded JSON snapshot machinery with reviewed limits of **depth 32 / 512 fields per object / 300,000 array entries / 1,000,000 visited values**. Normal dense arrays and ordinary/null-prototype enumerable own-data objects are required; cycles, accessors, symbols, custom prototypes, sparse/extra arrays, revoked proxies, unsupported values, and non-finite numbers fail closed. Deterministic object-key ordering and valid-cache no-change detection remain intact.

Coverage: `tests/runtime-cache-fingerprint-v405.test.js`.

## Milestone 406 — preserve Protection-actions logger semantics

`src/core/action-count.js` treats a supplied warning logger as an external collaborator. `warn` is admitted only through the descriptor-safe own-data boundary, captured once, and bound to the original logger receiver. Accessor-backed metadata is not executed, later mutation cannot change the captured callback, and warning delivery is best effort so a throwing logger cannot reject optional Protection-actions synchronization. Browser-owned action-count behavior still observes no individual requests and stores no request history.

Coverage: `tests/action-count-logger-receiver-v406.test.js`.

## Milestone 407 — contain synchronous tab-fanout send failures

`src/core/tab-fanout.js` captures `tabs.sendMessage` once with the browser tabs object as receiver. Each send crosses a promise boundary before `Promise.allSettled`, so synchronous throws and rejected promises become per-tab failures instead of aborting the current batch or later batches. Deduplication, one structured-cloned message snapshot, the existing **32 concurrent send** ceiling, and the reviewed no-total-tab-cap behavior are preserved.

Coverage: `tests/tab-fanout-sync-failure-v407.test.js`.

## Milestone 408 — isolate Protection-actions teardown failures

Protection-actions disposal contains `storage.onChanged.removeListener` failure and releases installation identity in a `finally` path. Disposal remains idempotent and non-throwing, and reinstall remains possible even when browser listener removal throws. Existing preference, queue, zero-request-observation, and Milestone 406 logger guarantees remain unchanged.

Coverage: `tests/action-count-teardown-isolation-v408.test.js`.

## Milestone 409 — make background bootstrap diagnostics teardown-safe

`src/core/background-bootstrap.js` routes optional-install and optional/mandatory/core teardown diagnostics through a best-effort warning helper while keeping the supplied warning callback captured once with its original receiver. A throwing logger cannot promote an optional feature failure into mandatory blocker startup failure and cannot prevent later optional disposers, mandatory recovery, or core teardown from being attempted. Reverse teardown ordering and once-only/idempotent disposal remain unchanged.

Coverage: `tests/background-bootstrap-diagnostic-isolation-v409.test.js`.

### Supporting lifecycle hardening in this block

Mandatory-recovery and core `dispose` collaborators are also captured immediately after installation through the shared descriptor-safe own-data boundary. An absent disposer remains valid; a present disposer must be an own enumerable data function and is bound once to its original registration receiver. Unsafe metadata fails startup rather than leaving a mutable teardown contract, and later registration mutation cannot change teardown behavior. This supporting item does not define a second canonical milestone number.

Coverage: `tests/background-bootstrap-layer-disposer-support.test.js`.

## Milestone 410 — documentation and release-gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized to the M405–410 block. PR #7 remains draft and Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate. Repository coverage does not substitute for clean package/source preflight or real browser observations, and any source commit after browser observation invalidates those observations.

No `npm ci`, repository test suite, package/release verification, reproducibility check, source qualification, qualification record, Chromium run, or Firefox run is claimed from connector-only repository edits.

## Privacy invariants

No milestone in this block introduces telemetry, analytics, browsing/request history, retained matched-request or page/DOM history, user/device identifiers, a custom Drop Ads backend, new permissions, or broader data retention.
