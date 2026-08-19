# Milestones 411–419 — Recovery, runtime, and context lifecycle hardening

This block tightens mandatory recovery, guarded messaging, context-feedback ownership, background collaborators, and hostile collection boundaries without changing Drop Ads' privacy model, permission set, blocking precedence, retention policy, or release qualification requirements. Connector-created or connector-edited regression coverage is repository coverage only and was not executed as local/package/browser qualification in this workflow.

## Milestone 411 — Transactional policy-convergence listener installation

`installPolicyConvergence()` captures the required runtime-message, context-menu, and alarm event collaborators before registration. Listener installation is transactional: if a later browser `addListener()` fails, already-added listeners are best-effort removed in reverse order and no registration identity is published. Teardown reuses those captured collaborators, so mutable API namespace paths are not re-read during cleanup.

Repository coverage: `tests/policy-convergence-install-transaction-v411.test.js`.

## Milestone 412 — Transactional pending feedback and bounded guard rejection

Pending context-block feedback entries publish before their expiry timer is armed. Timer scheduling failure removes the just-published entry, and synchronous expiry cannot be overwritten by a stale returned timer handle. The existing **128 pending** ceiling and **60,000 ms maximum configured delay** remain unchanged.

The runtime-message guard also keeps generated validation failures within the reviewed **1,024-character** complete response ceiling, reads caught error detail only through an own data `message` descriptor, falls back to reviewed static text for hostile/oversized metadata, and contains a closed or throwing `sendResponse` channel.

Repository coverage includes `tests/context-feedback-pending-timer-v412.test.js` and the message-guard rejection regressions.

## Milestone 413 — Bounded convergence reasons and event discriminators

Direct `queueConvergence(reason)` callers must provide primitive, non-empty, already-trimmed, printable single-line text capped at **128 characters** before touching coalescing/rerun state or sync work. Runtime-message `type`, context-menu `menuItemId`, and alarm `name` routing values are descriptor-safe primitive strings capped at **64 characters**, reject control/line-separator text, and are never coerced before Set/equality or reason-construction work.

Repository coverage includes the policy-convergence reason and discriminator regressions.

## Milestone 414 — Transactional visible feedback and guarded listener identity

Visible context status ownership is tied to the exact status generation. Browser title/badge publication failure or visible-timer scheduling failure removes only that exact current status and best-effort restores neutral browser UI; synchronous expiry cannot be overwritten by a stale timer handle. The existing **128 visible** ceiling and browser-owned Protection-actions behavior remain unchanged.

The shared guarded `runtime.onMessage` adapter publishes logical wrapper identity before browser registration for synchronous callback correctness, rolls the identity back if browser `addListener()` throws, and permits retry. Removal releases logical identity before external browser teardown; a browser-retained wrapper is therefore inert even when `removeListener()` throws.

Repository coverage includes the visible-context publication and message-guard listener transaction regressions.

## Milestone 415 — Watchdog teardown and background logger collaborator capture

The persistent refresh watchdog captures the exact alarm event collaborator used for registration. Disposal marks the watchdog inactive before teardown, removes its listener best effort, and releases installation identity even if browser removal throws. Reinstallability, the persistent **30-minute** watchdog cadence, and non-forced refresh semantics remain unchanged.

`createBackgroundRuntime()` captures either bound default console callbacks or supplied own enumerable data-function `warn` and `error` collaborators before API capability inspection and startup work. Accessor/trapped/malformed logger metadata fails without normal property gets; later runtime paths use only the captured callbacks and diagnostic delivery is best effort.

Repository coverage includes the refresh-watchdog teardown and runtime-logger collaborator regressions.

## Milestone 416 — Transactional context-feedback listener lifecycle

Context feedback captures the context-menu and storage event collaborators before registration. The pair installs transactionally with reverse rollback on partial failure, and installation identity is published only after both listener registrations succeed. Disposal marks the registration inactive first, uses captured events with per-listener best-effort removal, releases pending/visible timer state independently of browser teardown success, and clears installation identity in a final cleanup path so reinstall remains possible.

The existing **128 pending / 128 visible / 60,000 ms** bounds and zero request/history observation remain unchanged.

Repository coverage includes the context-feedback listener lifecycle and teardown isolation regressions.

## Milestone 417 — Bootstrap collaborator and status-record resilience

Optional background feature status is stored as a frozen null-prototype record so admitted names such as `__proto__` and `constructor` are inert own data keys. Optional, mandatory-recovery, and core teardown callbacks are admitted/captured once with their original receivers rather than re-read from mutable registration objects. Bootstrap diagnostics remain best effort and cannot interrupt reverse optional → mandatory-recovery → distinct-core teardown.

If mandatory recovery installation or admission of its disposer fails after the core has already started, bootstrap invokes the captured core disposer best effort and then rethrows the original mandatory-startup failure. Synchronous cleanup throws and asynchronously rejected cleanup do not replace that original failure.

Repository coverage includes optional-status prototype handling, disposer capture, diagnostic isolation, and failed mandatory-startup rollback regressions.

## Milestone 418 — Revoked-Proxy collection containment

Personal network-rule/domain collection compatibility checks contain `Array.isArray()` failures: ordinary non-array values retain the reviewed empty-collection compatibility fallback, while revoked or throwing array-kind inputs fail deterministically before the shared dense-array boundary. Existing **10,000 personal network rule / 5,000 domain** ceilings remain unchanged.

List-cache storage root and nested JSON admission likewise contain revoked-Proxy array-kind failures instead of leaking native revocation errors. Existing plain-object/dense-array rules and the reviewed **256 cache entries / depth 32 / 1,000,000 JSON nodes / 8,000,000 UTF-8 bytes** storage ceilings remain unchanged.

Repository coverage includes the personal-rule and list-cache revoked-Proxy regressions.

## Milestone 419 — Documentation and exact-head release-gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized through the post-M418 implementation state. Issue #10 remains the authoritative Chromium + Firefox qualification gate, and PR #7 remains draft until clean exact-head machine preflight plus real browser observations are recorded against unchanged package hashes.

No local `npm ci`, repository test execution, package/release verification, reproducibility verification, source qualification, qualification-record generation, or browser qualification is claimed by this connector-only work.

## Privacy invariants

No milestone in this block adds telemetry, analytics, browsing/request history, retained blocked-request or matched-element history, page/DOM history, user/device identifiers, cookie-database access, a custom Drop Ads backend, new permissions, or executable remote code.
