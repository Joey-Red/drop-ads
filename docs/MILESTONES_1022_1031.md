# Milestones 1022–1031 — Cookie-banner utility composition hardening

This sequence hardens how the cookie-banner content-script layers compose shared utility behavior. It does not add telemetry, language profiling, browsing history, click history, page/DOM retention, or a Drop Ads backend, and it does not claim a Chromium or Firefox browser pass. Issue #10 remains the authoritative exact-head real-browser qualification gate.

## M1022 — Descriptor-safe utility composition helper

Added `src/content/cookie-banner-utils-composition.js` and inserted it identically in Chromium and Firefox immediately after `cookie-banner-utils.js`. The helper accepts only the exact canonical frozen plain-object utility surface, snapshots own data descriptors without invoking accessors, bounds and validates override keys, explicitly reconstructs the frozen utility object, and publishes its own API as an immutable extension-owned global.

## M1023 — Localized scorer composition migration

`cookie-banner-locale-extension.js` now captures its base scorer and normalizer only through the descriptor-safe snapshot and replaces only `rejectionScore` through the helper. The former object-spread/direct-global replacement path was removed.

## M1024 — Action-context composition migration

`cookie-banner-action-context-safety.js` now obtains and replaces `textSnapshot` through the composition helper while preserving bounded activation ancestry, editability, referenced-label, popup-launch, toggle, and popover-target refusal.

## M1025 — Action-semantics composition migration

`cookie-banner-action-semantics-safety.js` now obtains and replaces `textSnapshot` through the composition helper while preserving disclosure, reset, native-role, busy-context, controlled-region, and declarative-command refusal.

## M1026 — Base score result contract

The localized wrapper now accepts a base rejection score only when it is a safe integer in the reviewed `0..100` range. Exceptions, non-numbers, NaN/infinity, fractions, negatives, and values above 100 fail closed for that evaluation and cannot fall through into localized matching.

## M1027 — Normalized action-text result contract

The captured base normalizer must now return a string no longer than 160 characters, already lowercase and trimmed, with no repeated whitespace and only the canonical ASCII action grammar. Empty string remains the valid no-match result. Malformed collaborator output fails closed before localized lexicon validation or scoring.

## M1028 — Descriptor-safe localized lexicon snapshot

Localized phrases are no longer iterated/destructured as trusted tuples. The frozen outer array and every frozen two-field tuple are validated through exact own non-writable/non-configurable data descriptors. Holes, extra keys, accessors, duplicates, invalid scores, or non-canonical phrases fail closed. Valid entries are compiled into a frozen null-prototype phrase-to-score lookup for exact matching.

## M1029 — Dedicated composition audit

Added `tools/cookie-banner-utils-composition-audit.mjs`, wired into `npm run check`. The audit protects the exact utility schema, script order, migrated wrappers, collaborator result contracts, descriptor-safe localized lookup, privacy boundary, and M1022–M1028 regressions. The existing localization audit was updated for the helper insertion and stronger lexicon while retaining its historical compatibility marker.

## M1030 — Canonical audit extension

Reconciled `tools/cookie-banner-hardening-audit.mjs` through M1029. Historical markers and prior regression-path coverage remain present, the current exact Chromium/Firefox cookie-banner script order includes the composition helper, dedicated localization/composition audits are required, and the canonical marker now extends through M1029.

## M1031 — Documentation and exact-head qualification sync

This record, `docs/COOKIE_BANNER_UTILS_COMPOSITION_QUALIFICATION.md`, ROADMAP, and Issue #10 synchronize the new composition boundary. Browser observation remains required on the exact generated candidate for both Chromium and Firefox.

## Privacy and release boundary

All composition state is ephemeral extension execution state. No action names, localized phrases observed on pages, DOM/page snapshots, scorer outcomes, click results, language/locale profile, counters, timestamps, identifiers, analytics, or telemetry are retained. Repository tests and audits are preflight evidence only; any source/package identity change invalidates prior exact-head browser observations.
