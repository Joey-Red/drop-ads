# Milestones 445–451 — Runtime scheduling and fanout boundary hardening

This block continues the privacy-first Firefox/Chromium shared runtime hardening after M438–444. The changes do not add telemetry, analytics, request/browsing history, retained statistics, identifiers, a custom backend, or new permissions.

## M445 — Arm list-download timeouts before source work

`withListDownloadTimeout()` now treats successful timeout arming as an admission prerequisite for source work. A throwing timer implementation fails before the task is queued. If an injected timer expires synchronously during arming, the request is aborted and rejected before the source task can begin; any returned timer handle is best-effort cleared rather than retained. Existing 1–120,000 ms validation, abort-on-timeout behavior, and result-preserving cleanup remain unchanged.

Focused repository coverage: `tests/list-timeout-arm-v445.test.js`.

## M446 — Preflight non-streaming response text before UTF-8 allocation

The `Response.text()` fallback now checks `text.length > byteLimit` before constructing `TextEncoder`. This prevents an avoidable second large allocation for a string that is already numerically impossible to fit the active byte limit. The exact UTF-8 encoded-byte check remains authoritative for multibyte text that passes the code-unit preflight, and exact-bound ASCII input remains supported.

Focused repository coverage: `tests/response-text-fallback-preflight-v446.test.js`.

## M447 — Capture core runtime event collaborators once

The core background runtime captures add/remove listener operations for runtime installation/startup/message events, context-menu clicks, alarms, and storage changes through the bounded descriptor/prototype method boundary before registration. Registration uses the captured add operation and records the captured remover. Rollback/disposal therefore cannot be redirected by later browser-namespace mutation, while existing transactional startup rollback and inert-after-dispose listener semantics remain intact.

Focused repository coverage: `tests/runtime-event-collaborators-v447.test.js`.

## M448 — Capture and await configured refresh alarm operations

Configured list-refresh scheduling captures `alarms.clear` and `alarms.create` with their original receiver. Scheduling awaits both operations in clear-then-create order through `Promise.resolve`, covering synchronous/void and promise-returning browser implementations. A failed create is surfaced to the existing initialization/import scheduling path rather than being reported as successful. The configured minimum interval remains 60 minutes.

Focused repository coverage: `tests/runtime-alarm-collaborators-v448.test.js`.

## M449 — Reject post-dispose core queue admission

The shared core task queue now rejects new work immediately after disposal and rechecks disposal immediately before an already-queued task begins. Work already executing may finish, but queued mutations/refreshes/imports/state reads cannot begin after teardown. `whenIdle()` deliberately remains a direct queue drain so teardown/callers can await already-admitted work without reopening admission.

Focused repository coverage: `tests/runtime-disposed-queue-v449.test.js`.

## M450 — Capture tab fanout sender once

Tab fanout captures the `tabs` namespace as descriptor data and captures `sendMessage` through bounded descriptor/prototype inspection. The captured callable is invoked with the original tabs receiver using intrinsic `Reflect.apply`. Later mutation of `api.tabs` or `tabs.sendMessage` cannot redirect later batches. Existing dense tab admission, id dedupe, structured message clone, no total-tab cap, 32-send concurrency ceiling, and per-tab failure isolation remain unchanged.

Focused repository coverage: `tests/tab-fanout-sender-capture-v450.test.js`.

## M451 — Documentation and exact-head release-gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized after the final repository edit. Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate and PR #7 remains draft.

Connector-created/edited regression coverage in this block is repository coverage only and was **not executed here**. No `npm ci`, `npm run check`, packaging, reproducibility, source qualification, qualification record, or real Chromium/Firefox execution is claimed by this block.
