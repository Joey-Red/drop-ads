# Milestones 400–404 — Core helper and lifecycle resilience

This block closes four helper/lifecycle boundaries without changing Drop Ads' privacy model, permissions, blocking precedence, list sources, or retention behavior. Connector-created/edited regression coverage below is repository coverage only; it was not executed locally or in either browser here.

## Milestone 400 — Bound personal-rule conflict collection work

`src/core/rule-conflicts.js` previously used direct `.map()` / `.some()` iteration over caller collections. Conflict inspection now snapshots both personal block and personal allow inputs through the shared normal-dense-array boundary before canonical rule-key work.

Reviewed invariants:

- each conflict collection is capped independently at the existing **10,000 personal network rules**;
- sparse arrays, accessor entries, custom array prototypes, extra properties, symbols, revoked proxies, and other malformed array shapes fail closed through the shared snapshot boundary;
- no caller-controlled array iterator is used for admission;
- conflict semantics remain exact canonical network-rule-key equality;
- `isPersonalBlockOverridden()` uses the same bounded allow-collection path.

Repository coverage: `tests/rule-conflicts-boundary-v400.test.js`.

## Milestone 401 — Harden optional-feature status and disposer capture

`src/core/background-bootstrap.js` now treats optional feature status names and returned teardown collaborators as explicit data boundaries.

Reviewed invariants:

- status entries are published with own data descriptors, so names such as `__proto__` and `constructor` remain ordinary status keys without invoking Object-prototype setters;
- the status result remains a normal frozen plain object for compatibility;
- a returned optional registration's own `dispose` field is inspected through its property descriptor, never through a normal property get;
- when present, `dispose` must be an own enumerable data function;
- the disposer is captured once with the original registration receiver, so later mutation cannot alter teardown behavior;
- accessor/trapped/malformed disposer metadata is isolated as that optional feature's initialization failure and does not execute a getter;
- existing reverse-order, once-only optional teardown and warning isolation remain intact.

Repository coverage: `tests/background-bootstrap-registration-boundary-v401.test.js`.

## Milestone 402 — Contain refresh-watchdog synchronous collaborator failures

`src/core/refresh-watchdog.js` no longer assumes the captured non-forced refresh callback returns a promise without throwing first.

Reviewed invariants:

- the watchdog invokes `refreshListsOnce(false)` through a promise boundary, containing both synchronous throws and rejected promises;
- the refresh callback is captured once with its controller receiver;
- a supplied `warn` callback is captured once through the existing descriptor-safe own-data logger boundary and keeps its logger receiver;
- watchdog warning delivery is best effort, so a throwing logger cannot escape the alarm event or turn alarm-establishment failure into a rejected `ready` path;
- stale disposed callbacks do not emit late warnings;
- the persistent watchdog interval remains **30 minutes**, and only the watchdog alarm triggers the serialized non-forced refresh path.

Repository coverage: `tests/refresh-watchdog-sync-failure-v402.test.js`.

## Milestone 403 — Isolate policy-convergence logger and teardown failures

`src/core/policy-convergence.js` now isolates diagnostic and teardown collaborators so mandatory source-of-truth recovery does not depend on either one behaving perfectly.

Reviewed invariants:

- `syncRules` is captured once from an own data field and bound to the supplied controller receiver;
- a supplied `error` callback is captured once through the descriptor-safe logger boundary and bound to its logger receiver;
- convergence logging is best effort, so a throwing logger cannot abort the remembered rerun after a failed convergence pass;
- the existing one-in-flight plus one remembered rerun model remains unchanged;
- disposal independently attempts runtime-message, context-menu, and alarm listener removal;
- one throwing removal cannot prevent the other event sources from detaching;
- registration identity is released after disposal attempts so reinstall remains possible;
- disposal remains idempotent.

Repository coverage: `tests/policy-convergence-failure-isolation-v403.test.js`.

## Milestone 404 — Documentation and exact-head release-gate synchronization

This document, `ROADMAP.md`, draft PR #7, and Issue #10 are synchronized to the resulting exact branch head. The release decision is unchanged:

- PR #7 remains draft;
- Issue #10 remains the authoritative Chromium + Firefox exact-head qualification gate;
- repository regression coverage is preflight only and is not represented as executed local/package/browser validation;
- any later source commit invalidates browser observations collected for an older head;
- GitHub-hosted Actions runner allocation remains externally blocked by the account billing/spending-limit state and therefore proves neither success nor failure.

No telemetry, analytics, browsing/request history, retained matched-request or matched-element history, page/DOM snapshots, identifiers, cookie database access, custom Drop Ads backend, remote executable code, or permission expansion was introduced by Milestones 400–404.
