# Milestones 443–447 — UI and runtime resilience

This block follows the canonical M438–442 bootstrap collaborator block and continues the privacy-first hardening line without expanding permissions, telemetry, analytics, browsing/request history, retained statistics, identifiers, remote code, or backend requirements. Connector-created or connector-edited regression coverage described here is repository coverage only and was not executed as local/package/browser qualification in this workflow.

## Milestone 443 — Contain cosmetic runtime response-channel failures

Cosmetic runtime asynchronous success/failure replies use one best-effort response helper. Missing, non-function, closed, or throwing response callbacks cannot escape the async continuation. Existing exact payload schemas, the **1,024-character** cosmetic runtime error boundary, queue ordering, state/cache mutation, fanout, listener return values, and active/disposed semantics remain unchanged.

Coverage: `tests/cosmetic-runtime-response-channel-v432.test.js` (historical filename retained).

## Milestone 444 — Keep popup committed-state refresh queue recoverable

Popup storage synchronization clears its coalescing identity before committed-state refresh work. If `queueMicrotask()` scheduling itself fails, one direct best-effort render is attempted with the coalescing flag already released. Normal burst coalescing remains intact and later storage changes cannot be permanently wedged by scheduler failure.

Coverage: `tests/popup-render-queue-v434.test.js` (historical filename retained).

## Milestone 445 — Snapshot background runtime options exactly once

`createBackgroundRuntime(options)` performs exact-object validation and then detaches `api`, optional `fetchImpl`, optional `now`, and optional `logger` through the shared descriptor-safe field boundary exactly once. Constructor setup consumes only that frozen snapshot. Global `fetch`, `Date.now`, and console diagnostics remain defaults when optional fields are absent.

Coverage: `tests/runtime-options-snapshot-v434.test.js` (historical filename retained).

## Milestone 446 — Detach direct external-subscription input before normalization

Direct `addExternalSubscription(subscription)` first admits and detaches an exact descriptor-safe external record containing only `id`, `title`, `format`, `sourceUrl`, and optional `enabled`. Caller-supplied `builtIn` or unknown fields are rejected. The detached record is then normalized with `builtIn: false` forced internally before state/cache/network work. Existing subscription bounds, public HTTPS admission, duplicate id/source checks, fetch/cache behavior, and transactional activation/persistence remain unchanged.

Coverage: `tests/runtime-external-subscription-v427.test.js` plus the earlier `tests/runtime-external-subscription-boundary-v418.test.js` (historical filenames retained).

### Supporting regression alignment

Settings-import runtime-message coverage reasserts the already-documented Milestone 396 code-unit-length preflight before UTF-8 allocation while preserving the **1 MiB** UTF-8 byte ceiling as the authoritative multibyte gate.

Supporting coverage: `tests/runtime-backup-text-preflight.test.js`.

## Milestone 447 — Documentation and exact-head release-gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized through M447. Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate and PR #7 remains draft until clean preflight plus real browser observations are completed against the exact same generated package hashes.

No `npm ci`, repository test suite, package/release verification, reproducibility check, source qualification, qualification record, Chromium run, or Firefox run is claimed from connector-only repository edits.

## Privacy invariants

These milestones introduce no telemetry, analytics, browsing/request history, retained matched-request/blocked-request statistics, page/DOM history, matched-element history, user/device identifiers, cookie database access, custom Drop Ads backend, new permissions, or executable remote-code path.
