# Settings and runtime hardening continuation checkpoint

This checkpoint records the continuation work landed on `agent/bootstrap-core` while canonical milestone documentation is being reconciled by the active roadmap synchronization trackers. It does not redefine milestone numbering.

## Landed work

- Country Settings restores row busy/disabled state only for still-connected stale controls when a committed remove/mode mutation cannot refresh its view; successful rerenders leave detached controls untouched.
- Protection action-count Settings live-syncs its committed preference, suppresses self-triggered refresh during direct mutation, and uses monotonic generations so stale asynchronous reads cannot overwrite newer committed UI state.
- Cosmetic, Country, and Protection action-count Settings register storage live-sync through one descriptor-safe bounded collaborator boundary that preserves the event receiver with `Reflect.apply` and rejects accessor/trapped collaborators without getter execution.
- Policy convergence receiver-ownership coverage verifies prototype-style events and controller methods keep their intended receivers without callback-owned `.bind`, and accessor-backed namespaces fail without getter execution.
- Action-count duplicate-install coverage verifies the existing-registration fast path returns before later logger/browser collaborator recapture, does not create duplicate listeners, and still permits reinstall after disposal.
- Cosmetic runtime namespace ownership coverage records descriptor-safe capture of runtime/storage/tabs namespaces, message/storage events, and the receiver-bound `tabs.query` collaborator before listener publication.
- Settings subscription mutation results reuse the canonical subscription-title text predicate, aligning returned UI collaborator titles with configured-subscription control-character and line-separator restrictions.

## Validation boundary

Connector-created or connector-edited regression files in this continuation are repository coverage only. No `npm ci`, `npm run check`, package/release verification, reproducibility run, source qualification, qualification-record generation, Chromium observation, or Firefox observation is claimed here.

PR #7 must remain draft and Issue #10 must remain open until clean exact-head preflight and real Chromium + Firefox qualification are completed against the same generated package hashes. No telemetry, analytics, browsing/request history, retained matched-element/page history, identifiers, polling, custom backend, new permissions, or retention expansion is introduced by this continuation.
