import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/session-pauses.js", import.meta.url), "utf8");

test("M850 exposes per-site and bulk temporary-session recovery", () => {
  assert.match(source, /id="session-resume-all"/);
  assert.match(source, /resume\.textContent = "Resume protection"/);
  assert.match(source, /type: "drop-ads:set-session-site-paused"/);
  assert.match(source, /paused: false/);
  assert.match(source, /fixedCodeUnitSort\(session\.disabledSites\)/);
  assert.match(source, /Protection resumed for all temporarily paused sites/);
});
