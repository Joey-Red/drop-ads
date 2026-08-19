# Milestones 417–421 — Background/runtime lifecycle completion

This block continues the fail-closed background hardening after M411–416 while preserving the shared Firefox + Chromium architecture, blocking precedence, transactional persistence, reviewed permissions, and zero-telemetry/zero-history privacy model. Connector-created or connector-edited regression coverage is repository coverage only and was **not executed as local/package/browser qualification** in this workflow.

## Milestone 417 — Transactional guarded-message lifecycle

The guarded `runtime.onMessage` adapter publishes logical wrapper identity before browser registration so synchronous callbacks see the correct live listener, rolls that identity back if browser `addListener()` throws, and permits retry with the same logical listener. Removal releases logical identity before browser teardown and leaves any browser-retained stale wrapper inert if removal fails.

Supporting lifecycle work in the same block captures the background core disposer immediately after core startup and invokes it best effort if mandatory recovery installation or mandatory disposer admission fails. The original mandatory-startup failure remains authoritative; successful teardown order remains reverse optional features, mandatory recovery, then a distinct core.

Coverage includes `tests/message-guard-listener-lifecycle-v414.test.js` and `tests/background-bootstrap-mandatory-rollback-v417.test.js` (historical message-guard filename retained).

## Milestone 418 — Descriptor-safe background diagnostics

`createBackgroundRuntime()` admits supplied logger `warn` and `error` callbacks only through own enumerable data fields, binds them once to the original receiver before API/listener setup, and never re-reads later logger mutation. Default console behavior remains supported and diagnostic delivery is best effort so a throwing logger cannot alter rollback recovery, community fallback, initialization fallback, alarm handling, or storage repair.

Context-feedback listener installation/teardown hardening completed alongside this milestone is retained as supporting lifecycle work: its context-menu and storage events are captured once, installed transactionally, torn down best effort, and pending/visible retained state plus installation identity are released even if browser listener removal fails.

Coverage includes `tests/runtime-logger-collaborator-v414.test.js`, `tests/context-feedback-listener-lifecycle-v418.test.js`, and `tests/context-feedback-teardown-v419.test.js` (historical filenames retained where applicable).

## Milestone 419 — Protection-actions captured storage event

Protection-actions captures the exact `storage.onChanged` event collaborator used for registration and uses that same event for teardown. Later API namespace mutation therefore cannot redirect removal away from the original listener source. Existing best-effort removal, inert-after-dispose behavior, WeakMap identity release, serialized preference synchronization, and browser-owned action-count privacy model remain unchanged.

Coverage: `tests/action-count-captured-storage-event-v419.test.js`.

## Milestone 420 — Primitive direct personal-domain flags

`setDomainFlag(values, domain, present)` and `setSiteDisabled(sites, domain, disabled)` require primitive booleans before domain normalization or collection work. Strings, numbers, nullish values, boxed booleans, objects, arrays, and proxies cannot select add/remove behavior through truthiness or conversion hooks. Existing canonical sorting/deduplication, non-array migration fallback, and the **5,000-domain** ceiling remain unchanged.

Supporting hardening completed during this sequence also contains revoked/throwing array-kind checks for personal network/domain collections before the shared dense-array boundary and captures context-feedback action/tab collaborators once with original receiver semantics.

Coverage includes `tests/personal-domain-flag-boolean-v421.test.js`, `tests/personal-rules-revoked-proxy-v419.test.js`, and `tests/context-feedback-collaborator-capture-v420.test.js` (historical filenames retained where implementation numbering moved during consolidation).

## Milestone 421 — Documentation and exact-head release-gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized through the canonical M417–421 lifecycle/collaborator block. PR #7 remains draft and Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate. The latest exact implementation head is recorded in Issue #10 rather than hardcoded in the PR body.

No `npm ci`, `npm run check`, package/release verification, reproducibility verification, source qualification, qualification-record generation, or real-browser qualification result is claimed from connector-only repository work. Any source commit after a real browser observation invalidates that observation for release qualification.

## Privacy invariants

No milestone in this block introduces telemetry, analytics, browsing/request history, retained blocked-request/matched-element statistics, page/DOM history, user/device identifiers, cookie-database access, a custom Drop Ads backend, new permissions, or remote executable code.
