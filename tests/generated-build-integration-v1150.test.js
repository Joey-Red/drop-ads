import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const integration = fs.readFileSync(new URL("../tools/generated-release-integration-audit.mjs", import.meta.url), "utf8");
const milestones = fs.readFileSync(new URL("../docs/MILESTONES_1142_1151.md", import.meta.url), "utf8");
const guide = fs.readFileSync(new URL("../docs/GENERATED_BUILD_IO_QUALIFICATION.md", import.meta.url), "utf8");
const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("M1150 extends generated-release integration through M1149 without losing history", () => {
  assert.match(integration, /canonical M1102-M1107 generated artifact boundaries are joined/);
  assert.match(integration, /extended through M1149 atomic generated build I\/O boundaries/);
  for (let milestone = 1142; milestone <= 1149; milestone += 1) {
    assert.ok(integration.includes(`v${milestone}.test.js`), `missing M${milestone} focused regression from integration audit`);
  }
});

test("M1150 keeps canonical check wiring single-instance", () => {
  assert.equal((pkg.scripts.check.match(/npm run generated-release-integration-audit/g) || []).length, 1);
});

test("M1150 documents supporting-evidence and privacy boundaries", () => {
  assert.match(milestones, /M1150 — Generated-release integration extension/);
  assert.match(guide, /supporting\/preflight evidence/);
  assert.match(guide, /Issue #10/);
  assert.match(guide, /Do not collect or retain browsing\/request history/);
});
