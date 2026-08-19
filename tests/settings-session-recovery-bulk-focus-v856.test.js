import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/session-pauses.js", import.meta.url), "utf8");

test("bulk session recovery restores useful keyboard focus", () => {
  assert.match(source, /if \(!domains\.length\) \{[\s\S]*focusSessionHeading\(\);[\s\S]*return;/);
  assert.match(source, /Protection resumed for all temporarily paused sites\.[\s\S]*focusSessionHeading\(\);/);
  assert.match(source, /bulkRecoveryActive = false;[\s\S]*recoveryMutationActive = false;[\s\S]*if \(pageActive\) \{[\s\S]*syncRecoveryControls\(\);[\s\S]*if \(failed && resumeAll\.isConnected && !resumeAll\.disabled\) resumeAll\.focus\(\);/);
});
