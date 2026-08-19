# Milestones 478–482 — Settings live-sync resilience and collaborator ownership

This canonical block follows the already documented M468–472 Options resilience and M473–477 regression-reconciliation work. It keeps Settings usable when optional live synchronization or microtask scheduling fails and moves storage-listener registration onto one reviewed descriptor-safe collaborator boundary.

Connector-created or connector-edited regression coverage in this block is repository coverage only and was **not executed locally, packaged, or run in Chromium/Firefox** in this workflow.

## Milestone 478 — Main Settings live-sync recovery

The main Settings surface treats `storage.onChanged` live synchronization as optional rather than a prerequisite for direct controls. Registration failure is contained and surfaces bounded status text explaining that direct changes still work. Storage-triggered render coalescing clears its pending identity before committed-state refresh work and falls back to a direct best-effort render if `queueMicrotask()` throws, preventing a permanently wedged refresh queue.

Relevant-change discrimination, internal-mutation suppression, committed-state reads, transaction semantics, and no-polling behavior are unchanged.

Coverage: `tests/options-main-live-sync-resilience-s2.test.js`.

## Milestone 479 — Shared descriptor-safe Settings storage listener capture

`src/core/options-boundary.js` exposes `installOptionsStorageListener()`, which captures `storage`, `storage.onChanged`, and `addListener` through data-property-only inspection with the explicit **8-prototype-level** Settings collaborator ceiling. Accessor/trapped/missing shapes fail without executing getters, and listener registration uses `Reflect.apply` with the captured event object as receiver.

Cosmetic, Country, and Protection action-count Settings use this boundary while retaining their existing failure messaging, change filtering, mutation suppression, and direct-control behavior.

Coverage: `tests/options-storage-listener-capture-v467.test.js`.

## Milestone 480 — Protection action-count Settings live sync

The Protection action-count checkbox now follows committed changes to `ACTION_COUNT_PREFERENCE_KEY` from other surfaces. It uses the shared listener-capture boundary plus the existing relevant-change discriminator, suppresses redundant rereads while its own mutation is active, and contains registration or committed-reread failures with bounded status text.

Unsupported-browser degradation, mutation rollback/recovery, browser-owned aggregate semantics, and the zero request-history/telemetry model are unchanged.

Coverage: `tests/action-count-settings-live-sync-v466.test.js`.

## Milestone 481 — Main Settings adopts the shared listener boundary

The main Settings surface also routes live-sync registration through `installOptionsStorageListener()` and no longer directly dereferences `api.storage.onChanged.addListener`. Its M478 registration-failure containment and scheduler recovery remain unchanged while browser collaborator ownership now matches the other Settings surfaces.

Coverage: `tests/options-main-storage-listener-v481.test.js`.

## Milestone 482 — Documentation and exact-head release synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized after M478–481 while preserving the already documented M468–472 and M473–477 sequences. Exact head identity is recorded only in the newest Issue #10 synchronization comment rather than hardcoded in this document or PR body.

PR #7 remains draft until the exact same head passes the clean machine preflight/package/source-qualification sequence and real Chromium plus Firefox qualification described in Issue #10. Any source commit after browser observation invalidates those observations.

## Privacy and validation invariants

Nothing in M478–482 adds telemetry, analytics, browsing history, request history, retained matched-rule/blocked-request history, page/DOM history, identifiers, polling, a custom Drop Ads backend, new permissions, or retention expansion. No `npm ci`, `npm run check`, package/release/reproducibility/source-qualification command, Chromium run, or Firefox run is claimed as executed by this connector-only block.
