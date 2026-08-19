# Cookie-banner controller platform exact-head qualification

This checklist covers the M1062–M1068 controller platform hardening. It is supporting guidance only. **Issue #10 remains the authoritative exact-head Chromium + Firefox release gate.** Repository tests, source audits, loopback fixtures, and generated qualification records are preflight/supporting evidence and do not substitute for real packaged-browser observation.

## Prepare the exact candidate

From the exact source head being qualified:

```sh
npm ci
npm run qualify:preflight
npm run qualify:observation
npm run qualify:serve
node tools/cookie-banner-action-source-qualification-server.mjs
node tools/cookie-banner-localization-qualification-server.mjs
```

Load only the exact generated Chromium package bound to the active qualification record, perform the observations below, and then repeat with the exact Firefox package. Any source commit, source fingerprint, generated package hash/size, or active-candidate identity change invalidates the observations.

## Top-frame and document binding

With cookie-banner handling set to **Reject cookie banners when possible**, confirm:

- an ordinary HTTP(S) top-level loopback page can perform the expected safe rejection;
- the controller does not run automatic rejection in a child frame;
- non-HTTP(S) pages do not start cookie-banner policy/action work;
- policy lookup behavior depends only on the current lowercase hostname, not the full URL, path, query, fragment, title, referrer, or page text;
- a page loaded while `document.readyState` is `loading` begins only after the captured `DOMContentLoaded` path, while an already-ready document starts without waiting for a second readiness event;
- missing or unusable frame/location/document/root/readiness state results in no automatic action rather than a looser fallback.

Do not inspect or retain full URLs as qualification evidence. The observable requirement is simply that unrelated paths/queries on the same hostname follow the same domain-only site policy.

## Immediate and late-banner behavior

Use the existing safe control and delayed-banner scenarios. In both exact candidate browsers verify:

- a safe strong-cookie rejection control already present at startup activates exactly once in Reject mode;
- a safe rejection control inserted later is discovered through bounded MutationObserver work;
- late scanning remains bounded to 16 attempts, a 30-second observation window, and 150ms mutation settling;
- success, exhaustion, pagehide, malformed observer state, or unrecoverable root state tears the controller down rather than leaving indefinite observation running;
- a newly reachable open shadow root is resynchronized into observation and a reviewed safe reject action inside it can activate;
- closed shadow roots remain inaccessible and are never pierced.

The M1064 boundary specifically protects the captured `MutationObserver` constructor plus captured prototype `observe` and `disconnect` methods. Real browser qualification proves that this ownership boundary still supports ordinary delayed-banner behavior; source inspection alone does not.

## Platform/collaborator fail-closed behavior

Exercise representative safe and unsafe routes already documented by the action-source, context, semantics, base-utils, collaborator, and platform qualification guides. Confirm that:

- safe base/localized controls still activate in Reject mode;
- ambiguous, navigation/submit, disabled/hidden/covered, editable, popup/toggle/popover, disclosure/reset/busy/controlled/command, and malformed accessible-name routes remain untouched;
- malformed or unavailable controller platform/collaborator state never falls back to direct page-owned `browser`/`chrome`, frame/location/document, observer-instance, or DOM-root methods;
- delayed open-shadow behavior remains compatible with the descriptor-safe base utility, shadow helper, executor, and controller layers together.

Do not mutate loaded extension source in DevTools as a qualification technique. That changes the candidate being observed.

## Reject/Off transition

Set cookie-banner handling to **Off** and reload the safe immediate, localized, accessibility-name, and delayed/open-shadow positive routes. None may activate automatically. Restore **Reject cookie banners when possible** and verify those positive routes work again on fresh loads.

## Exact-candidate invalidation

Observations belong only to the exact candidate package. If the source commit/fingerprint, browser package hash/size, manifest/runtime graph, or qualification-record candidate identity changes, discard prior browser observations and repeat this checklist for the new exact candidate.

## Privacy and independence

Throughout qualification, normal network/cookie/cosmetic blocking and site/session recovery must remain independent. The controller/platform hardening must not persist or emit:

- full URLs, paths, queries, fragments, titles, referrers, or browsing history;
- action labels, accessible names, banner contents, DOM/page snapshots, or click outcomes;
- document/root/readiness, observer, shadow-root, frame, location, collaborator, or platform snapshots;
- browser locale/language profiles;
- statistics, timestamps, identifiers, analytics, or telemetry.

No owned Drop Ads backend or new external request is part of this qualification.

## Supporting preflight gates

`npm run qualify:preflight` includes `cookie-banner-controller-platform-audit`, `cookie-banner-platform-integration-audit`, the base-utils/platform/collaborator/canonical cookie-banner audits, the test suite, packaging/reproducibility checks, and guarded qualification-record validation.

Those gates are necessary source/preflight evidence only. Record real Chromium and Firefox outcomes through `docs/QUALIFICATION_RUNBOOK.md` and Issue #10.
