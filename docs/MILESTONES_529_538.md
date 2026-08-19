# Milestones 529–538 — Settings lifecycle hardening

This continuation block hardens Settings live-sync ownership and page teardown without adding request observation, telemetry, retained statistics, a custom backend, or new browser permissions.

## Milestone 529 — Owned Settings storage listener

Added `src/core/options-storage-listener.js` with `installOwnedOptionsStorageListener(api, listener)`.

The helper:

- walks browser collaborators through a bounded descriptor-only data-property path;
- verifies both `storage.onChanged.addListener` and `removeListener` before registration;
- preserves the owning event receiver with `Reflect.apply`;
- retains the exact listener identity for removal;
- returns an idempotent disposer; and
- treats removal failure as best-effort teardown rather than a new runtime failure.

The earlier duplicate Milestone 529 trackers were closed as duplicates; Issue #811 is the completed canonical tracker for this block.

## Milestone 530 — Listener ownership trap coverage

Added focused Node regression coverage for add/remove receiver identity, idempotent teardown, remove failure containment, accessor/non-function/missing collaborators, descriptor traps, prototype traps, and validation-before-registration behavior.

## Milestone 531 — Country Settings teardown ownership

Country Settings now uses the owned listener helper, retains its disposer, and releases that exact registration from the existing one-shot `pagehide` path. The same teardown path also invalidates queued rendering/relabel work and disconnects the owned `MutationObserver`.

## Milestone 532 — Cosmetic Settings teardown ownership

Cosmetic Settings now owns and disposes its storage live-sync registration on `pagehide` while preserving the existing render-generation and queue invalidation behavior.

## Milestone 533 — Protection action-count teardown ownership

The Protection action-count Settings surface now owns its storage listener, invalidates in-flight preference refresh generations during page teardown, and rejects late async publication after `pagehide`.

## Milestone 534 — Owned-lifecycle UI hardening audit

`tools/ui-hardening-audit.mjs` was extended to verify the shared add/remove/disposer contract and the migrated Country, Cosmetic, and action-count ownership paths. The audit rejects regression to the legacy unowned listener helper on those surfaces.

## Milestone 535 — Primary Settings teardown ownership

The primary Settings page now uses the owned listener helper as well. It retains and disposes the registration on `pagehide`, records an explicit page-active lifecycle state, blocks new queued storage-driven renders after teardown, and checks that state again after asynchronous storage reads before publishing refreshed lists or full Settings state.

## Milestone 536 — All Settings surfaces audited

The executable UI hardening gate now requires all four shipped Settings surfaces — primary, Country, Cosmetic, and Protection action-count — to use the owned storage-listener helper, retain a disposer, dispose it on `pagehide`, and avoid the legacy listener helper. Existing runtime-message, stale-render, observer, and message-envelope checks remain in place.

## Milestone 537 — Settings privacy audit includes shared helpers

`tools/settings-privacy-surface-audit.mjs` now scans both shared Settings collaborator modules in addition to the four UI modules:

- `src/core/options-runtime.js`
- `src/core/options-storage-listener.js`

The gate continues to reject direct `fetch`, XHR, WebSocket, EventSource, `sendBeacon`, request-observation APIs, browser history access, IndexedDB, `localStorage`, and `sessionStorage`. Focused source-contract coverage confirms both helper modules remain inside the audit and that the audit remains part of `npm run check`.

## Milestone 538 — Documentation and qualification synchronization

This document, `docs/SETTINGS_BOUNDARIES.md`, `docs/POST_MERGE_QUALIFICATION.md`, and Issue #10 are synchronized so maintainers know that:

- Settings live-sync registrations are explicitly owned and torn down;
- late page-teardown publication is guarded on the hardened Settings surfaces;
- the UI hardening and Settings privacy audits are repository preflight gates; and
- connector-created source/tests/audits are not represented as executed local or real-browser qualification.

Real Chromium + Firefox qualification still belongs to Issue #10 and must be run against one exact `main` head/package set.
