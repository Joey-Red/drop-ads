import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const packageJson = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("qualification preflight runs the exact non-browser preparation sequence", () => {
  assert.equal(
    packageJson.scripts["qualify:preflight"],
    "npm run check && npm run package && npm run verify:release && npm run verify:reproducible && npm run qualify:sources && npm run qualify:record && npm run qualification-record-audit"
  );

  const command = packageJson.scripts["qualify:preflight"];
  const ordered = [
    "npm run check",
    "npm run package",
    "npm run verify:release",
    "npm run verify:reproducible",
    "npm run qualify:sources",
    "npm run qualify:record",
    "npm run qualification-record-audit"
  ];
  let previous = -1;
  for (const token of ordered) {
    const index = command.indexOf(token);
    assert.ok(index > previous, `${token} must appear after the previous preflight stage`);
    previous = index;
  }
});

test("qualification preflight does not start browser fixture or claim browser observations", () => {
  const command = packageJson.scripts["qualify:preflight"];
  assert.doesNotMatch(command, /qualify:serve/);
  assert.doesNotMatch(command, /qualification-server/);
  assert.doesNotMatch(command, /chromium|firefox/i);
});

test("observation preparation validates the candidate before and after seeding", () => {
  assert.equal(
    packageJson.scripts["qualify:observation"],
    "npm run qualification-record-audit && node tools/qualification-observation-prepare.mjs && npm run qualification-observation-record-audit"
  );
  assert.doesNotMatch(packageJson.scripts["qualify:observation"], /qualify:serve|qualification-server/);
});

test("qualification status remains a read-only local summary command", () => {
  assert.equal(packageJson.scripts["qualify:status"], "node tools/qualification-observation-summary.mjs");
  assert.doesNotMatch(packageJson.scripts["qualify:status"], /qualify:serve|qualification-server|chromium|firefox|curl|fetch|https?:/i);
});
