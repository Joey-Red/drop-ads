# Milestone 446 — Supporting hardening reconciliation

This checkpoint reconciles independent hardening that landed around the canonical post-M437 development line. It does not renumber or replace already-recorded ROADMAP milestones.

## Captured bootstrap callbacks

Background bootstrap warning and disposer callbacks are captured with their original receiver and later invoked through `Reflect.apply`. The path no longer depends on `Function.prototype.bind` or any callback-owned `bind` property. Existing mandatory-startup rollback, reverse optional teardown, failure isolation, and best-effort diagnostics remain unchanged.

Focused repository coverage: `tests/background-bootstrap-callback-capture-issue648.test.js`.

## Accessible popup mutation busy state

`#popup-main` exposes `aria-busy`, and the popup uses a reference-counted busy guard across global protection, persistent site protection, session pause/resume, cookie exception, and picker-start mutations. Every acquired guard releases in a `finally` path. Passive storage rerenders and Settings navigation do not participate in the busy counter.

Focused repository coverage: `tests/popup-mutation-busy-issue647.test.js`.

## Regression alignment for already-reviewed boundaries

Additional focused behavior coverage locks in three boundaries that were already present on the development line:

- optional-feature status remains a frozen null-prototype dictionary even for names such as `__proto__`, `constructor`, and `toString`: `tests/optional-feature-status-prototype-issue646.test.js`;
- tab fanout uses a receiver-preserving captured `tabs.sendMessage` collaborator without callback-owned `bind`, and rejects accessor-shaped senders without getter execution: `tests/tab-fanout-sender-capture-issue642.test.js`;
- streamed remote-list reading continues to use captured receiver-bound `read` and optional `cancel` operations even if the reader object is mutated after admission: `tests/list-reader-operation-capture-issue649.test.js`.

## Validation and privacy status

These connector-created regression files are repository coverage only and were **not executed locally or in either browser here**. This checkpoint does not claim `npm ci`, `npm run check`, package/release verification, reproducibility, source qualification, or Chromium/Firefox runtime qualification.

No telemetry, analytics, browsing/request history, retained matched-element/page data, identifiers, custom backend, new permission, or retention expansion is introduced. PR #7 remains draft and Issue #10 remains the authoritative exact-head release gate.
