import { QUALIFICATION_SCENARIOS } from "./qualification-scenarios.mjs";
import { COOKIE_BANNER_QUALIFICATION_PHASES } from "./qualification-cookie-banner-checklist.mjs";

const SCENARIO_SET = new Set(QUALIFICATION_SCENARIOS);
const COOKIE_BANNER_PHASE_IDS = Object.freeze(COOKIE_BANNER_QUALIFICATION_PHASES.map(({ id }) => id));

const GUIDANCE = Object.freeze({
  "cookie-banner-rejection": Object.freeze({
    title: "Cookie-banner rejection",
    phaseCount: COOKIE_BANNER_PHASE_IDS.length,
    phases: COOKIE_BANNER_PHASE_IDS,
    documents: Object.freeze([
      "docs/COOKIE_BANNER_QUALIFICATION_SCENARIO.md",
      "docs/COOKIE_BANNER_SITE_QUALIFICATION.md",
      "docs/COOKIE_BANNER_ACTION_SOURCE_QUALIFICATION.md",
      "docs/COOKIE_BANNER_UTILS_COMPOSITION_QUALIFICATION.md",
      "docs/COOKIE_BANNER_COLLABORATOR_OWNERSHIP_QUALIFICATION.md",
      "docs/COOKIE_BANNER_PLATFORM_PRIMITIVES_QUALIFICATION.md",
      "docs/COOKIE_BANNER_BASE_UTILS_PLATFORM_QUALIFICATION.md",
      "docs/COOKIE_BANNER_CONTROLLER_PLATFORM_QUALIFICATION.md"
    ]),
    commands: Object.freeze([
      "npm run qualify:serve",
      "node tools/cookie-banner-action-source-qualification-server.mjs",
      "node tools/cookie-banner-localization-qualification-server.mjs"
    ])
  })
});

export function qualificationScenarioGuidance(id) {
  if (typeof id !== "string" || !SCENARIO_SET.has(id)) throw new TypeError("qualification scenario is invalid");
  return Object.prototype.hasOwnProperty.call(GUIDANCE, id) ? GUIDANCE[id] : null;
}
