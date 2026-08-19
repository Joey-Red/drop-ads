# Milestones 1042–1051 — Cookie-banner platform primitive hardening

This sequence hardens the cookie-banner runtime against page-visible DOM/style/geometry primitive replacement while preserving the existing local, bounded, privacy-minimal behavior. It adds no telemetry, browsing/request/banner history, retained action outcomes, DOM/style/geometry snapshots, locale profile, identifiers, statistics, owned backend, or remote executable code. Repository tests, audits, and guidance remain supporting preflight evidence; Issue #10 remains the authoritative exact-head Chromium + Firefox browser qualification gate.

## M1042 — Executor semantic DOM primitives

The executor now captures semantic availability primitives through bounded prototype descriptor lookup: element attribute methods/tag identity, node root/parent/connected state, open-shadow host, hidden state, and disabled fieldset state. Exact receivers are used through `Reflect.apply`; malformed or unavailable primitives fail closed. The existing 24-step interaction ancestry bound and native click/geometry/hit-test protections remain intact.

## M1043 — Executor style, geometry, and viewport primitives

Visibility and hit ownership now use captured `CSSStyleDeclaration.getPropertyValue`, `DOMRectReadOnly` geometry getters, and window viewport getters. Direct page-visible style/rect/viewport reads are avoided, finite geometry is required, and the existing native computed-style, bounding-rect, containment, open-shadow hit testing, and final pre-click revalidation remain unchanged in intent.

## M1044 — Action-source DOM traversal primitives

The action-source safety layer now captures document tree-walker creation, walker iteration, attributes/tag names, node value/root/parent reads, open-shadow host and same-root ID lookup, input value, document roots, and NodeFilter constants through descriptor-safe boundaries. Direct and accessible-name sources retain all existing size, agreement, hidden/interactivity, Unicode, same-root, and navigation-ancestry constraints.

## M1045 — Action-context DOM primitives

The action-context layer now uses captured tree traversal, attributes, root/parent access, shadow-host/same-root lookup, and document roots for secondary activation ancestry, editability, referenced-label trees, popup launch, toggle, and popover checks. Existing 16-step ancestry ceilings, 128-descendant action budget, and 64-element referenced-label budget remain preserved.

## M1046 — Action-semantics DOM primitives

The action-semantics layer now captures attributes/tag names, composed root/parent/host ancestry, native button/input type state, and document roots. Disclosure, reset, native-role, busy, controlled-region, and declarative command refusal remain fail-closed under the existing 16-step busy ancestry limit.

## M1047 — Historical regression reconciliation

Historical source-level regressions were updated to assert the descriptor-safe implementations rather than obsolete live-DOM source strings. Revalidation, visibility/hit testing, semantic availability, open-shadow activation, action-source bounds/agreement, action-context editability/popup/popover, and action-semantics behavior remain represented rather than being deleted or weakened.

## M1048 — Dedicated platform primitive audit

`cookie-banner-platform-primitives-audit` protects the M1042–M1047 source boundary, exact-receiver use, Firefox/Chromium script parity/order, privacy surface, and the focused regressions. It is wired into `npm run check` as supporting preflight evidence.

## M1049 — Canonical hardening audit extension

The canonical `cookie-banner-hardening-audit` is reconciled through M1048. It preserves all historical output compatibility markers and prior regression paths, requires the dedicated platform primitive audit, protects representative M1042–M1046 captures, and carries the additional marker `extended through M1048`. The utility-composition audit is also reconciled with the stronger action-context/action-semantics helper capture.

## M1050 — Exact-head platform primitive qualification guide

`docs/COOKIE_BANNER_PLATFORM_PRIMITIVES_QUALIFICATION.md` defines the exact-head Chromium + Firefox observations for safe rejection, visibility/hit ownership, accessible-name paths, action-context and action-semantics negatives, delayed open-shadow behavior, reject/off mode, exact-candidate invalidation, independence from ordinary blocking, and zero retained platform/page/action data. The guide explicitly does not convert source audits into browser evidence.

## M1051 — Canonical synchronization

`ROADMAP.md` closes M1042–M1051 and advances allocation to M1052. Issue #10 receives the exact-head browser qualification delta for the platform-primitive boundary without a browser-pass claim. A focused roadmap regression protects the canonical range, guide, audit, next milestone, and privacy/release boundaries.

## Qualification invariants carried forward

For the exact same source fingerprint and generated package hashes in both Chromium and Firefox, real-browser qualification must additionally confirm:

- safe base and reviewed localized cookie-banner controls still activate only in reject mode and strong cookie/privacy context;
- hidden, inert, aria-hidden/disabled, disabled-fieldset, invisible, pointer-inert, zero-area, disconnected, moved, or covered actions remain untouched;
- captured style, DOMRect, viewport, containment, and hit-test paths preserve ordinary visible safe activation and final pre-click ownership revalidation;
- bounded direct/descendant/input/`aria-labelledby` action names continue to work only under the existing exact agreement/same-root/source-safety rules;
- editable, secondary activation, popup, toggle, and popover contexts remain untouched;
- disclosure, reset, conflicting native-role, busy, controlled-region, and declarative-command actions remain untouched;
- delayed open-shadow consent handling remains functional only within the documented node/root/depth/time/attempt bounds and closed roots remain inaccessible;
- Off mode remains inert and re-enabling Reject restores safe behavior on fresh loads;
- ordinary network/cookie/cosmetic protection and site/session recovery remain independent;
- no DOM/page/accessibility-name/action/style/geometry/viewport/shadow/platform state, history, outcomes, language profile, statistics, timestamps, identifiers, analytics, or telemetry are retained or transmitted.

Any source commit, fingerprint change, package hash/size change, or active qualification-record mismatch invalidates prior observations. Repository-only evidence never substitutes for Issue #10 browser observations.
