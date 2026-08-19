import fs from "node:fs";

function read(path) { return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8"); }
function requireText(source, needle, label) { if (!source.includes(needle)) throw new Error(`${label} is missing`); }

const scenarios = read("tools/qualification-scenarios.mjs");
const prepare = read("tools/qualification-observation-prepare.mjs");
const catalog = read("tools/qualification-scenario-guide.mjs");
const command = read("tools/qualification-scenario-command.mjs");
const guide = read("docs/COOKIE_BANNER_QUALIFICATION_SCENARIO.md");

requireText(scenarios, '"deterministic-fixture",\n  "cookie-banner-rejection",\n  "privacy-invariants"', "canonical cookie-banner scenario placement");
requireText(scenarios, 'Object.freeze({ status: "UNOBSERVED", notes: "" })', "privacy-minimal UNOBSERVED browser slot");
requireText(prepare, "createUnobservedScenarioMatrixV3()", "schema-v3 scenario seed");
requireText(catalog, '"cookie-banner-rejection"', "cookie-banner scenario guidance");
requireText(catalog, '"docs/COOKIE_BANNER_QUALIFICATION_SCENARIO.md"', "consolidated scenario guide link");
requireText(command, "qualificationScenarioGuidance(id)", "scenario guidance command");
requireText(guide, "Issue #10 remains the authoritative release gate", "browser evidence boundary");
requireText(guide, "npm run qualify:mark -- scenario cookie-banner-rejection chromium PASS", "Chromium mark command");
requireText(guide, "npm run qualify:mark -- scenario cookie-banner-rejection firefox PASS", "Firefox mark command");
requireText(guide, "No URL/page/banner/action/accessibility-name/consent/DOM/style/geometry/viewport/hit-test/shadow/frame/document/observer/platform/language history", "zero-retention checklist");

const executable = `${catalog}\n${command}`;
if (/process\.env|localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|Date\.|performance\.|navigator\.|location\.|document\.|browser\.|chrome\./.test(executable)) {
  throw new Error("cookie-banner scenario guidance must remain deterministic source-only metadata");
}

console.log("qualification-cookie-banner-scenario-audit: canonical cookie-banner scenario invariants verified");
