import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/session-pauses.js", import.meta.url), "utf8");

test("partial Resume all failure restores focus after the control is re-enabled", () => {
  assert.match(source, /let failed = false;/);
  assert.match(source, /catch \{ failed = true; \}/);
  assert.match(source, /bulkRecoveryActive = false;[\s\S]*recoveryMutationActive = false;[\s\S]*syncRecoveryControls\(\);[\s\S]*if \(failed && resumeAll\.isConnected && !resumeAll\.disabled\) resumeAll\.focus\(\);/);
});
