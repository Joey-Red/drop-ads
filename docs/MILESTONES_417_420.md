# Milestones 417–420 — Context-feedback lifecycle resilience

This block continues the privacy-first recovery hardening line after the canonical M411–416 recovery/collaborator block. It changes optional right-click context-feedback lifecycle boundaries only; permissions, blocking semantics, telemetry policy, history retention, backend requirements, and remote-code policy are unchanged. Connector-created or edited regression coverage is repository coverage only and was not executed as local/package/browser qualification in this workflow.

## Milestone 417 — Transactional visible status publication

Visible right-click status ownership remains generation-based and capped at **128 visible statuses**. If browser title/badge publication fails, only the exact current status generation is released. If visible timeout scheduling fails, the exact current status is released and neutral UI is restored best effort. Synchronous expiry cannot be overwritten by a returned stale timer handle, and synchronous/rejected neutral-title or badge-reset failures are contained.

Coverage: `tests/context-feedback-visible-status-v417.test.js`.

## Milestone 418 — Transactional context-feedback listener lifecycle

Context feedback captures its context-menu and storage event collaborators before listener work. Unsupported optional browser surfaces still degrade to a no-op registration. When required surfaces are present, listener installation is transactional: if a later `addListener()` fails, already-installed listeners are removed best effort in reverse order, the original failure is rethrown, and no WeakMap installation identity is published. Successful teardown reuses those exact captured collaborators rather than re-reading mutable API namespace paths.

Coverage: `tests/context-feedback-listener-lifecycle-v418.test.js`.

## Milestone 419 — Failure-isolated teardown and reinstallability

Disposal commits the registration inactive before external teardown work. Browser listener-removal failures are isolated, pending and visible retained state is released independently, and installation identity is cleared in `finally`. Disposal remains idempotent; a stale listener that the browser refused to remove is inert because the disposed guard is committed before external teardown, and a new installation remains possible.

Coverage: `tests/context-feedback-teardown-v419.test.js`.

## Milestone 420 — Documentation and exact-head release-gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized through the canonical M411–420 recovery/context lifecycle line. PR #7 remains draft and Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate. The final exact implementation head is recorded on Issue #10 after all repository edits in this block.

Supporting hardening landed during this line—bounded message-guard rejection delivery/lifecycle and failed-startup mandatory-recovery rollback—is retained without consuming duplicate canonical milestone numbers.

No `npm ci`, repository test execution, package/release verification, reproducibility verification, source qualification, qualification-record generation, Chromium run, or Firefox run is claimed from connector-only repository edits. Any source commit after real browser observation invalidates that observation.

## Privacy invariants

No milestone in this block introduces telemetry, analytics, browsing/request history, retained blocked-request or matched-element history, page/DOM history, user/device identifiers, cookie-database access, a custom Drop Ads backend, new permissions, or executable remote code.
