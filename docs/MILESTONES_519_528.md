# Milestones 519–528 — Primary Settings runtime and privacy-surface hardening

This block continues the post-merge hardening line on `main`. It tightens the primary Settings page, the shared Settings runtime sender, and the repository’s executable privacy gates without adding permissions, telemetry, request history, statistics, or a custom backend.

## Milestone 519 — Route primary Settings runtime messaging through the captured sender

`src/options/options.js` no longer calls `api.runtime.sendMessage` directly. Generic policy mutations, optional community preparation, subscription add/enable/disable/remove, forced list refresh, and settings import all route through `sendOptionsRuntimeMessage()` while preserving the existing response validators and `withInternalMutation()` storage-live-sync suppression.

Focused repository coverage: `tests/options-primary-runtime-routing-v519.test.js`.

## Milestone 520 — Make primary Settings routing an executable invariant

`tools/ui-hardening-audit.mjs` now rejects direct primary-Settings runtime messaging and requires the shared captured sender. Country and Cosmetic Settings routing checks remain in the same gate.

## Milestone 521 — Snapshot top-level Settings runtime message envelopes

`src/core/options-runtime.js` now treats the top-level outbound message as an untrusted envelope before handing it to the browser runtime:

- ordinary or null-prototype object only;
- maximum **8 own top-level fields**;
- no symbols;
- no accessors or non-enumerable fields;
- prototype, key, and descriptor traps fail closed;
- accepted fields are copied into a null-prototype object;
- the copy is frozen before receiver-preserving `Reflect.apply` dispatch.

Nested rule/subscription/import values retain their existing background message-contract validation and existing reviewed size/work ceilings.

## Milestone 522 — Cover envelope traps and immutability

`tests/options-runtime-envelope-v522.test.js` covers receiver preservation, frozen null-prototype dispatch, unchanged nested value identity, null-prototype callers, caller non-mutation, accessors, symbols, custom prototypes, over-field envelopes, and prototype/key/descriptor traps.

## Milestone 523 — Audit the runtime-envelope boundary

`ui-hardening-audit` now requires the 8-field ceiling, prototype/key/descriptor inspection, null-prototype snapshot creation, freezing, snapshot-before-dispatch, and receiver-preserving dispatch. This keeps the source-level boundary from silently regressing.

## Milestone 524 — Add a dedicated Settings privacy-surface audit

`tools/settings-privacy-surface-audit.mjs` scans the primary, Country, Cosmetic, and Protection action-count Settings sources and rejects Settings-side use of:

- direct `fetch`;
- XMLHttpRequest;
- WebSocket;
- EventSource;
- `sendBeacon`;
- `webRequest`;
- `declarativeNetRequestFeedback`;
- browser history APIs;
- IndexedDB;
- localStorage;
- sessionStorage.

The audit is intentionally narrow: reviewed extension runtime messaging remains allowed, and filter-list networking stays background-owned under the existing source-admission, hostile-input, transaction, cache, and last-known-good policy.

## Milestone 525 — Put the Settings privacy audit in `npm run check`

`package.json` exposes `settings-privacy-surface-audit` and invokes it during the normal `check` chain without adding dependencies, workspaces, lifecycle hooks, or release behavior.

## Milestone 526 — Cover the privacy-audit contract

`tests/settings-privacy-surface-audit-v526.test.js` verifies that all four Settings sources remain in scope, the reviewed forbidden primitive classes stay represented in the audit, and the package/check integration remains present.

## Milestone 527 — Document the Settings trust boundary

`docs/SETTINGS_BOUNDARIES.md` records the maintainer-facing model for captured messaging, exact background response validation, top-level message snapshots, storage live synchronization, stale-render/lifecycle protection, prohibited Settings-side network/request-observation surfaces, and the project’s zero-telemetry/no-history invariants.

## Milestone 528 — Qualification synchronization

This document closes the block and updates the post-merge qualification record and Issue #10 follow-up. Repository tests and audits added through the connector are **not** represented as executed local tests or browser observations. Real release qualification still requires the exact current `main` commit, exact generated Chromium/Firefox package hashes, and the Issue #10 Firefox + Chromium matrix.

## Privacy statement for this block

No milestone in M519–M528 adds telemetry, analytics, browsing/request history, blocked-request statistics, DOM/click history, identifiers, request-observation permissions, or a custom Drop Ads backend. The work only constrains local Settings code paths and repository validation.
