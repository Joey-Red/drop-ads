# Milestones 899–911 — Privacy-minimal cookie-banner rejection hardening

These milestones add a local, default-on attempt to choose an unambiguous cookie-consent rejection action while preserving Drop Ads' zero-telemetry, zero-history architecture. The feature stores only the configured `off` / `reject` preference. Banner text, page content, action candidates, sender URLs, DOM references, clicks, requests, counters, outcomes, and identifiers remain transient and are not persisted.

## M899 — Canonicalize local cookie-banner rejection configuration

- Added canonical `cookieBannerMode` configured state with reviewed values `off` and `reject`.
- Default configured behavior is `reject`.
- Persisted state, bounded state snapshots, backup/import compatibility, and configured reset inherit the preference.
- The preference represents configuration only; it does not create activity or outcome history.
- Canonical regression: `tests/cookie-banner-mode-v899.test.js`.

## M900 — Canonicalize cookie-banner rejection Settings UX

- Added the Settings control `Reject cookie banners when possible` / `Off`.
- Added explicit privacy and breakage guidance rather than implying universal banner support.
- Saving has busy state, polite atomic status, rollback rendering, and configured-state live sync.
- Canonical regression: `tests/cookie-banner-settings-v900.test.js`.

## M901 — Canonicalize bounded cookie-banner action discovery

- Bounded one discovery pass to 2,000 visited elements, 64 candidates, and 160 characters per action-text snapshot.
- Only enabled button-like controls are candidates; Drop Ads-owned UI is excluded.
- Candidate objects are frozen transient references only; discovery has no storage, network, or runtime-message side effects.
- Canonical regression: `tests/cookie-banner-discovery-v901.test.js`.

## M902 — Add a privacy-minimal cookie-banner policy runtime boundary

- Added `drop-ads:get-cookie-banner-policy` with an exact `{type, domain}` request schema and canonical-domain equality check.
- The response is exactly `{enabled:boolean}` and fails closed to `{enabled:false}` when state/session loading fails.
- Global protection, `cookieBannerMode`, persistent site disable, and browser-session pause all gate the result.
- Installed the policy listener as an optional background feature so failure cannot take down core blocking startup.
- Canonical regression: `tests/cookie-banner-runtime-v902.test.js`.

## M903 — Require bounded consent-surface context for cookie-banner actions

- Generic Reject/Decline buttons are not sufficient by themselves; a candidate must live inside bounded local cookie/privacy/consent context.
- Ancestor inspection is capped at 10 levels, text traversal at 96 text nodes, and consent context at 1,200 characters.
- Discovery stops before `body` / `documentElement`, so unrelated whole-page privacy text cannot authorize a generic action elsewhere.
- Canonical regression: `tests/cookie-banner-consent-context-v903.test.js`.

## M904 — Revalidate consent context immediately before activation

- Before a click, the original consent container must still be connected, contain the same action, and remain the exact bounded consent context for that action.
- Exact action text, button semantics, Drop Ads ownership exclusion, visibility, and rejection classification are rechecked at activation time.
- DOM replacement or mutation fails closed instead of activating stale content.
- Canonical regression: `tests/cookie-banner-revalidation-v904.test.js`.

## M905 — Wire top-level privacy-minimal cookie-banner rejection runtime

- Added a dedicated top-level-only cookie-banner content-script bundle for Chromium and Firefox.
- The controller sends only the document hostname to the policy boundary, validates an exact one-field `{enabled:boolean}` response, and never sends page URL/path/title/DOM content.
- It waits for DOM readiness and performs activation only through the reviewed discovery/executor helpers.
- The existing all-frames cosmetic/picker surface remains separate.
- Canonical regression: `tests/cookie-banner-controller-v905.test.js`.

## M906 — Bound late cookie-banner discovery and teardown

