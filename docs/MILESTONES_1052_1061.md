# Milestones 1052–1061 — Base cookie-banner utility platform hardening

This sequence hardens the earliest cookie-banner runtime layer, `cookie-banner-utils.js`, so the base utility surface no longer depends on live page-visible DOM/control properties before the later localization/action-source/context/semantics wrappers apply their own safety rules.

## M1052 — Base utility publication

- Added a bounded platform descriptor-capture scaffold with an eight-prototype ceiling.
- Replaced direct global assignment with an immutable, non-enumerable, non-writable, non-configurable own data-property publication.
- Refuses to overwrite any pre-existing `DropAdsCookieBannerUtils` global.
- Preserved the exact exported utility key surface expected by the composition layer.

## M1053 — Base DOM primitive capture

Captured and exact-receiver invoked the base utility collaborators for:

- `Document.createTreeWalker` and `TreeWalker.nextNode`;
- node text/root/parent/connectivity state;
- element attribute/tag/id/class/closest/open-shadow state;
- Document and ShadowRoot same-root ID lookup;
- input value/type/disabled state;
- button type/disabled/form state;
- document body/document-element roots;
- `NodeFilter.SHOW_TEXT` and `SHOW_ELEMENT`.

Missing or malformed required platform collaborators cause utility initialization to fail closed.

## M1054 — Accessible-name boundary

Focused regression coverage locks direct descendant text and bounded same-root `aria-labelledby` resolution to captured text/root/connectivity/attribute/tag/ID lookup primitives while preserving the existing four-reference, attribute-length, reference-text, same-root, and non-interactive checks.

## M1055 — Control classification boundary

Focused coverage protects Drop Ads-owned exclusion, navigation/submit refusal, disabled native-control refusal, role-button compatibility, and direct input action-text handling through captured control primitives rather than `instanceof` or live control properties.

## M1056 — Consent-context boundary

Focused coverage protects bounded consent metadata/text extraction and ancestor traversal through captured element/node/document primitives. Existing ceilings remain:

- 10 consent ancestor steps;
- 96 consent text nodes;
- 1,200 normalized context characters;
- 2,400 raw characters per metadata field;
- 256 consent-context evaluations per scan.

No consent text is retained after the transient page-local decision path.

## M1057 — Base shadow discovery boundary

Candidate discovery uses captured document root, TreeWalker, and native open `Element.shadowRoot` state. Existing ceilings remain 2,000 visited nodes, 64 candidates, 32 open shadow roots, and four shadow levels. Closed roots are not pierced and seen roots are deduplicated.

## M1058 — Historical regression reconciliation

Reconciled historical discovery, consent, navigation/control, shadow, action-text-bound, consent-raw-bound, and `aria-labelledby` tests with the current descriptor-safe implementation. Their original behavioral guarantees remain; only stale requirements for superseded live DOM/property syntax were replaced.

## M1059 — Dedicated base utility platform audit

Added `tools/cookie-banner-utils-platform-audit.mjs` and wired it into `npm run check`. The audit protects immutable publication, descriptor capture, exact-receiver DOM/control/consent/shadow primitives, existing work ceilings, manifest order, the exact utility composition schema, the privacy boundary, and all M1052–M1058 regressions.

Its compatibility marker is:

`cookie-banner-utils-platform-audit: canonical M1052-M1058 base utility platform invariants verified`

## M1060 — Exact-head browser qualification guide

Added `docs/COOKIE_BANNER_BASE_UTILS_PLATFORM_QUALIFICATION.md` covering real packaged Chromium and Firefox observation of safe base/localized/action-name positives, control negatives, bounded consent, light/open-shadow discovery, action-context/action-semantics negatives, Reject/Off transitions, exact-candidate invalidation, and privacy independence.

Repository tests and audits remain preflight evidence only. Issue #10 remains the authoritative browser gate.

## M1061 — Canonical synchronization

- Added this canonical milestone record.
- Updated `ROADMAP.md` and advanced allocation to M1062.
- Added the M1052–M1060 exact-head observation delta to Issue #10 without claiming a browser pass.
- Added focused roadmap regression coverage.

## Privacy and evidence boundary

This sequence adds no owned backend, telemetry, analytics, browsing/request history, action outcome history, DOM/page/accessibility-name/consent snapshots, control/platform/shadow traversal state, locale/language profile, statistics, timestamps, or identifiers. Repository/connector-created tests, audits, fixtures, and documentation were not real browser observations and never substitute for Issue #10 qualification.
