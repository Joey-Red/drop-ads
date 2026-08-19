# Milestones 411–416 — Recovery collaborator resilience

This block hardens recovery-layer listener, timer, discriminator, and watchdog lifecycle boundaries without expanding permissions, telemetry, browsing/request history, retained statistics, identifiers, backend requirements, or remote executable code. Connector-created or edited regression coverage is repository coverage only and was not executed as local/package/browser qualification in this workflow.

## Milestone 411 — Transactional policy-convergence listener installation

Mandatory policy convergence captures the runtime-message, context-menu, and alarm event collaborators before listener registration. Registration is transactional: if a later `addListener()` fails, every listener already added is removed best effort in reverse order, no WeakMap registration is published, and the original installation failure is rethrown. Normal teardown reuses those exact captured event collaborators rather than re-reading mutable API namespace paths.

Coverage: `tests/policy-convergence-install-transaction-v411.test.js`.

## Milestone 412 — Transactional context pending timer publication

Context feedback publishes a pending block entry before arming its expiry timer so a synchronous/custom timer callback sees the exact live entry. Timer scheduling failure removes the just-published entry, and a synchronously expired entry cannot be overwritten with a stale returned timer handle. The existing **128 pending** ceiling, configured timeout behavior, committed-state recovery, and zero request/history observation remain unchanged.

Coverage: `tests/context-feedback-pending-timer-v412.test.js`.

## Milestone 413 — Bound direct policy-convergence reasons

The public `queueConvergence(reason)` helper accepts only primitive, non-empty, already-trimmed, single-line printable strings of at most **128 characters** before touching rerun/coalescing state or invoking sync work. It does not coerce objects, boxed strings, proxies, or custom conversion hooks. ASCII/C1 controls and Unicode line/paragraph separators fail closed. Internally generated runtime/context/alarm reasons remain inside this same boundary.

Coverage: `tests/policy-convergence-reason-v413.test.js`.

## Milestone 414 — Bound policy-convergence event discriminators

Runtime-message `type`, context-menu `menuItemId`, and alarm `name` values are admitted only as descriptor-safe primitive strings that are non-empty, control-free, and at most **64 characters** before Set/equality or reason-construction work. Normal shipped routing remains unchanged and hostile oversized event-shaped data is rejected without coercion.

Coverage: `tests/policy-convergence-discriminator-v414.test.js`.

## Milestone 415 — Isolate refresh-watchdog teardown and release installation identity

The refresh watchdog captures the exact alarm event collaborator used for registration. Disposal marks the watchdog inactive before browser teardown, isolates listener-removal failure, and always releases its WeakMap installation identity so a throwing browser collaborator cannot pin a stale registration or prevent reinstall. Idempotent disposal, the persistent **30-minute** watchdog, and non-forced serialized refresh semantics remain unchanged.

Coverage: `tests/refresh-watchdog-teardown-v415.test.js`.

## Milestone 416 — Documentation and exact-head release-gate synchronization

This document, `ROADMAP.md`, draft PR #7, and Issue #10 are synchronized through the canonical M411–416 block. PR #7 remains draft and Issue #10 remains the authoritative exact-head Chromium + Firefox release gate. Repository coverage does not substitute for clean package/source preflight or real browser observations, and any source commit after browser observation invalidates those observations.

No `npm ci`, repository test execution, package/release verification, reproducibility verification, source qualification, qualification-record generation, Chromium run, or Firefox run is claimed from connector-only repository edits.

## Privacy invariants

No milestone in this block introduces telemetry, analytics, browsing/request history, retained blocked-request or matched-element history, page/DOM history, user/device identifiers, cookie-database access, a custom Drop Ads backend, new permissions, or executable remote code.
