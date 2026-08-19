import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/session-pauses.js", import.meta.url), "utf8");

test("M852 keeps keyboard focus useful after per-site and bulk session recovery", () => {
  assert.match(source, /function restoreResumeFocus\(rowIndex\)/);
  assert.match(source, /rows\[Math\.min\(rowIndex, rows\.length - 1\)\]/);
  assert.match(source, /row\?\.querySelector\("button\.session-resume"\)\?\.focus\(\)/);
  assert.match(source, /heading\.focus\(\{ preventScroll: true \}\)/);
  assert.match(source, /if \(rendered && pageActive\) \{ status\.textContent = "Protection resumed for this site\."; shouldRestoreFocus = true; \}/);
  assert.match(source, /recoveryMutationActive = false;\s*if \(pageActive\) syncRecoveryControls\(\);\s*if \(shouldRestoreFocus && pageActive\) restoreResumeFocus\(rowIndex\)/);
  assert.match(source, /if \(failed && resumeAll\.isConnected && !resumeAll\.disabled\) resumeAll\.focus\(\)/);
});
