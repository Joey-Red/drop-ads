import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const scenarios = fs.readFileSync(new URL("../tools/qualification-scenarios.mjs", import.meta.url), "utf8");
const prepare = fs.readFileSync(new URL("../tools/qualification-observation-prepare.mjs", import.meta.url), "utf8");
const next = fs.readFileSync(new URL("../tools/qualification-observation-next.mjs", import.meta.url), "utf8");
const status = fs.readFileSync(new URL("../tools/qualification-observation-summary.mjs", import.meta.url), "utf8");

const scenarioIds = [...scenarios.matchAll(/^  "([a-z0-9-]+)",?$/gm)].map((match) => match[1]);

test("schema-v3 readiness has fifteen canonical scenarios including cookie banners", () => {
  assert.equal(scenarioIds.length, 15);
  assert.equal(scenarioIds.at(-2), "cookie-banner-rejection");
  assert.equal(scenarioIds.at(-1), "privacy-invariants");
  assert.match(prepare, /scenarios: createUnobservedScenarioMatrixV3\(\)/);
  assert.match(status, /scenarioCount: QUALIFICATION_SCENARIOS\.length/);
  assert.match(status, /ready: chromiumSummary\.passing && firefoxSummary\.passing/);
});

test("next-step traversal cannot skip the cookie-banner scenario", () => {
  assert.match(next, /for \(const id of QUALIFICATION_SCENARIOS\)/);
  assert.match(next, /firstUnobserved === null && status === "UNOBSERVED"/);
  assert.match(next, /action = "observe-scenario";\s*scenario = firstUnobserved;/s);
  assert.ok(scenarioIds.indexOf("cookie-banner-rejection") < scenarioIds.indexOf("privacy-invariants"));
});
