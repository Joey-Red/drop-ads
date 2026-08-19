import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/session-pauses.js", import.meta.url), "utf8");

test("M851 bulk temporary-pause recovery is deterministic and privacy-minimal", () => {
  assert.match(source, /async function resumeAllSessionPauses\(\)/);
  assert.match(source, /const domains = fixedCodeUnitSort\(session\.disabledSites\)/);
  assert.match(source, /for \(const domain of domains\)/);
  assert.match(source, /type: "drop-ads:set-session-site-paused"/);
  assert.match(source, /Some temporary pauses could not be resumed\./);
  assert.match(source, /Protection resumed for all temporarily paused sites\./);
  assert.doesNotMatch(source, /failedCount|successCount|resumedCount|Date\.|performance\./);
});
