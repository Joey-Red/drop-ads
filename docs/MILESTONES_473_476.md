# Milestones 473–476 — Settings live-sync collaborator boundary completion

This block follows the canonical M468–472 Options refresh-resilience sequence. It closes the remaining Settings storage live-sync collaborator gap and locks the shared boundary across all shipped Settings surfaces. Connector-created or connector-edited regression coverage referenced here is repository coverage only and was **not executed locally or in a browser**.

## Milestone 473 — Shared descriptor-safe Settings storage listener registration

`installOptionsStorageListener()` is the common browser-collaborator boundary for Settings live synchronization. It captures `storage`, `storage.onChanged`, and `addListener` through bounded descriptor/prototype data-property inspection under the existing **8-level** Settings collaborator depth ceiling, then invokes the captured listener method with its owning event receiver via `Reflect.apply`.

Cosmetic, Country / region, and Protection action-count Settings use this helper. Accessor-shaped or trapped namespaces/events fail closed without getter execution, while prototype-style WebExtension collaborators remain supported. Each surface retains its existing bounded registration-failure guidance and remains usable for direct controls without polling.

Coverage: `tests/options-storage-listener-boundary-v473.test.js`.

## Milestone 474 — Main Settings live-sync and scheduler recovery

Main Settings now uses the same `installOptionsStorageListener()` boundary rather than direct `api.storage.onChanged.addListener` access. Registration failure remains optional: direct controls and committed-state reads stay available and the existing bounded status explains that automatic synchronization is unavailable.

The main committed-state render queue also clears its coalescing identity before render work and falls back to one direct best-effort render when `queueMicrotask()` throws. Relevant-change filtering and internal-mutation suppression remain unchanged, with no polling or inferred local policy state.

Coverage: `tests/options-main-live-sync-v474.test.js`.

## Milestone 475 — Cross-surface live-sync regression audit

A release-facing structural audit locks the shared boundary across all four shipped Settings modules: main, Cosmetic, Country / region, and Protection action count. The audit rejects reintroduction of direct `api.storage.onChanged.addListener()` calls, preserves the user-visible direct-control guidance for registration failure, and verifies scheduler recovery remains present on the three committed-state render queues.

Coverage: `tests/options-storage-live-sync-audit-v475.test.js`.

## Milestone 476 — Documentation and exact-head release synchronization

This document is the canonical detailed record for M473–476. Draft PR #7 is synchronized without hardcoding its moving branch head. Because multiple writers are concurrently extending the same branch, this block deliberately does **not** replace `ROADMAP.md` from a potentially stale whole-file snapshot; the collision-safe detailed record remains authoritative for this block until the next consolidated ROADMAP reconciliation.

Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate. The newest synchronization comment records the exact branch head after the final repository edit. Any source change after real browser observation invalidates that observation for qualification.

## Qualification implications

Exact-head qualification must confirm:

- all Settings surfaces continue to live-sync committed local state when `storage.onChanged` is available;
- browser namespace/event collaborator accessors or registration failures cannot abort Settings direct controls;
- main/Cosmetic/Country queued refreshes recover if microtask scheduling fails;
- internal mutation suppression prevents redundant self-refresh while external/legacy changes still update the view;
- no polling, synthetic local policy mirror, browsing/request history, page/DOM capture, identifiers, or telemetry is introduced.

No `npm ci`, `npm run check`, package/release verification, reproducibility verification, source qualification, qualification-record generation, Chromium run, or Firefox run is claimed as executed by this connector-only block.
