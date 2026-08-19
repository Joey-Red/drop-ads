# Cookie-banner qualification scenario

This guide is the focused exact-head checklist for the schema-v3 `cookie-banner-rejection` browser observation. It is supporting guidance only; Issue #10 remains the authoritative release gate.

## Preflight

Run from the exact clean source head that produced the candidate packages:

```sh
npm ci
npm run qualify:preflight
npm run qualify:observation
npm run qualify:serve
npm run qualify:scenario -- cookie-banner-rejection
```

Repository tests, audits, fixtures, generated records, source-only phase guidance, and this guide do not count as browser observations. Phase guidance is not written to the qualification observation and is not progress tracking.

## Exact candidate browsers

Repeat the full scenario in both Chromium and Firefox using the exact packaged artifacts bound to `artifacts/qualification-record.json`. Record the browser version before marking the scenario. Any source commit, source fingerprint, package hash, or package size change invalidates the observation.

The seven canonical source-only phases below are ordered guidance for one browser observation. They do not create seven persisted results.

## Phase `mode-site-recovery`

```sh
npm run qualify:scenario -- cookie-banner-rejection --phase mode-site-recovery
```

- In Reject mode, a reviewed exact reject-all action under strong cookie/privacy evidence activates on the safe control fixture.
- In Off mode, the same safe fixture remains untouched; restoring Reject takes effect only on a later fresh load.
- Persistent per-site cookie-banner exclusion disables automatic rejection for that site without disabling network, cookie, or cosmetic protection; parent-domain coverage and re-enable behavior remain correct.

Use `docs/COOKIE_BANNER_SITE_QUALIFICATION.md` with `npm run qualify:serve` for the persistent disable/reload/re-enable cycle.

## Phase `localization`

```sh
npm run qualify:scenario -- cookie-banner-rejection --phase localization
```

- Reviewed German, French, Spanish, Italian, Portuguese, Dutch, Polish, Swedish, Danish, Norwegian, Finnish, and Czech reject-all labels work only under matching strong cookie/privacy evidence; reviewed necessary-only labels remain lower priority than reject-all.
- Generic non-cookie consent, accept/allow/manage/preferences/settings controls, exact-label-plus-extra-text controls, and equal-top-score ambiguity remain untouched.
- No browser locale/language preference selects behavior.

Run the local action-source and localization fixtures listed by the phase guidance.

## Phase `action-identity`

```sh
npm run qualify:scenario -- cookie-banner-rejection --phase action-identity
```

- Direct, input, descendant, and same-root `aria-labelledby` action-name paths obey all bounded source/agreement rules.
- Oversized, conflicting, hidden-only, interactive, Drop Ads-owned, invalid-reference, invisible-format, and unsupported-script sources fail closed.
- Accessible names and action labels are re-evaluated before activation rather than retained as history.

## Phase `context-semantics`

```sh
npm run qualify:scenario -- cookie-banner-rejection --phase context-semantics
```

- Secondary activation ancestry, inherited/editable contexts, popup-launch/toggle/popover semantics, disclosure/reset/native-role/busy/controlled-region/declarative-command semantics remain fail closed while an ordinary safe action stays compatible.
- Navigation/form-submit/hidden/inert/disabled/covered actions remain untouched.
- Equal top-score ambiguity fails closed.

## Phase `platform-controller`

```sh
npm run qualify:scenario -- cookie-banner-rejection --phase platform-controller
```

- Base utility and later wrapper behavior remain compatible through captured descriptor-safe tree/text/root/attribute/control/consent/style/geometry/viewport/hit-test/open-shadow primitives.
- Top-frame HTTP(S)-only domain policy messaging remains domain-only; malformed frame/location/document/API/observer/collaborator/platform state leaves the page untouched.
- Loading-state startup waits safely, and ready-state startup can perform the immediate bounded scan without live page-owned fallback.

Use the utility composition, collaborator ownership, platform primitive, base utility platform, and controller platform guides for the detailed boundary checks.

## Phase `late-shadow-revalidation`

```sh
npm run qualify:scenario -- cookie-banner-rejection --phase late-shadow-revalidation
```

- Immediate rejection works after ready startup; loading-state startup waits safely; bounded late MutationObserver discovery works within 16 attempts, 30 seconds, and the 150 ms settle window.
- Newly reachable open shadow roots are resynchronized within the documented node/root/depth ceilings; closed roots remain untouched.
- Final candidate revalidation prevents activation after the target moves, hides, disconnects, changes meaning, becomes covered, or otherwise ceases to match the selected safe action.

## Phase `privacy-finalization`

```sh
npm run qualify:scenario -- cookie-banner-rejection --phase privacy-finalization
```

- No URL/page/banner/action/accessibility-name/consent/DOM/style/geometry/viewport/hit-test/shadow/frame/document/observer/platform/language history, statistics, timestamps, identifiers, analytics, or telemetry are retained.
- Phase guidance, fixture status text, repository tests, audits, and issue closures are supporting evidence only and never qualify as a browser PASS.
- Only the existing browser-specific scenario status and optional notes may be recorded through the guarded qualification workflow.

## Supporting focused guides

Use these only to execute the detailed fixture steps behind the scenario:

- `docs/COOKIE_BANNER_SITE_QUALIFICATION.md`
- `docs/COOKIE_BANNER_ACTION_SOURCE_QUALIFICATION.md`
- `docs/COOKIE_BANNER_UTILS_COMPOSITION_QUALIFICATION.md`
- `docs/COOKIE_BANNER_COLLABORATOR_OWNERSHIP_QUALIFICATION.md`
- `docs/COOKIE_BANNER_PLATFORM_PRIMITIVES_QUALIFICATION.md`
- `docs/COOKIE_BANNER_BASE_UTILS_PLATFORM_QUALIFICATION.md`
- `docs/COOKIE_BANNER_CONTROLLER_PLATFORM_QUALIFICATION.md`

## Record the scenario

Only after completing every phase observation in one exact candidate browser:

```sh
npm run qualify:mark -- scenario cookie-banner-rejection chromium PASS
npm run qualify:mark -- scenario cookie-banner-rejection firefox PASS
```

Use `FAIL` when any required behavior fails. Do not use `PASS` for repository-only evidence. Use `N/A` only when the scenario is genuinely inapplicable and document that reason in the browser-specific notes supported by the observation tooling.
