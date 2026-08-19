# Milestones 417–422 — Background lifecycle hardening

This block consolidates the post-M416 background lifecycle work into one canonical sequence. It hardens bootstrap status publication, failed mandatory startup rollback, guarded runtime listener identity, context-feedback visible-state ownership, and context-feedback listener installation/teardown without changing Drop Ads permissions, privacy, retention, blocking precedence, or recovery semantics.

Connector-created or connector-edited regression coverage in this block is repository coverage only and was **not executed here** as local/package/browser validation.

## Milestone 417 — Prototype-safe optional feature status

Optional background feature installation status now uses a frozen null-prototype record. Admitted feature names such as `__proto__` and `constructor` therefore remain ordinary own data keys instead of interacting with inherited Object prototype behavior.

The existing **32 optional features / 64 characters per feature name** limits, duplicate-name rejection, best-effort optional failure handling, and captured-disposer behavior remain unchanged.

Coverage: `tests/background-bootstrap-status-prototype-v417.test.js`.

## Milestone 418 — Roll back a started core after mandatory startup failure

`bootstrapBackground()` captures the core disposer immediately after core startup. If mandatory recovery installation or mandatory disposer admission fails, the already-started core is disposed best effort before the original mandatory-startup failure is rethrown.

Synchronous cleanup throws and rejected cleanup results are diagnostic only and cannot replace the original mandatory failure. Successful startup retains the reviewed reverse optional teardown, then mandatory recovery, then distinct core ordering.

Coverage: `tests/background-bootstrap-mandatory-rollback-v418.test.js`.

## Milestone 419 — Transactional guarded-message listener identity

The guarded runtime-message event publishes logical listener identity before browser registration so a synchronous browser callback sees the intended registration. If browser `addListener()` throws, logical identity is rolled back and the same listener can retry cleanly.

Removal clears logical identity before calling the external browser event. If browser `removeListener()` throws, the retained wrapper is inert because its logical identity no longer matches, and the caller can reinstall the same listener. Duplicate-add suppression, `hasListener`, exact message schemas, other-group fallthrough, and `rejectUnknown` behavior remain unchanged.

Coverage: `tests/message-guard-listener-lifecycle-v419.test.js`.

## Milestone 420 — Transactional visible context-feedback publication

Visible right-click feedback owns each tab status by exact generation. Failure while publishing browser title/badge state releases only that current generation and best-effort restores neutral UI. Timer-arm failure does the same, while synchronous timer expiry cannot be overwritten by a stale returned timer handle.

Timer clear/reset failures are contained and do not retain visible status. Existing **128 visible statuses**, fallback-badge behavior, bounded timer configuration, and zero request/history observation remain unchanged.

Coverage: `tests/context-feedback-visible-status-v420.test.js`.

## Milestone 421 — Transactional and reinstallable context-feedback listener lifecycle

Context-feedback installation captures its context-menu and storage event collaborators and registers them transactionally. If the later listener add fails, earlier successful adds are removed best effort in reverse acquisition order and no installation identity is published.

Disposal commits the disposed guard before external removal, uses the captured event collaborators, isolates each listener-removal failure, releases pending and visible retained state independently, and clears installation identity in `finally`. Disposal remains idempotent and reinstall remains possible even if the browser refuses listener removal.

Coverage: `tests/context-feedback-listener-lifecycle-v421.test.js`.

## Milestone 422 — Documentation and exact-head release-gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized through this block. PR #7 remains draft and Issue #10 remains the authoritative exact-head Chromium + Firefox release gate. The next explicitly deferred implementation tracker is M423 for core background listener teardown.

No `npm ci`, `npm run check`, packaging, release verification, reproducibility verification, source qualification, qualification-record generation, or Chromium/Firefox observation is claimed by these connector-only changes. Any source commit after real browser observation invalidates that observation.

## Privacy and product invariants retained

- no telemetry, analytics, browsing/request history, retained matched-request statistics, matched-element/page history, user/device identifiers, cookie database, or custom Drop Ads backend
- no permission expansion and no remote executable code
- network precedence remains **personal allow > personal block > shared allow > shared block**
- cosmetic precedence remains **personal allow > personal hide > shared allow > shared hide**
- aggressive browser-local protection remains paired with persistent/session recovery controls
- GitHub community preparation remains optional and off by default