- Added MutationObserver-driven support for banners that appear shortly after initial DOM readiness without polling.
- One policy request gates the lifecycle; scanning is limited to 16 attempts over at most 30 seconds with 150 ms mutation coalescing.
- Success, exhaustion, policy failure, observer/timer failure, and `pagehide` share teardown that disconnects observation and clears timers.
- Canonical regression: `tests/cookie-banner-late-observation-v906.test.js`.

## M907 — Require hit-test-visible cookie-banner actions before activation

- Automatic activation rejects pointer-events-disabled, zero-size, offscreen, or covered controls.
- The visible rectangle must intersect the viewport and its center must hit the same action or one of its descendants through `elementFromPoint`.
- No scrolling, synthetic mouse events, or dispatch-event fallback was introduced; activation remains a captured native element click after all guards pass.
- Canonical regression: `tests/cookie-banner-hit-test-v907.test.js`.

## M908 — Constrain automatic rejection to an exact reviewed action lexicon

- Replaced prefix/suffix matching with exact normalized labels for reviewed reject/refuse/deny/necessary-only actions.
- Accept/allow/agree/consent/save/manage/preferences/settings/customize/personalize language remains explicitly ineligible.
- Bare `decline` is eligible only as an exact label and still requires every consent-context, visibility, hit-test, and pre-click guard.
- Canonical regression: `tests/cookie-banner-action-lexicon-v908.test.js`.

## M909 — Bind cookie-banner policy requests to the sending top-level document

- Policy requests require `sender.frameId === 0`, a bounded HTTP(S) sender URL, and this extension's sender id when a runtime id is available.
- The sender hostname must exactly match the requested canonical domain and is re-normalized before configured/session state is consulted.
- Subframe, extension-page, malformed, overlong, and cross-domain requests fail before policy-state reads.
- Sender URL exists only as transient validation input and is never returned or persisted.
- Canonical regression: `tests/cookie-banner-sender-binding-v909.test.js`.

## M910 — Add a canonical cookie-banner hardening audit gate

- Added `tools/cookie-banner-hardening-audit.mjs` and wired `npm run cookie-banner-hardening-audit` into `npm run check`.
- The audit locks the M899–M909 configuration, Settings, policy, sender-binding, consent-context, exact-action, hit-test, lifecycle, manifest-parity, and privacy boundaries.
- It rejects polling, persistent content-script state, remote content behavior, synthetic click dispatch, broad rejection matching, or frame-wide banner execution.
- Gate-wiring regression: `tests/cookie-banner-hardening-audit-v910.test.js`.

## M911 — Synchronize canonical milestones and qualification guidance

- This document and `ROADMAP.md` make M899–M911 the canonical cookie-banner hardening sequence and advance the next canonical milestone to M912.
- The current release gate explicitly treats `cookie-banner-hardening-audit` as repository preflight only.
- Real exact-head Chromium and Firefox qualification must still observe Settings on/off behavior, persistent/session site recovery, top-level execution, bounded late-banner behavior, safe rejection/necessary-only activation, refusal to activate ambiguous/accept/manage controls, and the absence of retained banner/page/click data.
- Canonical synchronization regression: `tests/cookie-banner-roadmap-v911.test.js`.

## Privacy invariants

- No telemetry, analytics, banner/page/request/click history, retained outcome statistics, identifiers, DOM snapshots, cookie database access, or Drop Ads backend is introduced.
- The only new persistent product datum is the user's configured `cookieBannerMode` preference.
- DOM/action/context objects, text snapshots, sender URLs, and mutation-observer state are bounded transient runtime inputs and are discarded with the page/runtime lifecycle.
- Automatic rejection remains best effort and fail closed: uncertain, stale, hidden, covered, cross-domain, or ambiguous actions are left for the user.

## Validation status

Repository tests and audits added or edited through M911 are preflight evidence only. Connector-created changes were not executed locally or in browsers as part of these milestone writes. They do **not** constitute Chromium or Firefox release qualification. Issue #10 remains the authoritative exact-head real-browser gate, and any source change after browser observation invalidates that observation set.
