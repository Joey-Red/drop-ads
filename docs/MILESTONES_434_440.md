# Milestones 434–440 — Runtime and list boundary hardening

This block hardens shared array admission, refresh-watchdog collaborators, subscription activation, streamed response chunks, direct subscription admission, and core listener lifecycle. It does not change Drop Ads' Firefox + Chromium browser-local architecture, reviewed permissions, policy precedence, serverless design, retention model, or zero-telemetry/zero-history privacy invariants. Connector-created or edited regression coverage described here is repository coverage only and was not executed as local/package/browser qualification in this workflow.

## Milestone 434 — Make dense-array admission allocation-safe

The shared `snapshotDenseDataArray()` boundary validates actual own-key count and canonical in-range array index keys before allocating the detached result or scanning index descriptors. A hostile huge sparse array therefore fails from O(actual-own-key-count) metadata work instead of forcing an expected-index collection proportional to its declared length. Existing normal `Array.prototype`, max-length, revoked-Proxy, symbol/extra-property, enumerable-own-data, and detached-snapshot requirements remain unchanged.

Coverage: `tests/object-schema-dense-array-allocation-v420.test.js` (historical filename retained).

## Milestone 435 — Capture refresh-watchdog get/create collaborators once

Refresh-watchdog admission captures and receiver-binds `alarms.get` and `alarms.create` alongside the captured alarm event and refresh callback. The asynchronous `ready` path uses only those captured functions, so later mutation of the browser/injected API namespace cannot redirect alarm discovery or creation. The existing **30-minute** persistent schedule, no-reset-if-existing behavior, non-forced refresh, teardown isolation, and best-effort diagnostics remain unchanged.

Coverage: `tests/refresh-watchdog-collaborator-capture-v421.test.js` (historical filename retained).

## Milestone 436 — Fix uncached subscription-enable cache key

When an enabled configured subscription has no reusable cache entry and must be downloaded, the fetched cache entry is stored under the already validated requested `id`. The stale undefined `candidate.id` reference is removed. Built-in bundled fallback, existing-cache reuse, transactional activation/persistence, and returned `source: "fetched"` semantics remain unchanged.

Coverage: `tests/runtime-subscription-enable-cache-key-v422.test.js` (historical filename retained).

## Milestone 437 — Contain streamed byte-chunk type traps

Streamed response chunks first pass non-coercive `ArrayBuffer.isView()` admission before the existing `Uint8Array` / legitimate-subclass check. Proxy wrappers, including revoked Proxies, therefore fail as invalid byte chunks before `instanceof` can inspect them. Exact `{done,value?}` reader envelopes, terminal-value rules, byte ceilings, fatal UTF-8 handling, and best-effort reader cancellation remain unchanged.

Coverage: `tests/list-updates-byte-chunk-traps-v423.test.js` (historical filename retained).

## Milestone 438 — Make direct external-subscription admission descriptor-safe

Direct `addExternalSubscription(subscription)` calls now enter the existing descriptor-safe `normalizeSubscription(subscription)` boundary before any caller-owned spread/copy. Only the detached normalized subscription is copied to force `builtIn: false`. Existing id/title/format/source URL bounds, strict optional booleans, public-HTTPS admission, duplicate id/source checks, fetch behavior, and transaction ordering remain unchanged.

Coverage: `tests/runtime-external-subscription-admission-v425.test.js` (historical filename retained).

## Milestone 439 — Own and transactionally tear down core listeners

The core background runtime owns stable identities for the install, startup, context-menu, alarm, message, and storage listeners registered by `start()`. Registration records retain the exact browser event collaborators used. Partial listener startup rolls back earlier registrations, `dispose()` is idempotent and marks the runtime disposed before best-effort removal, stale browser-retained callbacks become inert, and a disposed runtime cannot be started again. Existing serialized queue and policy transaction semantics remain unchanged.

Coverage: `tests/runtime-listener-lifecycle-v423.test.js` (historical filename retained).

## Milestone 440 — Documentation and exact-head release-gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized through this block after the separate M427–433 core work-boundary block. PR #7 remains draft and Issue #10 remains the authoritative exact-head Chromium + Firefox release gate. Connector-only repository edits do not constitute `npm ci`, repository test execution, package/release verification, reproducibility verification, source qualification, qualification-record generation, or browser qualification. Any source commit after real browser observation invalidates that observation.

## Privacy invariants

No milestone in this block introduces telemetry, analytics, browsing/request history, retained blocked-request or matched-element history, page/DOM capture, user/device identifiers, cookie-database access, a custom Drop Ads backend, new permissions, or executable remote code.
