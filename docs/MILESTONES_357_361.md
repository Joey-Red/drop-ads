# Milestones 357–361 — Content retention and lifecycle boundaries

This block finishes another set of page/content collaborator boundaries without expanding Drop Ads data collection, permissions, or retention. The changes are repository hardening only; connector-created regression files in this block were **not executed locally or in Chromium/Firefox here**.

## Milestone 357 — Context target timer failure cleanup

`createTargetMemory()` already limited remembered right-click targets to the production 10-second lifetime, but supplied timer collaborators could still break that retention promise. A throwing cancellation could abort `clear()` before the DOM reference was released, while a throwing or synchronously firing scheduler could strand remembered state or a stale timer handle.

The target memory now:

- invalidates the generation and clears `timer` / `remembered` before best-effort cancellation;
- never lets `clearTimeoutImpl` failure retain a target or escape cleanup;
- releases remembered state if scheduling fails before rethrowing the scheduling failure;
- detects a synchronous expiry during scheduling and best-effort cancels the returned stale handle rather than reinstalling it;
- preserves the existing `1..10,000 ms` direct TTL ceiling and stale-generation semantics.

Repository coverage: `tests/content-context-target-memory-timer-failure-v357.test.js`.

## Milestone 358 — Context target capture/default-base containment

Three remaining context-capture reads could escape before the reviewed URL and TTL gates: the omitted URL base read from `globalThis.location.href`, direct `nodeType` / `closest` access in explicit target selection, and the contextmenu event's `target` property.

The content helper now:

- resolves the implicit page base inside a containment boundary and remains string-only/non-coercive;
- keeps the previous `https://invalid.local/` fallback when location/href is simply absent, while a trapping location read fails closed;
- validates the initial resource target through a contained strict element check;
- contains `closest` lookup/invocation and keeps the nearest `a[href],area[href]` fallback only when the resulting element has a canonical live HTTP(S) URL;
- contains contextmenu `event.target` lookup so malformed events simply yield no remembered target.

The existing 16,384-character comparable URL ceiling and 10-second exact-target lifetime remain unchanged.

Repository coverage: `tests/content-context-target-capture-v358.test.js`.

## Milestone 359 — Picker event and target ownership containment

Picker composed-path and geometry reads were already bounded, but the live handlers still directly consumed `event.target`, `event.key`, `host.contains()`, and suppression methods.

The picker now:

- accepts a selectable event target only after a contained strict `nodeType === 1` check;
- reads event target/key without coercion and maps traps/type confusion to no target/key;
- contains host containment lookup/call before excluding closed-shadow-owned nodes;
- runs `preventDefault` / `stopImmediatePropagation` as best-effort inherited event methods so their failure cannot block Escape cleanup or selection logic;
- preserves mouse/focus targeting, Enter selection, Escape cancellation, picker-owned event exclusion, and the 2-minute lifecycle.

Repository coverage: `tests/content-picker-event-target-v359.test.js`.

## Milestone 360 — Cosmetic style teardown and reattachment containment

The cosmetic runtime's stale-policy recovery depended on DOM and observer cleanup methods not throwing. That was especially risky because `refresh()` already catches background/policy failures and then calls `removeStyle()`; a second failure there could leave stale CSS applied and turn recovery into another rejected path.

The runtime now:

- detaches internal observer/style references before invoking best-effort collaborator cleanup;
- neutralizes retained style text before attempting node removal, with parent `removeChild` as a fallback;
- contains observer disconnect, style connectivity, document parent lookup, append lookup/call, and removal operations;
- makes mutation-observer reattachment callbacks fail closed rather than throwing through the content event loop;
- preserves normal extension-owned style creation, page-removal reattachment, and removal when policy is disabled or the background is unavailable.

Repository coverage: `tests/content-cosmetic-style-lifecycle-v360.test.js`.

## Milestone 361 — Documentation and release-gate synchronization

This document and `ROADMAP.md` synchronize the development record through M361. Draft PR #7 remains a development PR, and Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate.

No `npm ci`, `npm test`, `npm run check`, packaging, release verification, reproducibility verification, source qualification, qualification-record generation, or real-browser execution is claimed from this connector-only work. Any current-head qualification still requires the clean machine sequence and observed Chromium/Firefox matrix documented in Issue #10.

## Privacy and product invariants unchanged

Nothing in M357–361 adds telemetry, analytics, browsing/request history, matched-element history, page/DOM snapshots, identifiers, cookie enumeration, a custom Drop Ads backend, new permissions, broader host access, or longer DOM retention. The work only narrows failure behavior at already-existing content-script boundaries.
