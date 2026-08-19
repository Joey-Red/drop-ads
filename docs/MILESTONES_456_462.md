# Milestones 456–462 — Cache dictionaries, message exactness, popup visibility, and convergence ownership

This block records the next canonical hardening work after the previously documented bootstrap/runtime collaborator work. These changes preserve the privacy model: no telemetry, browsing/request history, retained match statistics, identifiers, custom backend, or new permissions.

## M456 — Prototype-safe pruned subscription caches

`pruneListCache()` now rebuilds retained subscription cache state in a null-prototype dictionary rather than `{}`. Retention requires an actual own source-cache key plus successful source-aware decode, and the retained value is written as an explicit enumerable own data property. Canonical subscription ids that coincide with Object-prototype names therefore remain inert keys instead of inherited fallbacks.

The existing 128-subscription limit, source-bound v5 semantics, legacy/LKG behavior, and cache entry work bounds are unchanged. Focused repository coverage: `tests/subscription-pruned-cache-prototype-v441.test.js`.

## M457 — Abort-signal collaborator regression alignment

The remote response reader's abort-signal boundary is explicitly covered: native AbortSignal state/listener operations are captured through platform descriptors with their original receiver, synthetic signals use reviewed descriptor-safe data/function collaborators, the read loop uses the captured interface, and listener teardown remains best effort.

Timeout cancellation, fatal UTF-8 handling, the 5,000,000-byte ceiling, and reader cancellation semantics are unchanged. Focused repository coverage: `tests/list-updates-abort-signal-v442.test.js`.

## M458 — Prototype-safe normalized list-cache dictionaries

`normalizeListCache()` returns null-prototype dictionaries for both invalid-root fallback and successful normalization. Only entries from the detached own-key cache envelope proceed to compaction, preventing Object-prototype lookup ambiguity for canonical subscription ids such as `constructor`.

The 256-entry root ceiling, 300,000 policy-item work bound, 8 MB persistence ceiling, v2–v5 source provenance, and legacy migration behavior remain unchanged. Focused repository coverage: `tests/cache-normalized-dictionary-v443.test.js`.

## M459 — Strict presence semantics for refresh-force messages

The guarded `drop-ads:refresh-lists` contract distinguishes omission from explicit presence. Omission retains the existing non-forced behavior; every explicitly present `force` value must be a primitive boolean. Explicit `null`, `undefined`, numeric, string, boxed, or object values fail before the core listener runs.

The exact detached message envelope and cross-group routing behavior are unchanged. Focused repository coverage: `tests/runtime-refresh-force-presence-v444.test.js`.

## M460 — Always-visible popup global status

The popup exposes an always-visible polite atomic `#global-status` region outside the site-only section. Global state-load/refresh errors, live-sync registration failures, and Settings launch errors remain visible even on unsupported/non-HTTP tabs. Site/session/picker feedback stays in the site-local live region.

Revision-aware status clearing prevents an older successful committed-state render from erasing a newer failure. No polling, invented state, retained history, or background tracking is introduced. Focused repository coverage: `tests/popup-global-status-v445.test.js`.

## M461 — Captured policy-convergence event ownership

Policy convergence owns runtime/context/alarm listener methods through bounded descriptor/prototype inspection (maximum depth 8), binds them to their original event receivers, installs transactionally with reverse rollback, and tears down with captured best-effort removers. Accessor-shaped or trapped collaborators fail before partial listener publication.

Existing discriminator/reason limits and one-active-plus-one-rerun convergence semantics remain unchanged. Focused repository coverage: `tests/policy-convergence-event-capture-v446.test.js`.

## M462 — Canonical documentation and qualification boundary synchronization

This document is the canonical detailed record for M456–M462. Draft PR metadata and Issue #10 are synchronized after the final repository edit. The exact head is recorded on Issue #10 rather than hardcoded here or in the PR body.

## Validation status

Files added or edited through the GitHub connector are **repository coverage only**. No claim is made that `npm ci`, `npm run check`, packaging, reproducibility verification, source qualification, or Chromium/Firefox runtime qualification was executed for this block. Any real browser observations must be made against the final exact head/package hashes recorded by the release gate.
