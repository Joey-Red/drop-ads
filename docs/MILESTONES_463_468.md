# Milestones 463–468 — Convergence, Settings recovery, message-guard, and regression alignment

This continuation follows the canonical M458–462 remote-stream block. It adds no telemetry, analytics, browsing/request history, retained request/match/page history, identifiers, custom backend, new permissions, polling, remote executable code, or retention surface. Connector-created or connector-edited regression coverage described here is repository coverage only and was **not executed as local/package/browser qualification**.

## Milestone 463 — Capture policy-convergence API namespaces without ordinary reads

Policy convergence admits `runtime`, `runtime.onMessage`, `contextMenus`, `contextMenus.onClicked`, `alarms`, and `alarms.onAlarm` through bounded descriptor/prototype data-property inspection under the existing **depth-8 collaborator ceiling**. Accessor/trapped namespace/event properties fail closed without getter execution; admitted event add/remove operations remain captured once with their original receiver. Transactional reverse listener rollback, teardown isolation, bounded discriminator/reason text, idempotent reinstall behavior, and one-active-plus-one-rerun convergence remain unchanged.

Coverage: `tests/policy-convergence-namespace-capture-v463.test.js`.

## Milestone 464 — Restore Country Settings row controls after refresh failure

Country rule removal and mode-change operations retain the exact row/control that began the mutation. The row publishes `aria-busy="true"` while the operation is active. In `finally`, the original row clears busy state and the original remove button/mode select is re-enabled only if those nodes are still connected. If a successful committed-state rerender replaced the row, the detached controls are intentionally left untouched. Committed-success status wording, bounded caught errors, policy transactions, and focus recovery remain unchanged.

Coverage: `tests/options-country-row-recovery-v464.test.js`.

## Milestone 465 — Capture message-guard runtime collaborators once

The runtime message guard captures `api.runtime`, `runtime.onMessage`, required `addListener`, and optional `removeListener` through bounded **depth-8** descriptor/prototype data-property inspection. Captured listener methods preserve their original event receiver through `Reflect.apply`; accessor/trapped collaborator shapes fail closed without getter execution. Wrapper identity, duplicate-listener suppression, failed-registration rollback, logical-removal-first semantics, group routing, exact message schemas, and the **1,024-character** guard error ceiling remain unchanged.

Coverage: `tests/message-guard-runtime-capture-v465.test.js`.

## Milestone 466 — Regression-align remote chunk-count coverage

The canonical M460 implementation already bounds one streamed remote body at **65,536 admitted nonterminal chunks**, rejects one-over before byte accounting/decoder work, and attempts captured-reader cancellation. M466 adds focused source-alignment coverage without renumbering or changing that source boundary.

Coverage: `tests/remote-stream-chunk-count-v466.test.js`.

## Milestone 467 — Regression-align streamed reader lock release

The canonical M461 implementation already captures optional receiver-bound `releaseLock()` alongside `read()` / `cancel()` and releases the stream lock best effort from the outer read `finally` on success and contained failure paths. M467 adds focused source-alignment coverage without renumbering or changing M461 behavior.

Coverage: `tests/remote-stream-release-lock-v467.test.js`.

## Milestone 468 — Documentation and exact-head release-gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized through this continuation while retaining the established M458–462 canonical stream history. Exact branch identity is recorded in the newest Issue #10 synchronization comment rather than hardcoded into PR metadata.

No `npm ci`, `npm run check`, package/release verification, reproducibility verification, source qualification, qualification-record generation, Chromium execution, or Firefox execution is claimed by these connector-only changes. PR #7 remains draft until Issue #10 is completed against one unchanged exact package head.

## Privacy invariants

No milestone in this block introduces telemetry, analytics, browsing/request history, retained blocked-request or matched-element statistics, page/DOM history, user/device identifiers, cookie-database access, a custom Drop Ads backend, new permissions, or remote executable code.
