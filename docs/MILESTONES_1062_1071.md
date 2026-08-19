# Milestones 1062–1071 — Cookie-banner controller platform hardening

This sequence hardens the final controller layer that decides when cookie-banner work starts, which document/domain it applies to, how late DOM changes are observed, and how the controller reaches extension-owned collaborators. The sequence remains browser-local and privacy-minimal: it adds no telemetry, statistics, browsing history, action history, page/DOM snapshots, identifiers, or owned Drop Ads backend behavior.

## M1062 — Frame and location primitive capture

The controller now captures `Window.top`, `Window.location`, `Location.protocol`, and `Location.hostname` through a bounded descriptor-safe getter walk. Reads use `Reflect.apply` with exact receivers. Top-frame-only execution and HTTP(S)-only lowercase domain policy input no longer depend on live page-visible global/property reads.

Regression: `tests/cookie-banner-controller-frame-location-primitives-v1062.test.js`.

## M1063 — Document root and readiness capture

`Window.document`, `Document.documentElement`, and `Document.readyState` are captured through the same bounded getter layer. Document listeners bind to the captured document object. Immediate discovery, open-shadow synchronization, and observer startup obtain the current document root only through the captured getter and fail closed if document/root/readiness state is unavailable.

Regression: `tests/cookie-banner-controller-document-primitives-v1063.test.js`.

## M1064 — MutationObserver prototype ownership

The late-banner path captures `MutationObserver`, its prototype, and native `observe`/`disconnect` methods before constructing an observer. The captured methods are invoked with the exact constructed observer instance, rather than being rediscovered from the live instance. Existing limits remain 16 scans, a 30-second observation window, and 150ms mutation settling.

Regression: `tests/cookie-banner-controller-observer-primitives-v1064.test.js`.

## M1065 — Extension API global ownership

The controller no longer reads `globalThis.browser` or `globalThis.chrome` directly. It resolves the available extension API through bounded data/getter capture, captures `runtime` and `sendMessage`, and binds message delivery to the exact runtime receiver. Policy messaging remains a single frozen `{ type, domain }` request.

Regression: `tests/cookie-banner-controller-api-global-v1065.test.js`.

## M1066 — Historical controller regression reconciliation

Historical controller tests were updated to assert the current captured frame/location/document/root/observer/listener ownership while preserving their original guarantees: top-frame and domain-only policy binding, bounded observation, open-shadow resynchronization, and explicit teardown. No production behavior was widened.

Regression: `tests/cookie-banner-controller-legacy-reconciliation-v1066.test.js`.

## M1067 — Dedicated controller platform audit

`tools/cookie-banner-controller-platform-audit.mjs` enforces the M1062–M1066 boundary: bounded descriptor capture, exact frame/location/document/readiness reads, extension API ownership, captured MutationObserver prototype methods, observer bounds/teardown, exact frozen collaborators, browser manifest parity, and zero persistence/network-history/profile/telemetry surface. It is wired into `npm run check`.

Regression: `tests/cookie-banner-controller-platform-audit-v1067.test.js`.

## M1068 — Cross-platform audit integration

`tools/cookie-banner-platform-integration-audit.mjs` joins the canonical cookie-banner audit with the executor/action platform audit, base utility platform audit, and controller platform audit. It preserves the older canonical compatibility marker while requiring the focused platform regressions and all audit scripts to remain in the `npm run check` chain.

Regression: `tests/cookie-banner-platform-integration-audit-v1068.test.js`.

## M1069 — Exact-head controller platform qualification guidance

`docs/COOKIE_BANNER_CONTROLLER_PLATFORM_QUALIFICATION.md` defines the real Chromium + Firefox observations for top-frame/domain/document startup, immediate and delayed rejection, observer teardown, newly reachable open-shadow resynchronization, fail-closed platform/collaborator behavior, Reject/Off transitions, exact-candidate invalidation, and zero retained URL/page/action/observer/platform/language state.

Regression: `tests/cookie-banner-controller-platform-qualification-v1069.test.js`.

## M1070 — Canonical sequence narrative

This document records the controller platform sequence and its evidence boundaries. Repository-created tests, audits, fixtures, and documentation are preflight/supporting evidence only. **They do not constitute Chromium or Firefox observation. Issue #10 remains the authoritative exact-head release gate.**

Regression: `tests/cookie-banner-controller-milestones-v1070.test.js`.

## M1071 — Canonical synchronization

M1071 finalizes this sequence by synchronizing `ROADMAP.md`, advancing the next canonical milestone number, adding the exact-head controller-platform delta to Issue #10, and adding the final roadmap regression. No browser pass is claimed by that synchronization.

## Privacy and evidence boundary

The controller continues to retain none of the following:

- full URLs, paths, queries, fragments, titles, referrers, or browsing/request history;
- action labels, accessible names, banner contents, DOM/page snapshots, or click outcomes;
- frame/location/document/root/readiness/observer/shadow/collaborator/platform snapshots;
- locale/language profiles;
- statistics, timestamps, identifiers, analytics, or telemetry.

No owned Drop Ads backend is introduced. Exact-head browser observations must be recorded only through the guarded qualification workflow. Any source/package/candidate identity change invalidates prior observations.
