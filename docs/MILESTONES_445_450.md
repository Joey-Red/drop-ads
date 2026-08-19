# Milestones 445–450 — Regression alignment, stream, timeout, and import hardening

This canonical post-M444 block reconciles concurrent regression metadata without rewriting prior ROADMAP history, then closes streamed-reader, timeout-admission, and import-guard boundaries. It adds no telemetry, analytics, browsing/request history, retained matched-element/page history, identifiers, custom backend, permissions, polling, remote executable code, or retention surface. Connector-created or connector-edited coverage described here is repository coverage only and was not executed as local/package/browser qualification.

## Milestone 445 — Reconcile post-M444 regression naming and metadata

Concurrent continuation work produced historical regression filenames and overlapping issue numbers that no longer matched the canonical ROADMAP sequence. M445 treats those suffixes as historical labels only, closes clearly superseded trackers, and preserves the underlying coverage without pretending that duplicate milestone numbers represent distinct product behavior. Popup accessibility/resilience improvements remain landed supporting hardening and are not discarded by the canonical numbering cleanup.

No product behavior or qualification result is created by this metadata reconciliation.

## Milestone 446 — Lock streamed reader operation ownership

Remote streamed-body readers capture required `read` and optional `cancel` operations once through native-compatible descriptor/prototype inspection and invoke them with the original reader receiver. Synthetic accessor methods are rejected without getter execution, callback-owned `bind` is never consulted, and schema/oversize/UTF-8/abort cancellation paths use only the captured cancel operation. The exact reader-result schema, **5,000,000-byte** response ceiling, fatal UTF-8 behavior, and timeout semantics remain unchanged.

Focused coverage includes the streamed-reader collaborator regressions retained under historical filenames.

## Milestone 447 — Arm list-download timeout before source-task admission

`withListDownloadTimeout()` now successfully arms the configured timer before source work is queued. A throwing timer implementation fails deterministically with zero task/network work. Synchronous expiry during timer arming aborts and fails without starting the task, releases any returned timer handle best effort, and cannot leave a stale active callback after cleanup. Normal asynchronous timeout races retain the **30,000 ms default / 120,000 ms maximum**, captured AbortController collaborators, abort-on-timeout behavior, and cleanup isolation.

Focused coverage includes `tests/list-timeout-arm-v439.test.js`; its suffix is historical from concurrent numbering and does not redefine canonical M447.

## Milestone 448 — Bound import-preflight failure responses

Import-guard asynchronous preflight failures serialize only an own-data `message` descriptor, without `instanceof`, coercion, or accessor execution. Safe standard Error text is retained only when non-empty and at most **1,024 characters**; otherwise a reviewed bounded fallback is used. Failure delivery through `sendResponse` is best effort, so a closed or throwing response channel cannot replace the actionable preflight failure with a new unhandled exception. Import discrimination, preflight-before-mutation ordering, the **16-source** activation budget, and no-retention behavior remain unchanged.

Focused coverage: `tests/import-guard-error-bound-v448.test.js`.

## Milestone 449 — Capture import-guard runtime event ownership

Import-guard construction captures `api.runtime`, `runtime.onMessage`, and the event `addListener` / optional `removeListener` collaborators through bounded descriptor/prototype data inspection. Wrapper identity is published before browser registration and rolled back if registration fails. Logical removal wins before best-effort captured browser removal, so a browser-retained stale wrapper is inert. Non-`onMessage` runtime functions are forwarded with receiver-preserving `Reflect.apply`; callback-owned `bind` is never consulted.

Focused coverage: `tests/import-guard-runtime-ownership-v449.test.js`.

## Milestone 450 — Documentation and exact-head release-gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized with the canonical M445–450 sequence. Exact branch identity belongs in the newest Issue #10 synchronization comment rather than a fixed SHA in PR metadata. Supporting popup, action-count, cache, session, and other concurrently landed hardening remains valid repository history but does not overwrite this canonical numbering.

PR #7 remains draft until a clean exact-head machine preflight plus real Chromium and Firefox observations satisfy Issue #10. No claim is made here that `npm ci`, `npm run check`, packaging, release verification, reproducibility, source qualification, qualification-record generation, Chromium behavior, or Firefox behavior was executed or passed. Any source commit after browser observation invalidates those observations.
