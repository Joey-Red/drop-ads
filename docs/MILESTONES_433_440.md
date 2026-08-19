# Milestones 433–440 — UI and runtime resilience

This block continues the privacy-first hardening line without expanding permissions, telemetry, analytics, browsing/request history, retained statistics, identifiers, remote code, or backend requirements. Connector-created or connector-edited regression coverage described here is repository coverage only and was not executed as local/package/browser qualification in this workflow.

## Milestone 433 — Recover popup setup after initial committed-state read failure

The popup contains an initial `drop-ads:get-ui-state` failure instead of aborting module setup. Global protection remains disabled until a committed snapshot is available, the bounded status path reports the failure, and Settings/storage/user controls continue wiring. A later valid committed-state refresh restores controls without synthesizing policy state.

Coverage: `tests/popup-initial-state-recovery-v433.test.js`.

## Milestone 434 — Capture bootstrap callbacks without callable property reads

Background bootstrap binds supplied/default warning callbacks plus optional/core/mandatory teardown callbacks through the intrinsic `Function.prototype.bind` path via `Reflect.apply`. Caller-controlled callable `.bind` properties are not read, while original-receiver semantics, callback validation, optional-feature isolation, teardown order/idempotence, and best-effort diagnostics remain unchanged.

Coverage: `tests/background-bootstrap-callable-bind-v434.test.js`.

## Milestone 435 — Contain direct cache-encoder collection array-kind failures

Direct cache network/cosmetic encoder collections enter trap-contained array-kind admission before dense-array work. Ordinary non-array compatibility remains an empty encoded collection, while revoked/uninspectable array-kind values fail deterministically rather than leaking native Proxy revocation failures. Canonical normalization/sorting and the existing **300,000 raw policy-item** ceiling remain unchanged.

Coverage: `tests/cache-codec-encoder-array-kind-v435.test.js`.

## Milestone 436 — Bound and contain core runtime response failures

Core background failure text is read only from an own-data `message` descriptor and is capped at **1,024 characters** with reviewed action-specific fallbacks. Settings-import source activation failure text is bounded across its prefix and detail. Every asynchronous core runtime success/failure response uses best-effort delivery, so a closed or throwing response channel cannot create a secondary unhandled failure after policy work resolves.

Coverage: `tests/runtime-response-boundary-v436.test.js`.

## Milestone 437 — Contain cosmetic runtime response-channel failures

Cosmetic runtime asynchronous success/failure replies use one best-effort response helper. Missing, non-function, closed, or throwing response callbacks cannot escape the async continuation. Existing exact payload schemas, the **1,024-character** cosmetic runtime error boundary, queue ordering, state/cache mutation, fanout, listener return values, and active/disposed semantics remain unchanged.

Coverage: `tests/cosmetic-runtime-response-channel-v432.test.js` (historical filename retained).

## Milestone 438 — Keep popup committed-state refresh queue recoverable

Popup storage synchronization clears its coalescing identity before committed-state refresh work. If `queueMicrotask()` scheduling itself fails, one direct best-effort render is attempted with the coalescing flag already released. Normal burst coalescing remains intact and later storage changes cannot be permanently wedged by scheduler failure.

Coverage: `tests/popup-render-queue-v434.test.js` (historical filename retained).

## Milestone 439 — Snapshot background runtime options exactly once

`createBackgroundRuntime(options)` performs exact-object validation and then detaches `api`, optional `fetchImpl`, optional `now`, and optional `logger` through the shared descriptor-safe field boundary exactly once. Constructor setup consumes only that frozen snapshot. Global `fetch`, `Date.now`, and console diagnostics remain defaults when the optional fields are absent.

Coverage: `tests/runtime-options-snapshot-v434.test.js` (historical filename retained).

### Supporting hardening in this block

Optional background feature names now apply the existing **64-character** ceiling to the raw string before trimming, retaining the non-empty/already-trimmed/unique-name contract and **32-feature** ceiling. Settings-import message coverage also reasserts the already-documented Milestone 396 character-length preflight before UTF-8 allocation while preserving the byte ceiling as authoritative for multibyte content.

Supporting coverage: `tests/background-bootstrap-feature-name-v435.test.js` and `tests/runtime-backup-text-preflight.test.js`.

## Milestone 440 — Documentation and exact-head release-gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized through M440. Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate and PR #7 remains draft until clean preflight plus real browser observations are completed against the exact same generated package hashes.

No `npm ci`, repository test suite, package/release verification, reproducibility check, source qualification, qualification record, Chromium run, or Firefox run is claimed from connector-only repository edits.

## Privacy invariants

These milestones introduce no telemetry, analytics, browsing/request history, retained matched-request/blocked-request statistics, page/DOM history, matched-element history, user/device identifiers, cookie database access, custom Drop Ads backend, new permissions, or executable remote-code path.
