# Milestones 406–410 — Background collaborator resilience

This block continues the privacy-first hardening line without expanding permissions, retention, telemetry, history, statistics, identifiers, remote code, or backend requirements. Connector-created or edited regression coverage described here is repository coverage only and was not executed in this connector workflow.

Milestone 405 immediately preceded this block and replaced runtime cache fingerprinting's older unbounded recursive canonicalizer with the descriptor-only bounded JSON snapshot machinery. Its reviewed limits are **depth 32 / 512 fields per object / 300,000 array entries / 1,000,000 visited values**; the canonical summary is retained in `ROADMAP.md`.

## Milestone 406 — Preserve Protection-actions logger semantics

A supplied Protection-actions `warn` callback is admitted through the descriptor-safe own-data boundary, captured once, and bound to the original logger receiver. Accessor-backed warning metadata is rejected without getter execution, later mutation cannot change the captured callback, and warning delivery is best effort so a throwing logger cannot turn optional synchronization failure into an unhandled recovery failure. Browser-owned action-count behavior remains request-observation-free and retains no request or browsing history.

Coverage: `tests/action-count-logger-receiver-v406.test.js`.

## Milestone 407 — Contain tab-fanout synchronous send failures

`sendTabMessageBatched()` captures `tabs.sendMessage` once with its original tabs receiver and moves every send behind a promise boundary. A synchronous collaborator throw and a rejected returned promise therefore use the same per-tab settled failure accounting, so one failed send cannot prevent later valid tabs or later batches. Existing semantics remain: deduplicated tab ids, no total tab-count cap, one structured-cloned message snapshot, and at most **32 concurrent sends**.

Coverage: `tests/tab-fanout-sync-failure-v407.test.js`.

## Milestone 408 — Isolate Protection-actions teardown failures

Storage-listener removal during Protection-actions disposal is isolated, and installation identity is released in a `finally` path even when browser listener removal throws. Disposal remains idempotent and non-throwing, reinstall remains possible, and Milestone 406 logger guarantees remain intact.

Coverage: `tests/action-count-teardown-v408.test.js`.

## Milestone 409 — Make background bootstrap collaborators teardown-safe

Background bootstrap delivers optional-install and optional/mandatory/core teardown diagnostics through a best-effort warning boundary. A supplied warning callback that throws cannot convert an optional feature failure into mandatory startup failure and cannot abort reverse-order teardown after a disposer fails. Captured callback receiver semantics, feature-status publication, once-only disposal, and teardown ordering are unchanged.

Mandatory recovery and core registrations are also inspected immediately after installation through the shared descriptor-safe own-data boundary. A present `dispose` must be an own enumerable data function and is captured once with its original registration receiver. Unsafe registration metadata fails startup, absence remains supported, later registration mutation cannot change teardown behavior, and a shared core/recovery registration is disposed exactly once.

Coverage: `tests/background-bootstrap-diagnostics-v409.test.js` and `tests/background-bootstrap-layer-disposer-v409.test.js`.

## Milestone 410 — Documentation and exact-head release-gate synchronization

`ROADMAP.md` and draft PR #7 are synchronized through this block without hardcoding the PR head SHA. Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate. The exact implementation head for this block is recorded in a synchronization comment on Issue #10 after the final repository edit. PR #7 remains draft until clean preflight plus real browser observations are completed against that exact head.

No `npm ci`, repository test suite, package/release verification, reproducibility check, source qualification, qualification record, Chromium run, or Firefox run is claimed from connector-only repository edits.

## Privacy invariants

These milestones add no telemetry, analytics, browsing/request history, retained blocked-request statistics, page/DOM history, matched-element history, user/device identifiers, cookie database access, custom Drop Ads backend, new permission, or executable remote-code path.
