# Milestones 1032–1041 — Cookie-banner collaborator ownership hardening

This sequence hardens the extension-owned cookie-banner collaboration chain without adding telemetry, page/request/banner history, action-label retention, locale profiling, identifiers, a Drop Ads backend, or remote executable code. Repository tests, audits, fixtures, and documentation remain supporting/preflight evidence only; real Chromium and Firefox qualification remains tracked by Issue #10.

## M1032 — Action-source safe composition

`cookie-banner-action-source-safety.js` now acquires `DropAdsCookieBannerUtilsComposition`, `snapshotUtils`, and `replaceUtils` through exact own data descriptors. The action-source wrapper snapshots its required utility collaborators and replaces only `textSnapshot`; direct utility spread/global replacement is removed while every M962–M978 action-identity guard remains in force.

## M1033 — Consent-safety collaborator capture

`cookie-banner-consent-safety.js` obtains the descriptor-safe utility snapshot, captures `boundedConsentContext`, and invokes that captured function for strong cookie/privacy evidence. The consent-safety API is published through an immutable non-configurable global data descriptor.

## M1034 — Executor collaborator ownership

`cookie-banner-executor.js` snapshots and captures the utility functions it needs, accepts consent safety only as the exact frozen one-function API, and invokes captured collaborators during final revalidation and activation. Native click, geometry, containment, open-shadow hit testing, and the final pre-click hit test remain descriptor-safe. The executor API is immutable and non-configurable.

## M1035 — Controller collaborator ownership

The controller now consumes the composed utility snapshot and exact frozen executor, shadow-root, and consent-safety APIs. Candidate discovery, scoring, consent checks, shadow observation, and activation use captured functions instead of live property reads. Existing 16-attempt, 30-second, receiver-safe messaging/timer/listener, ambiguity, and teardown boundaries remain unchanged.

## M1036 — Descriptor-safe open-shadow primitives

`cookie-banner-shadow-roots.js` captures `Document.createTreeWalker`, `TreeWalker.nextNode`, `Element.shadowRoot`, and `NodeFilter.SHOW_ELEMENT` through bounded descriptor lookup and invokes them with exact receivers. The 2,000-node, 32-root, and depth-four ceilings remain. The shadow helper is published as an immutable non-configurable API.

## M1037 — Historical shadow regression reconciliation

The original M924/M925 tests were brought forward to the current canonical runtime graph rather than removed. They now validate the full script order, descriptor-safe shadow-root capture, captured shadow discovery, `observeTargetOnce`, resynchronization, deduplication, teardown, and no polling.

## M1038 — Dedicated collaborator-ownership audit

`cookie-banner-collaborator-ownership-audit` protects the M1032–M1037 boundaries, canonical browser script order, immutable collaborator APIs, descriptor-safe shadow primitives, reconciled historical tests, privacy restrictions, and the focused regression set. It is wired into `npm run check`.

## M1039 — Canonical cookie-banner audit extension

`cookie-banner-hardening-audit` now includes the collaborator-ownership audit and focused regressions while preserving every earlier canonical marker. Its newest compatibility marker is `extended through M1038`.

## M1040 — Exact-head collaborator qualification guide

`docs/COOKIE_BANNER_COLLABORATOR_OWNERSHIP_QUALIFICATION.md` describes exact-head Chromium + Firefox observations for safe base/localized rejection, context/semantics negatives, delayed open-shadow handling, reject/off controls, immutable captured collaborator expectations, exact-head invalidation, independence from ordinary blocking, and zero-retention requirements.

## M1041 — Canonical synchronization

`ROADMAP.md` records M1032–M1041 and advances the next canonical milestone to M1042. Issue #10 receives the exact-head Chromium/Firefox qualification delta without any browser-pass claim.

## Privacy and release boundaries carried forward

- No utility/collaborator snapshot, action label, accessible name, DOM/page/shadow-root snapshot, banner/click/request outcome, language profile, statistic, timestamp, identifier, analytics, or telemetry is retained or emitted.
- No owned Drop Ads backend is introduced.
- Malformed collaborator state fails closed for automatic cookie-banner action rather than falling back to page-owned or looser behavior.
- Ordinary network/cookie/cosmetic blocking and existing site/session recovery remain independent.
- Tests, audits, fixtures, and docs are supporting evidence only. Issue #10 remains the authoritative exact-head Chromium + Firefox runtime qualification gate.
