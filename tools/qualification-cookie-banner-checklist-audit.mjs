import fs from "node:fs";
import { COOKIE_BANNER_QUALIFICATION_PHASES } from "./qualification-cookie-banner-checklist.mjs";
import { COOKIE_BANNER_QUALIFICATION_FIXTURES } from "./qualification-cookie-banner-fixtures.mjs";

function read(path) { return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8"); }
function requireText(source, needle, label) { if (!source.includes(needle)) throw new Error(`${label} is missing`); }

const EXPECTED_PHASE_IDS = Object.freeze([
  "mode-site-recovery",
  "localization",
  "action-identity",
  "context-semantics",
  "platform-controller",
  "late-shadow-revalidation",
  "privacy-finalization"
]);
const EXPECTED_FIXTURE_IDS = Object.freeze(["main-loopback", "action-source", "localization"]);

if (!Object.isFrozen(COOKIE_BANNER_QUALIFICATION_PHASES) || COOKIE_BANNER_QUALIFICATION_PHASES.length !== EXPECTED_PHASE_IDS.length) {
  throw new Error("cookie-banner qualification phase catalog shape is invalid");
}
if (JSON.stringify(COOKIE_BANNER_QUALIFICATION_PHASES.map(({ id }) => id)) !== JSON.stringify(EXPECTED_PHASE_IDS)) {
  throw new Error("cookie-banner qualification phase order is not canonical");
}
if (!Object.isFrozen(COOKIE_BANNER_QUALIFICATION_FIXTURES)
  || JSON.stringify(COOKIE_BANNER_QUALIFICATION_FIXTURES.map(({ id }) => id)) !== JSON.stringify(EXPECTED_FIXTURE_IDS)) {
  throw new Error("cookie-banner qualification fixture inventory is not canonical");
}

const fixtureById = new Map(COOKIE_BANNER_QUALIFICATION_FIXTURES.map((entry) => [entry.id, entry]));
for (const phase of COOKIE_BANNER_QUALIFICATION_PHASES) {
  if (!Object.isFrozen(phase) || !Object.isFrozen(phase.documents) || !Object.isFrozen(phase.commands)
    || !Object.isFrozen(phase.expected) || !Object.isFrozen(phase.fixtureIds)) {
    throw new Error(`cookie-banner qualification phase ${phase.id} is not deeply frozen at its public arrays`);
  }
  for (const fixtureId of phase.fixtureIds) {
    if (!fixtureById.has(fixtureId)) throw new Error(`cookie-banner qualification phase ${phase.id} references an unknown fixture`);
  }
}

const main = fixtureById.get("main-loopback");
const action = fixtureById.get("action-source");
const localization = fixtureById.get("localization");
if (main.host !== "127.0.0.1" || main.port !== 41731 || main.command !== "npm run qualify:serve") throw new Error("main loopback fixture identity changed");
if (action.host !== "127.0.0.1" || action.port !== 41733) throw new Error("action-source fixture identity changed");
if (localization.host !== "127.0.0.1" || localization.port !== 41734) throw new Error("localization fixture identity changed");

const mainSource = read("tools/qualification-server.mjs");
const actionSource = read("tools/cookie-banner-action-source-qualification-server.mjs");
const localizationSource = read("tools/cookie-banner-localization-qualification-server.mjs");
const guide = read("docs/COOKIE_BANNER_QUALIFICATION_SCENARIO.md");
const scenarioGuide = read("tools/qualification-scenario-guide.mjs");
const scenarioCommand = read("tools/qualification-scenario-command.mjs");

for (const anchor of main.anchors) requireText(mainSource, anchor, `main fixture anchor ${anchor}`);
for (const route of action.routes) requireText(actionSource, `"${route}"`, `action-source route ${route}`);
for (const route of localization.routes) requireText(localizationSource, `"${route}"`, `localization route ${route}`);

for (const [source, label, port] of [
  [actionSource, "action-source", "41733"],
  [localizationSource, "localization", "41734"]
]) {
  requireText(source, 'const HOST = "127.0.0.1";', `${label} loopback host`);
  requireText(source, `const DEFAULT_PORT = ${port};`, `${label} canonical port`);
  requireText(source, "MAX_REQUEST_URL_CHARS = 2048", `${label} request bound`);
  requireText(source, "MAX_CONNECTIONS = 16", `${label} connection bound`);
  requireText(source, '"cache-control": "no-store"', `${label} no-store response`);
  requireText(source, '["GET", "HEAD"]', `${label} method allowlist`);
}

for (const phaseId of EXPECTED_PHASE_IDS) {
  requireText(guide, `## Phase \`${phaseId}\``, `guide phase ${phaseId}`);
  requireText(guide, `--phase ${phaseId}`, `guide phase command ${phaseId}`);
}
requireText(scenarioGuide, "COOKIE_BANNER_QUALIFICATION_PHASES", "scenario guidance phase binding");
requireText(scenarioCommand, "cookieBannerQualificationFixture", "scenario command fixture binding");
requireText(scenarioCommand, 'argv[1] !== "--phase"', "strict phase command parsing");

const sourceOnly = `${read("tools/qualification-cookie-banner-checklist.mjs")}\n${read("tools/qualification-cookie-banner-fixtures.mjs")}\n${scenarioGuide}\n${scenarioCommand}`;
// Privacy promises and references to qualification records are valid source-only
// guidance. Reject executable ambient identity/time access, persistence, and
// network APIs instead of matching explanatory vocabulary.
const forbiddenSourceOnlySurfaces = Object.freeze([
  [/\bprocess\.env\b/i, "environment access"],
  [/\bos\s*\./i, "OS metadata access"],
  [/\bhostname\s*\(/i, "hostname access"],
  [/\buserInfo\s*\(/, "user identity access"],
  [/\bnew\s+Date\s*\(/, "wall-clock construction"],
  [/\bDate\.now\s*\(/, "wall-clock access"],
  [/\bperformance\.now\s*\(/, "high-resolution time access"],
  [/\bfetch\s*\(/, "network fetch"],
  [/\bXMLHttpRequest\b/, "XMLHttpRequest"],
  [/\bWebSocket\b/, "WebSocket"],
  [/\bsendBeacon\b/, "sendBeacon"],
  [/\blocalStorage\b/, "localStorage"],
  [/\bsessionStorage\b/, "sessionStorage"],
  [/\bindexedDB\b/, "indexedDB"]
]);
for (const [pattern, label] of forbiddenSourceOnlySurfaces) {
  if (pattern.test(sourceOnly)) {
    throw new Error(`cookie-banner qualification checklist metadata crossed the source-only privacy boundary: ${label}`);
  }
}

// Historical M1082-M1087 test files are not part of this integration audit.
// The current test gate owns regression coverage; this audit directly verifies
// the canonical checklist, fixture, scenario, server, and privacy contracts.
console.log("qualification-cookie-banner-checklist-audit: canonical M1082-M1087 phase and fixture invariants verified");
