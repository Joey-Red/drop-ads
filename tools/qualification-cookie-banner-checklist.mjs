const phase = (id, title, documents, commands, expected, fixtureIds) => Object.freeze({
  id,
  title,
  documents: Object.freeze([...documents]),
  commands: Object.freeze([...commands]),
  expected: Object.freeze([...expected]),
  fixtureIds: Object.freeze([...fixtureIds])
});

export const COOKIE_BANNER_QUALIFICATION_PHASES = Object.freeze([
  phase(
    "mode-site-recovery",
    "Reject/Off and site recovery",
    [
      "docs/COOKIE_BANNER_QUALIFICATION_SCENARIO.md",
      "docs/COOKIE_BANNER_SITE_QUALIFICATION.md"
    ],
    ["npm run qualify:serve"],
    [
      "Reject mode activates the safe immediate control on a fresh load.",
      "Off mode leaves cookie-banner controls untouched until Reject is restored on a later fresh load.",
      "Persistent current-site exclusion suppresses automatic rejection without disabling unrelated network, cookie, or cosmetic protection, and re-enable restores later-load behavior."
    ],
    ["main-loopback"]
  ),
  phase(
    "localization",
    "Reviewed exact localization",
    [
      "docs/COOKIE_BANNER_QUALIFICATION_SCENARIO.md",
      "docs/COOKIE_BANNER_ACTION_SOURCE_QUALIFICATION.md"
    ],
    [
      "node tools/cookie-banner-action-source-qualification-server.mjs",
      "node tools/cookie-banner-localization-qualification-server.mjs"
    ],
    [
      "Reviewed multilingual reject-all and necessary-only labels activate only under matching strong cookie/privacy evidence.",
      "Generic consent, non-exact labels, ambiguity, accept/manage/preferences/settings actions, and Off mode remain untouched."
    ],
    ["action-source", "localization"]
  ),
  phase(
    "action-identity",
    "Action identity and accessible-name safety",
    [
      "docs/COOKIE_BANNER_QUALIFICATION_SCENARIO.md",
      "docs/COOKIE_BANNER_ACTION_SOURCE_QUALIFICATION.md"
    ],
    ["node tools/cookie-banner-action-source-qualification-server.mjs"],
    [
      "Direct, input, descendant, and same-root aria-labelledby naming channels obey all documented bounds and exact-agreement rules.",
      "Oversized, conflicting, hidden-only, interactive, Drop Ads-owned, invalid-reference, invisible-format, and unsupported-script sources fail closed."
    ],
    ["action-source"]
  ),
  phase(
    "context-semantics",
    "Action context and semantics refusal",
    [
      "docs/COOKIE_BANNER_QUALIFICATION_SCENARIO.md",
      "docs/COOKIE_BANNER_ACTION_SOURCE_QUALIFICATION.md"
    ],
    ["node tools/cookie-banner-action-source-qualification-server.mjs"],
    [
      "Secondary activation ancestry and editable contexts remain untouched.",
      "Popup, toggle, popover, disclosure, reset, conflicting native-role, busy, controlled-region, and declarative-command semantics fail closed while an ordinary safe action remains compatible."
    ],
    ["action-source"]
  ),
  phase(
    "platform-controller",
    "Platform and controller ownership",
    [
      "docs/COOKIE_BANNER_UTILS_COMPOSITION_QUALIFICATION.md",
      "docs/COOKIE_BANNER_COLLABORATOR_OWNERSHIP_QUALIFICATION.md",
      "docs/COOKIE_BANNER_PLATFORM_PRIMITIVES_QUALIFICATION.md",
      "docs/COOKIE_BANNER_BASE_UTILS_PLATFORM_QUALIFICATION.md",
      "docs/COOKIE_BANNER_CONTROLLER_PLATFORM_QUALIFICATION.md"
    ],
    ["npm run qualify:serve"],
    [
      "Captured descriptor-safe utility, collaborator, DOM, style, geometry, viewport, hit-test, document, observer, and extension-API boundaries preserve ordinary safe rejection.",
      "Malformed or conflicting platform/collaborator state fails closed without live fallback."
    ],
    ["main-loopback"]
  ),
  phase(
    "late-shadow-revalidation",
    "Late/open-shadow discovery and final revalidation",
    [
      "docs/COOKIE_BANNER_QUALIFICATION_SCENARIO.md",
      "docs/COOKIE_BANNER_CONTROLLER_PLATFORM_QUALIFICATION.md",
      "docs/COOKIE_BANNER_PLATFORM_PRIMITIVES_QUALIFICATION.md"
    ],
    ["npm run qualify:serve"],
    [
      "Bounded delayed MutationObserver discovery and newly reachable open-shadow resynchronization work within the documented ceilings while closed roots stay untouched.",
      "Final candidate revalidation prevents activation after movement, hiding, disconnect, semantic change, or coverage."
    ],
    ["main-loopback"]
  ),
  phase(
    "privacy-finalization",
    "Privacy boundary and guarded finalization",
    ["docs/COOKIE_BANNER_QUALIFICATION_SCENARIO.md"],
    [],
    [
      "No URL/page/banner/action/accessibility-name/consent/DOM/request/frame/document/observer/platform/language history, statistics, timestamps, identifiers, analytics, or telemetry are retained.",
      "Only real exact-head Chromium and Firefox observations may be recorded as PASS through the guarded qualification workflow."
    ],
    []
  )
]);

const PHASE_BY_ID = new Map(COOKIE_BANNER_QUALIFICATION_PHASES.map((entry) => [entry.id, entry]));

export function cookieBannerQualificationPhase(id) {
  if (typeof id !== "string" || !id) throw new TypeError("cookie-banner qualification phase is invalid");
  const value = PHASE_BY_ID.get(id);
  if (!value) throw new TypeError("cookie-banner qualification phase is unknown");
  return value;
}
