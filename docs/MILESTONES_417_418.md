# Milestones 417–418 — Guard registration and mandatory-start rollback

This block closes two startup/lifecycle failure paths without expanding permissions, telemetry, analytics, browsing/request history, retained statistics, identifiers, backend requirements, or remote executable code. Connector-created or edited regression coverage described here is repository coverage only and was not executed as local/package/browser qualification.

## Milestone 417 — Transactional guarded runtime-message listener identity

The shared core runtime-message guard publishes the logical wrapper identity before browser registration so a synchronous callback can observe the correct live wrapper, but rolls that identity back if the browser `addListener()` collaborator throws. A later retry with the same logical listener can therefore register normally.

Removal releases logical identity before external browser teardown. If browser `removeListener()` throws, any browser-retained stale wrapper is inert because it no longer matches the wrapper map, and a later registration of the same logical listener remains possible. Existing duplicate-add suppression, `hasListener()`, exact message validation, other-group fallthrough, and `rejectUnknown` behavior are preserved.

Coverage: `tests/message-guard-listener-transaction-v414.test.js` (historical filename retained).

## Milestone 418 — Roll back a started core after mandatory-recovery startup failure

`bootstrapBackground()` captures the core disposer immediately after core startup. If mandatory policy-recovery installation or admission of its returned disposer fails, the already-started core is cleaned up best effort before the original mandatory-start failure is rethrown. Synchronous cleanup throws and asynchronously rejected cleanup results are contained so they cannot replace the original startup failure.

Successful startup behavior is unchanged: optional teardown remains reverse-order, followed by mandatory recovery and then a distinct core; once-only disposer capture and shared-registration identity semantics remain intact.

Coverage: `tests/background-bootstrap-mandatory-rollback-v415.test.js` (historical filename retained).

## Validation status

No claim is made here that `npm ci`, `npm run check`, packaging, release verification, reproducibility, source qualification, qualification-record generation, Chromium behavior, or Firefox behavior was executed or passed. Issue #10 remains the authoritative exact-head browser qualification gate and PR #7 remains draft.
