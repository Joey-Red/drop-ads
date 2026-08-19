# Supporting hardening — tab, context, import, and session collaborators

This note records concurrently landed hardening without redefining the canonical `ROADMAP.md` milestone sequence. Historical issue/test suffixes created during concurrent work are identifiers only; the ROADMAP remains authoritative for canonical milestone numbering.

## Tab fanout sender ownership

`src/core/tab-fanout.js` captures `tabs.sendMessage` through bounded descriptor/prototype inspection and invokes the captured callable with `Reflect.apply` against the original tabs receiver. Callback-owned `bind` is never consulted. Dense tab admission, id dedupe, structured-cloned messages, no total-tab cap, the existing 32-send concurrency ceiling, and per-tab rejection isolation are preserved.

Focused repository coverage: `tests/tab-fanout-sender-capture-v445.test.js`.

## Context-feedback collaborator ownership

`src/core/context-feedback.js` captures context-menu/storage event add/remove collaborators plus action title/badge, optional tab messaging, storage.local reads, and action-count capability through bounded descriptor/prototype inspection. Listener installation remains transactional with reverse rollback; teardown uses captured removers after logical state is released. The existing 128 pending / 128 visible / 60,000 ms ceilings, repeated-block recovery, exact-target cleanup, and browser-owned action-count behavior remain unchanged.

Focused repository coverage: `tests/context-feedback-collaborator-capture-v446.test.js`.

## Import-preflight boundaries

`src/core/import-guard.js` contains revoked/throwing `Array.isArray()` failures for candidate/current state subscription collections before the existing dense 128-subscription work boundary. Ordinary non-array compatibility fallback remains unchanged, and the 16 uncached enabled source activation ceiling is preserved.

Import-preflight failure text is admitted only from an own data `message` descriptor, capped at 1,024 characters, and otherwise replaced with a reviewed fallback. Asynchronous failure response delivery is best effort so a closed response channel cannot create a replacement failure.

The guard also captures raw runtime/onMessage identity and listener add/remove collaborators once, publishes logical wrapper identity before registration with rollback on add failure, releases identity before best-effort removal, and forwards non-onMessage runtime functions through `Reflect.apply` instead of callback-owned `bind`.

Focused repository coverage:

- `tests/import-guard-subscription-array-kind-v447.test.js`
- `tests/import-guard-error-bound-v448.test.js`
- `tests/import-guard-runtime-event-v449.test.js`

## Session-storage collaborator ownership

`src/core/session.js` contains storage/session namespace inspection and captures required session `get` / `set` operations through bounded descriptor/prototype inspection. Captured methods execute with `Reflect.apply` against the original session-storage receiver. Missing `storage.session` still produces the reviewed default session on load and explicit unavailable error on save. Exact session envelope validation, strict write normalization, and the existing 5,000-domain ceiling remain unchanged.

Focused repository coverage: `tests/session-storage-method-capture-v450.test.js`.

## Validation and privacy status

The regression files above are repository coverage only. Connector-created or connector-edited coverage was **not executed** in this work; no `npm` preflight/package/release commands and no Chromium or Firefox qualification are claimed.

This supporting block adds no telemetry, analytics, browsing/request history, matched-element/page-content retention, identifiers, custom backend, permissions, or statistics storage. PR #7 remains draft and Issue #10 remains the authoritative exact-head browser qualification gate.
