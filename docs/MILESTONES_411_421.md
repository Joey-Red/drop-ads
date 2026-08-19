# Milestones 411–421 — Recovery, collaborator, and lifecycle hardening

This block continues Drop Ads' fail-closed background hardening while preserving the Firefox + Chromium shared architecture, blocking precedence, transactional persistence, and zero-telemetry/zero-history privacy model. Connector-created or connector-edited regression coverage described here is repository coverage only and was not executed as local/package/browser qualification in this work stream.

## Milestone 411 — Transactional mandatory convergence listener installation

`installPolicyConvergence()` captures the required runtime-message, context-menu, and alarm event collaborators before installation. Listener installation is transactional: if a later `addListener()` fails, every earlier listener is removed best effort in reverse order and no WeakMap registration is published. Normal disposal uses the captured event collaborators rather than mutable API namespace paths.

Coverage: `tests/policy-convergence-install-transaction-v411.test.js`.

## Milestone 412 — Transactional pending context-target timer publication

Context block feedback publishes a pending entry before timer arming so a synchronous timer callback can observe and expire the exact live entry. Timer scheduling failure removes the just-published entry, and a synchronously expired entry cannot later receive a stale returned timer handle. The existing **128 pending** ceiling and configured timeout semantics remain unchanged.

Coverage: `tests/context-feedback-pending-timer-v412.test.js`.

## Milestone 413 — Bounded direct convergence reasons

Direct policy-convergence reasons are primitive strings only, must be non-empty/already trimmed/single-line printable text, and are capped at **128 characters** before active/rerun bookkeeping changes. Hostile objects are not coerced. Existing one-in-flight-plus-one-rerun convergence behavior remains unchanged.

## Milestone 414 — Bounded convergence event discriminators

Runtime message types, context-menu ids, and alarm names used only to trigger mandatory convergence are accepted through own-data descriptor reads and capped at **64 characters**. Malformed, accessor, revoked, oversized, or control-character-bearing values fail closed without changing convergence state.

## Milestone 415 — Descriptor-safe background runtime logger capture

`createBackgroundRuntime()` admits supplied `warn` and `error` callbacks through own enumerable data descriptors, binds them once to the original logger receiver before API/listener setup, and does not re-read later logger mutation. Accessor-based logger methods are rejected without getter execution. Default console behavior remains supported.

Coverage: `tests/runtime-logger-collaborator-v414.test.js` (historical filename retained).

## Milestone 416 — Recovery collaborator documentation and exact-head synchronization

The first recovery block was synchronized in `docs/MILESTONES_411_416.md`, `ROADMAP.md`, draft PR #7, and Issue #10. That synchronization did not convert repository coverage into an execution or browser-qualification claim.

## Milestone 417 — Transactional message-guard listener lifecycle

The guarded runtime-message listener publishes logical wrapper identity before browser registration for synchronous callback correctness, rolls identity back if `addListener()` fails, and permits retry with the same logical listener. Removal releases logical identity before browser teardown, contains browser removal failure, and leaves any browser-retained stale wrapper inert.

## Milestone 418 — Roll back a started core after mandatory recovery startup failure

`bootstrapBackground()` retains the captured core disposer immediately after core startup. If mandatory recovery installation or admission of its disposer fails, the already-started core is disposed best effort before the original mandatory failure is rethrown. Synchronous cleanup throws or rejected cleanup promises do not replace the original startup failure. Successful startup/teardown ordering remains reverse optional features, mandatory recovery, then distinct core.

## Milestone 419 — Transactional context-feedback listener lifecycle and failure-isolated teardown

Context feedback captures its context-menu and storage event collaborators before listener work, installs both listeners transactionally, and publishes installation identity only after successful registration. Disposal marks the registration inactive first, removes each captured listener best effort, releases pending and visible timer/status retention independently, and clears installation identity in `finally`, so a browser-refused stale listener remains inert and reinstall remains possible.

Coverage includes `tests/context-feedback-teardown-v415.test.js` (historical filename retained).

## Milestone 420 — Personal collection array-kind containment

Personal network-rule and domain collection compatibility snapshots contain `Array.isArray()` failures explicitly. Ordinary non-array legacy values retain the reviewed empty-collection migration fallback, while revoked/throwing array-kind values fail deterministically instead of leaking a native revocation error. Existing **10,000 personal network-rule / 5,000 personal-domain** ceilings remain unchanged.

## Milestone 421 — Documentation and exact-head release-gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized through the additional M417–420 hardening above. PR #7 remains draft. Issue #10 remains the authoritative exact-head Chromium + Firefox release gate; repository coverage is preflight only and cannot substitute for clean exact-head package/source verification plus real-browser observations on the same package hashes.

## Privacy and product invariants retained

- no telemetry, analytics, browsing/request history, retained request/matched-rule statistics, page/DOM history, identifiers, or custom Drop Ads backend
- no permission expansion and no remote executable-code path
- network precedence remains **personal allow > personal block > shared allow > shared block**
- cosmetic precedence remains **personal allow > personal hide > shared allow > shared hide**
- third-party cookie protection, hard all-cookie mode, site/session recovery, external-list transaction semantics, and last-known-good behavior are unchanged
- malformed collaborator/event data fails closed rather than broadening access or silently truncating policy
