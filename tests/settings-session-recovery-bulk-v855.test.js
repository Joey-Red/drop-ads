import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/session-pauses.js", import.meta.url), "utf8");

test("M855 bulk session recovery is deterministic single-flight and runtime mediated", () => {
  assert.match(source, /async function resumeAllSessionPauses\(\)/);
  assert.match(source, /if \(!pageActive \|\| !status \|\| !resumeAll \|\| recoveryMutationActive\) return;/);
  assert.match(source, /const domains = fixedCodeUnitSort\(session\.disabledSites\);/);
  assert.match(source, /for \(const domain of domains\)/);
  assert.match(source, /type: "drop-ads:set-session-site-paused"/);
  assert.match(source, /paused: false/);
  assert.match(source, /bulkRecoveryActive = true;/);
  assert.match(source, /bulkRecoveryActive = false;/);
  assert.match(source, /recoveryMutationActive = false;/);
  assert.doesNotMatch(source, /localStorage|indexedDB|fetch\(|sendBeacon|analytics|telemetry/);
});
