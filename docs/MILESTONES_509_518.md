# Milestones 509–518 — Settings runtime routing and page lifecycle hardening

This block continues the post-merge UI hardening line on `main`. It does not change Drop Ads' privacy model, permissions, blocking precedence, telemetry posture, or serverless architecture.

## 509 — Shared Settings runtime collaborator capture

Added `src/core/options-runtime.js` with `sendOptionsRuntimeMessage(api, message)`. The helper captures `runtime` and `runtime.sendMessage` through a bounded data-property-only prototype walk, rejects accessor/proxy/non-function collaborator shapes, preserves the owning runtime receiver with `Reflect.apply`, and introduces no new browser permission or data retention.

Focused repository coverage: `tests/options-runtime-collaborator-v509.test.js`.

## 510 — Country Settings runtime routing

Country Settings now routes policy mutations through `sendOptionsRuntimeMessage` instead of direct `api.runtime.sendMessage` access. Existing exact response validation, country-TLD normalization, and mutation behavior remain unchanged.

Focused repository coverage: `tests/country-options-runtime-routing-v510.test.js`.

## 511 — Cosmetic Settings runtime routing

Cosmetic Settings now routes add/remove policy messages through the shared captured runtime sender while preserving internal-mutation suppression and exact response validation.

Focused repository coverage: `tests/cosmetic-options-runtime-routing-v511.test.js`.

## 512 — Runtime-routing audit gate

`tools/ui-hardening-audit.mjs` now rejects direct runtime messaging in Country and Cosmetic Settings, requires the shared helper route, and verifies the helper retains bounded data-property capture plus receiver-preserving dispatch. The audit remains part of `npm run check` through the existing `ui-hardening-audit` script.

## 513 — Country MutationObserver ownership

Country Settings retains the personal-list `MutationObserver` instance and disconnects it on one-shot `pagehide`. Teardown failure is contained and cannot escape page shutdown.

Focused repository coverage: `tests/country-observer-lifecycle-v513.test.js`.

## 514 — Country relabel coalescing

Personal-list relabel work now has one queue identity. MutationObserver and accepted-render triggers share the same scheduler, duplicate work in the same turn is coalesced, queue identity is released before relabel execution, and `queueMicrotask` failure falls back to one direct relabel.

Focused repository coverage: `tests/country-relabel-coalescing-v514.test.js`.

## 515 — Country pagehide invalidation

Country Settings has an explicit active-page flag. `pagehide` marks the page inactive, invalidates the render generation, clears queued render/relabel identities, and disconnects the retained observer. New render/relabel queue admissions and already-queued runners become no-ops after teardown; async state loads cannot publish after the page is inactive.

Focused repository coverage: `tests/country-pagehide-queued-work-v515.test.js`.

## 516 — Cosmetic pagehide invalidation

Cosmetic Settings now marks the page inactive on `pagehide`, invalidates the current render generation, clears queued-render identity, rejects new queue admission, and prevents async state reads from publishing hide/allow lists after teardown.

Focused repository coverage: `tests/cosmetic-pagehide-queued-work-v516.test.js`.

## 517 — Lifecycle audit gate

The executable UI hardening audit now locks the Country observer ownership/disconnect contract, Country relabel coalescing, Country page-active queue/render guards, Cosmetic page-active queue/render guards, and the M509–M512 captured-runtime routing invariants.

## 518 — Documentation and qualification synchronization

This document records the completed block and the post-merge qualification note is extended accordingly. Issue #10 remains the authoritative real Firefox + Chromium qualification gate. Any browser qualification must use the exact current `main` source head and matching generated package hashes.

Connector-created or connector-edited regression files and source audits in this block are repository evidence only. They are not represented as executed local test results or real-browser qualification unless those commands/browser observations are actually run against the same exact head.

No milestone in this block introduces telemetry, analytics, browsing/request history, retained statistics, identifiers, a custom backend, or additional browser permissions.
