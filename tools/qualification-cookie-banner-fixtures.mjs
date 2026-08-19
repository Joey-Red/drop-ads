const freezeList = (values) => Object.freeze([...values]);
const fixture = (id, command, host, port, routes, anchors = []) => Object.freeze({
  id,
  command,
  host,
  port,
  routes: freezeList(routes),
  anchors: freezeList(anchors)
});

const LOCALIZED_LANGUAGES = Object.freeze(["polish", "swedish", "danish", "norwegian", "finnish", "czech"]);
const LOCALIZED_KINDS = Object.freeze(["generic-consent", "exactness", "necessary", "priority", "ambiguity"]);
const LOCALIZED_ROUTES = Object.freeze(
  LOCALIZED_LANGUAGES.flatMap((language) => LOCALIZED_KINDS.map((kind) => `/${language}-${kind}`))
);

const ACTION_SOURCE_ROUTES = Object.freeze([
  "/control",
  "/direct-overflow",
  "/descendant-overflow",
  "/direct-visible-conflict",
  "/labelledby-conflict",
  "/navigation-ancestor",
  "/direct-channel-conflict",
  "/labelledby-interactive-descendant",
  "/dropads-descendant",
  "/interactive-descendant",
  "/hidden-text",
  "/invisible-format",
  "/mixed-script",
  "/secondary-label-ancestor",
  "/editable-ancestor",
  "/editable-descendant",
  "/editable-labelledby",
  "/aria-haspopup",
  "/toggle-semantics",
  "/popover-target",
  "/disclosure-state",
  "/reset-action",
  "/native-role-override",
  "/busy-context",
  "/controlled-region",
  "/command-target",
  "/polish-control",
  "/swedish-control",
  "/danish-control",
  "/norwegian-control",
  "/finnish-control",
  "/czech-control"
]);

export const COOKIE_BANNER_QUALIFICATION_FIXTURES = Object.freeze([
  fixture(
    "main-loopback",
    "npm run qualify:serve",
    "127.0.0.1",
    41731,
    ["/"],
    [
      "cookie-banner-static-reject",
      "cookie-banner-static-status",
      "generic-consent-decline",
      "generic-consent-status",
      "cookie-shadow-host",
      "cookie-shadow-status"
    ]
  ),
  fixture(
    "action-source",
    "node tools/cookie-banner-action-source-qualification-server.mjs",
    "127.0.0.1",
    41733,
    ACTION_SOURCE_ROUTES
  ),
  fixture(
    "localization",
    "node tools/cookie-banner-localization-qualification-server.mjs",
    "127.0.0.1",
    41734,
    LOCALIZED_ROUTES
  )
]);

const FIXTURE_BY_ID = new Map(COOKIE_BANNER_QUALIFICATION_FIXTURES.map((entry) => [entry.id, entry]));

export function cookieBannerQualificationFixture(id) {
  if (typeof id !== "string" || !id) throw new TypeError("cookie-banner qualification fixture is invalid");
  const value = FIXTURE_BY_ID.get(id);
  if (!value) throw new TypeError("cookie-banner qualification fixture is unknown");
  return value;
}
