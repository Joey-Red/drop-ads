# Milestones 468–472 — Options refresh resilience

This block follows the independently completed M461–467 message/subscription sequence and hardens the Cosmetic and Country / region Settings surfaces against scheduler, rerender, and optional live-sync failures. The focused regression files were created before that concurrent numbering became visible, so their historical `v461`–`v464` suffixes are intentionally retained.

Connector-created or connector-edited regression coverage in this block is repository coverage only and was **not executed locally or in a browser**.

## Milestone 468 — Cosmetic committed-render queue recovery

`src/options/cosmetics.js` clears its render-coalescing identity before committed-state render work begins. If `queueMicrotask()` throws while scheduling a storage-triggered cosmetic refresh, Settings falls back to one direct best-effort render instead of leaving the queue permanently latched. Normal burst coalescing and internal-mutation suppression remain unchanged.

Coverage: `tests/options-cosmetic-render-queue-v461.test.js`.

## Milestone 469 — Country committed-render and relabel scheduling recovery

`src/options/country.js` coalesces relevant storage-triggered country refreshes through one pending-render identity, releases that identity before render work starts, and falls back to one direct best-effort render if microtask scheduling fails. Post-render personal-list relabel scheduling has the same direct fallback while existing MutationObserver relabel support remains intact.

Coverage: `tests/options-country-render-queue-v462.test.js`.

## Milestone 470 — Country stale-control restoration

Country row remove and mode-change operations retain the exact owning row, publish row-level `aria-busy`, and restore a still-connected stale remove button or mode select in `finally` when a follow-up committed-state render cannot replace it. Successful rerenders leave detached old controls untouched. Existing committed-success status, focus recovery, and transaction semantics are preserved.

Coverage: `tests/options-country-control-recovery-v463.test.js`.

## Milestone 471 — Optional Settings live-sync registration containment

Cosmetic and Country Settings treat `storage.onChanged` registration as optional live synchronization rather than a prerequisite for direct controls. If registration throws, the page remains usable for direct mutations and committed-state reads and exposes a bounded status explaining that automatic synchronization is unavailable. No polling or inferred local policy state is introduced.

Coverage: `tests/options-storage-live-sync-v464.test.js`.

## Milestone 472 — Documentation and exact-head release synchronization

`ROADMAP.md` now records the canonical M468–472 block immediately after the reconciled M458–467 continuation, including the four new exact-head qualification-boundary labels. This detailed record and draft PR #7 are synchronized without hardcoding a branch SHA, and the temporary collision-safe `docs/OPTIONS_REFRESH_RESILIENCE_M461_465.md` record now points here.

Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate. Exact branch identity is recorded in the newest Issue #10 synchronization comment rather than hardcoded here.

## Privacy and validation invariants

These milestones add no telemetry, analytics, browsing history, request history, matched-element/page history, identifiers, polling, custom backend, permission expansion, or retention expansion. No `npm ci`, `npm run check`, package/release/reproducibility/source-qualification command, Chromium run, or Firefox run is claimed as executed by this connector-only block.
