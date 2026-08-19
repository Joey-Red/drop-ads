# Milestones 438–444 — Post-M437 collaborator and lifecycle hardening

This canonical post-M437 block completes listener, remote-stream, cache, response-channel, and direct-subscription boundaries without expanding permissions, telemetry, analytics, browsing/request history, matched-element/page history, identifiers, retention, remote executable code, or backend requirements. Connector-created or edited regression coverage described here is repository coverage only and was not executed as local/package/browser qualification.

## Milestone 438 — Own background-core listener and queue lifecycle

The core background runtime owns stable identities for the listeners installed by `start()`, rolls back partial registration transactionally, and exposes idempotent teardown. Browser event `addListener` and optional `removeListener` collaborators are captured once through bounded descriptor/prototype data-function inspection (**maximum prototype depth 8**) and invoked with their original receiver; later accessor/method replacement cannot redirect rollback or disposal. Disposal marks retained callbacks inert before best-effort browser listener removal.

The shared serialized task queue also rejects newly admitted work after disposal and rechecks disposal when an already-admitted queued task reaches execution. Work already running may finish, queued-but-not-started work cannot begin after teardown, and `whenIdle()` can still drain admitted work directly. Existing policy transactions and one-shot MV3 startup behavior remain unchanged.

Focused repository coverage includes `tests/runtime-event-collaborators-v441.test.js` and `tests/runtime-dispose-queue-v443.test.js` (historical filenames retained from concurrent issue numbering).

## Milestone 439 — Capture abort-signal collaborators

Remote-list body reads capture abort state plus listener operations before reader work. Native `AbortSignal.aborted` and `EventTarget` add/remove methods are invoked with the original signal receiver; synthetic signals require descriptor-safe own-data state/functions. The read loop and cleanup no longer perform ordinary live signal method reads, malformed later synthetic aborted state fails closed, and listener cleanup is best effort.

Focused repository coverage includes `tests/list-abort-signal-capture-v434.test.js` plus the canonical abort-signal regression files retained in-tree.

## Milestone 440 — Capture timeout and fallback-response collaborators/work bounds

`withListDownloadTimeout()` captures the constructed AbortController's signal and receiver-bound abort operation before timer/task work. Native platform accessors/methods and safe injected collaborators are supported. Timer cleanup is best effort, so a throwing clear callback cannot replace a successful task result or the actionable timeout/error outcome. The reviewed **1–120,000 ms** timeout range and abort-on-timeout semantics are unchanged.

Configured core list-refresh scheduling likewise captures receiver-bound `alarms.clear` and `alarms.create` once, awaits both void/synchronous and promise-returning implementations, and surfaces create failure instead of reporting false scheduling success. The existing configured **60-minute minimum** remains unchanged.

For non-streaming `Response.text()` fallback, an obvious `text.length > byteLimit` is rejected before `TextEncoder` allocation while the exact UTF-8 byte-length check remains the authoritative second gate for multibyte text. Streaming behavior and the active caller-supplied byte limit are unchanged.

Focused repository coverage includes `tests/list-timeout-controller-v440.test.js`, `tests/list-fallback-text-preflight-v439.test.js`, and `tests/runtime-alarm-scheduler-v442.test.js` (historical filenames retained).

## Milestone 441 — Contain direct cache-encoder array-kind failures

Direct network and cosmetic cache encoders contain revoked/uninspectable collection array-kind failures before dense-array work. Ordinary non-array inputs retain the reviewed empty encoded-collection compatibility fallback. The existing **300,000 raw policy-item** ceiling, dense-array admission, canonical normalization, deterministic sorting, and pack semantics remain unchanged.

## Milestone 442 — Contain cosmetic response-channel failures

Cosmetic runtime asynchronous success/failure delivery is best effort. Missing, closed, or throwing response channels cannot escape asynchronous continuations or alter policy mutation and queue outcomes. Exact response schemas and the existing **1,024-character** cosmetic runtime failure-text bound remain unchanged.

## Milestone 443 — Qualify direct external-subscription rejection ordering

Direct external-subscription admission detaches the exact `id`, `title`, `format`, `sourceUrl`, and optional `enabled` payload before normalization or state/cache/network work. Caller-supplied `builtIn` and unknown fields are rejected, accepted records force `builtIn: false` internally, and malformed/accessor-backed candidates perform no source fetch. Existing public-HTTPS, string, transaction, and cache-provenance rules remain unchanged.

## Milestone 444 — Capture streamed reader operations once and synchronize the exact-head gate

After response-body admission, remote-list readers capture receiver-bound `read` and optional `cancel` operations once. Native `ReadableStreamDefaultReader` prototype methods remain supported; synthetic readers require safe own-data functions. The loop and error cleanup use only captured operations, cancellation remains best effort, and exact reader-result schemas, fatal UTF-8, and the **5,000,000-byte** body ceiling remain unchanged.

This detailed record, the existing `ROADMAP.md` M438–444 block, draft PR #7, and Issue #10 form the synchronization boundary for the block. Exact branch-head identity is recorded only in the newest Issue #10 synchronization comment after the final repository edit, not hardcoded in this document or the PR body.

## Validation and privacy status

No claim is made here that `npm ci`, `npm run check`, packaging, release verification, reproducibility, source qualification, qualification-record generation, Chromium behavior, or Firefox behavior was executed or passed. PR #7 remains draft and Issue #10 remains open until clean exact-head preflight and real Chromium + Firefox observations are recorded against the same source/package hashes.

No milestone in this block introduces telemetry, analytics, browsing/request history, retained request/rule/matched-element statistics, page/DOM history, user/device identifiers, cookie-database access, a custom Drop Ads backend, new permissions, or executable remote code.
