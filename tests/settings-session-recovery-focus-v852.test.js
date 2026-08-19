import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/session-pauses.js", import.meta.url), "utf8");

test("M852 restores focus after committed session recovery", () => {
  assert.match(source, /function sessionPauseRows\(\)/);
  assert.match(source, /function restoreResumeFocus\(rowIndex\)/);
  assert.match(source, /rows\[Math\.min\(rowIndex, rows\.length - 1\)\]/);
  assert.match(source, /button\.session-resume/);
  assert.match(source, /function focusSessionHeading\(\)/);
  assert.match(source, /heading\.tabIndex = -1/);
  assert.match(source, /heading\.classList\.add\("jump-focus-target"\)/);
  assert.match(source, /heading\.focus\(\{ preventScroll: true \}\)/);
  assert.match(source, /if \(rendered && pageActive\) \{[\s\S]*shouldRestoreFocus = true;/);
  assert.match(source, /if \(shouldRestoreFocus && pageActive\) restoreResumeFocus\(rowIndex\);/);
});
