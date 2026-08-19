# Milestones 411–420 — Background lifecycle and collaborator hardening

This block hardens remaining background-event, timer, diagnostic, and failed-startup boundaries without changing Drop Ads privacy, permissions, retention, or product policy. Connector-created or connector-edited regression coverage described here is repository coverage only and was not executed as local/package/browser qualification in this workflow.

## Milestone 411 — Transactional policy-convergence listener installation

Mandatory policy convergence installs its runtime-message, context-menu, and alarm listeners as one transaction. A later browser `addListener()` failure removes earlier successful registrations in reverse order and publishes no installation identity, so a retry can install cleanly rather than inheriting a partial convergence layer.

Coverage: `tests/policy-convergence-listener-transaction-v411.test.js`.

## Milestone 412 — Transactional context-feedback pending timer publication

Context-feedback pending target retention fails closed around timer scheduling. Timer scheduling failure removes the staged pending target, and synchronous expiry cannot be overwritten by a stale returned timer handle. The existing pending-target lifetime and **128 pending** ceiling remain unchanged, and no page/request history is retained.

Coverage: `tests/context-feedback-pending-timer-v412.test.js`.

## Milestone 413 — Bounded direct policy-convergence reasons

Direct `queueConvergence()` reasons are primitive strings only, already trimmed, printable/single-line, non-empty, and at most **128 characters**. Invalid caller values are rejected before sync work or queue mutation and are never coerced through caller conversion hooks.

Coverage: `tests/policy-convergence-reason-v413.test.js`.

## Milestone 414 — Bounded policy-convergence event discriminators

Runtime message types, context-menu ids, and alarm names are read only through descriptor-safe own-data fields and must be non-empty printable strings no longer than **64 characters** before membership comparisons. Type-confused, accessor-backed, control-character, or oversized event discriminators fail closed without triggering convergence.

Coverage: `tests/policy-convergence-event-discriminator-v414.test.js`.

## Milestone 415 — Refresh-watchdog teardown identity isolation

The persistent due-source watchdog treats browser listener removal as best effort during disposal and always releases its installation identity. A throwing teardown collaborator cannot pin a stale watchdog registration or prevent a later install. The existing **30-minute**, non-forced serialized refresh behavior remains unchanged.

Coverage: `tests/refresh-watchdog-dispose-isolation-v415.test.js`.

## Milestone 416 — Transactional message-guard listener registration

The runtime message guard registers a staged wrapper with the browser before publishing it in the logical wrapper map. Synchronous browser registration failure leaves no false `hasListener()` identity and permits retry. Removal invalidates logical identity before best-effort browser removal so a retained stale wrapper is inert.

Coverage: `tests/message-guard-listener-transaction-v416.test.js`.

## Milestone 417 — Background-runtime logger collaborators

The core background runtime captures supplied `warn` / `error` through descriptor-safe own enumerable data fields before browser listener work, binds them once to their original logger receiver, and wraps every diagnostic callback as best effort. Logger failure cannot alter policy rollback, community preparation, import rescheduling, initialization, install/startup, context-menu, alarm, or storage-repair control flow.

Coverage: `tests/runtime-logger-collaborator-v417.test.js`.

## Milestone 418 — Transactional context-feedback listener lifecycle

Context-feedback installs its context-menu and storage-change listeners transactionally. Failure of a later registration removes earlier listeners and publishes no installation identity. Disposal removes both event listeners best effort, releases pending/visible state, and clears installation identity even if browser teardown misbehaves. The existing **128 pending / 128 visible / 60,000 ms** limits remain intact.

Coverage: `tests/context-feedback-listener-transaction-v418.test.js`.

## Milestone 419 — Failed-startup background-core rollback

If mandatory recovery installation or disposer capture fails after core startup, the already-started core receives one best-effort failed-startup disposal attempt before the original mandatory failure is rethrown. Synchronous and rejected asynchronous cleanup failures are contained and cannot replace the original startup error. Normal successful reverse optional → mandatory recovery → distinct core teardown is unchanged.

Coverage: `tests/background-bootstrap-mandatory-rollback-v419.test.js`.

## Milestone 420 — Documentation and exact-head release-gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized through M420. Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate, and PR #7 remains draft until clean package/source preflight plus real browser observations are completed against the same exact generated package hashes.

No `npm ci`, repository test suite, package/release verification, reproducibility check, source qualification, qualification record, Chromium run, or Firefox run is claimed from connector-only repository edits.

## Privacy invariants

No milestone in this block introduces telemetry, analytics, browsing/request history, retained matched-request or blocked-request statistics, page/DOM history, matched-element history, user/device identifiers, cookie database access, a custom Drop Ads backend, new permissions, or executable remote code.
