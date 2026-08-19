import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/options/reset-settings-ui.js", import.meta.url), "utf8");

test("M843 reset outcome focus remains useful", () => {
  assert.match(source, /let succeeded = false/);
  assert.match(source, /succeeded = true;[\s\S]*setConfirmationVisible\(false\)/);
  assert.match(source, /catch \(error\)[\s\S]*Could not reset configured settings/);
  assert.match(source, /setResetBusy\(false\);\s*\(succeeded \? resetButton : resetConfirmButton\)\.focus\(\)/s);
  assert.match(source, /Configured settings restored to defaults\. Temporary session pauses were left unchanged\./);
});
