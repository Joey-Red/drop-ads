# Milestones 415–420 — Listener, startup, logger, and personal-rule resilience

This block continues Drop Ads' hostile-collaborator hardening without changing the privacy model, permission set, blocking precedence, retained data, or release status. Connector-created or connector-edited regression files described here are repository coverage only; they were not executed locally or in Chromium/Firefox in this session.

## Milestone 415 — transactional context-feedback listener lifecycle

`installContextBlockFeedback()` captures the required context-menu and storage-change event collaborators before registration. Listener installation is transactional: if a later registration throws, earlier listeners are removed best effort in reverse order and no installation identity is published. Disposal marks the helper inactive first, removes the captured listeners independently, releases pending and visible timer state, and clears installation identity in `finally`, so a browser removal failure cannot prevent reinstall. Existing **128 pending / 128 visible / 60,000 ms** ceilings and committed-only cleanup semantics remain unchanged.

Coverage: `tests/context-feedback-listener-lifecycle-v415.test.js`.

## Milestone 416 — transactional message-guard listener lifecycle

The guarded runtime `onMessage` facade now treats browser listener registration/removal as an external lifecycle boundary. Logical listener identity is available for synchronous callback correctness, rolled back when browser `addListener()` throws, and released before external removal. A throwing `removeListener()` is contained; any browser-retained wrapper becomes inert, and the logical listener can be installed again. Duplicate-add suppression, `hasListener`, exact validation, other-group fallthrough, and `rejectUnknown` semantics are preserved.

Coverage: `tests/message-guard-listener-lifecycle-v416.test.js`.

## Milestone 417 — mandatory-startup rollback of an already-started core

`bootstrapBackground()` retains the captured core disposer immediately after starting mandatory core functionality. If mandatory recovery installation or mandatory disposer admission fails, the captured core disposer runs best effort before the original mandatory startup error is rethrown. Synchronous cleanup throws and asynchronously rejected cleanup cannot replace the original failure. Successful startup retains reverse optional teardown followed by mandatory recovery and a distinct core.

Coverage: `tests/background-bootstrap-mandatory-rollback-v417.test.js`.

## Milestone 418 — descriptor-safe, failure-isolated background diagnostics

`createBackgroundRuntime()` captures supplied logger `warn` and `error` functions through descriptor-safe own-data admission, binds them once to the original receiver before API/listener setup, and preserves equivalent bound-console defaults when no logger is supplied. The captured facade delivers diagnostics best effort, so a throwing logger cannot abort rollback recovery, local-block community fallback, initialization fallback, alarm handling, or storage repair. Later logger mutation cannot replace the captured callbacks.

Coverage: `tests/runtime-logger-collaborator-v418.test.js`.

## Milestone 419 — revoked-Proxy-safe personal collection compatibility

Personal network-rule and domain compatibility snapshots now contain array-kind inspection failure before the shared dense-array boundary. Ordinary non-array legacy values retain the existing empty-collection compatibility fallback, while revoked or throwing array-kind values fail deterministically instead of leaking native exceptions. Existing **10,000 personal network-rule / 5,000 personal-domain** ceilings remain unchanged and are inherited by add/remove/domain/site helpers.

Coverage: `tests/personal-rules-revoked-proxy-v419.test.js`.

## Milestone 420 — documentation and exact-head release-gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized through this block. PR #7 remains draft and Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate. The exact final implementation head awaiting qualification is recorded in the newest synchronization comment on Issue #10 rather than hardcoded in the PR body.

No `npm ci`, repository test suite, packaging/release verification, reproducibility check, source qualification, qualification record, Chromium run, or Firefox run is claimed from connector-only changes.

## Privacy invariants

These milestones introduce no telemetry, analytics, browsing/request history, retained blocked-request statistics, matched-element/page/DOM history, user/device identifiers, cookie database access, custom Drop Ads backend, new permission, or executable remote-code path.
