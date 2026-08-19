# Milestones 433–438 — Response, runtime, accessibility, and lifecycle resilience

This block reconciles concurrently landed hardening into one canonical post-M432 record. It adds no telemetry, analytics, browsing/request history, retained match/content history, identifiers, custom backend, permissions, or remote executable code. Connector-created or connector-edited regression coverage is repository coverage only and was not executed as local/package/browser qualification in this workflow.

## Milestone 433 — Remote response/body reader collaborator completion

Remote-list body admission snapshots the Response `body` once and captures receiver-bound `ReadableStream.getReader` / `Response.text` operations through a native-compatible boundary. Once a reader exists, receiver-bound `read` and optional `cancel` operations are captured before the loop and never re-read from the reader. Native Chromium/Firefox Response, ReadableStream, and reader prototypes remain supported; synthetic collaborators must expose safe own-data functions.

Streaming preference, text fallback, exact reader-result schemas, best-effort cancellation, fatal UTF-8, and the existing **5,000,000-byte** body ceiling remain unchanged.

Coverage includes `tests/list-reader-operations-v433.test.js` plus the existing response-body collaborator regressions. Connector-created coverage was not executed here.

## Milestone 434 — Runtime options and abort-signal collaborator snapshots

`createBackgroundRuntime(options)` consumes one frozen detached `runtimeOptionsSnapshot()` produced through the shared descriptor-safe own-data boundary after exact root validation. Constructor setup reads `api`, optional `fetchImpl`, optional `now`, and optional `logger` only from that snapshot.

The bounded response reader also admits its optional AbortSignal before body work. Native `AbortSignal.aborted` and EventTarget listener operations use the original receiver; synthetic signals require safe own-data boolean/function collaborators. Listener callables are captured before streaming and teardown is best effort, so mutable/accessor-shaped direct signals cannot redirect the read path or replace its outcome.

Coverage includes `tests/runtime-options-snapshot-v434.test.js` and `tests/list-abort-signal-v434.test.js`. Connector-created coverage was not executed here.

## Milestone 435 — Timeout AbortController and cleanup isolation

`withListDownloadTimeout()` captures the configured AbortController instance's signal and receiver-bound abort operation immediately after construction. Native AbortController prototype accessors/methods remain supported; synthetic injected controllers must be plain objects with safe own-data collaborators. Malformed controller results fail before timer/task work, and later timeout handling uses only the captured signal/abort pair.

Timer teardown is best effort, so a throwing configured clear callback cannot replace a successful task result or the actionable timeout/download failure. The reviewed **30,000 ms default / 120,000 ms maximum** deadline and abort-on-timeout semantics remain unchanged.

Coverage: `tests/list-timeout-controller-v435.test.js`. Connector-created coverage was not executed here.

## Milestone 436 — Prototype-safe cache dictionaries and popup site accessibility

`normalizeListCache()` returns null-prototype dictionaries for successful normalization and invalid-root fallback, so legal cache ids cannot collide with Object-prototype properties. Existing **256 root entries / 300,000 raw policy items / 8 MB persisted JSON** bounds and cache migration semantics remain unchanged.

The popup's site-control section is programmatically labelled by the visible current-site name, described by the existing help copy, exposes that site name as a semantic level-2 heading, and uses an atomic polite session-status region. Visual layout, keyboard behavior, hidden-until-applicable behavior, and matte styling remain unchanged.

Coverage includes `tests/cache-codec-normalized-dictionary-v436.test.js` and `tests/popup-site-accessibility-v436.test.js`. Connector-created coverage was not executed here.

## Milestone 437 — Popup Settings failure containment and convergence event ownership

The popup Settings action contains synchronous throws and rejected results from `runtime.openOptionsPage()` and routes bounded failure text through the existing status surface without adding retries or retained launch state.

Mandatory policy convergence captures runtime-message, context-menu-click, and alarm `addListener` / optional `removeListener` operations before registration through bounded descriptor/prototype inspection. Installation remains transactional, teardown uses only captured removers, and one removal failure cannot prevent the other independent event sources or registration identity from being released.

Coverage includes the existing popup Settings launch regression and `tests/policy-convergence-event-methods-v437.test.js`. Connector-created coverage was not executed here.

## Milestone 438 — Canonical documentation and exact-head release-gate synchronization

`ROADMAP.md` and draft PR #7 are synchronized through M438 without embedding a moving PR head SHA. Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate. Stale duplicate trackers for already-landed work are closed as superseded/completed rather than being treated as additional product changes.

No `npm ci`, `npm run check`, package/release verification, reproducibility verification, source qualification, qualification-record generation, Chromium run, or Firefox run is claimed from connector-only repository edits.
