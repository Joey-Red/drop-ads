import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/options/reset-settings-ui.js", import.meta.url), "utf8");

test("configured reset restores focus without obscuring the session boundary", () => {
  assert.match(source, /sessionNote\.id = "reset-settings-session-note"/);
  assert.match(source, /Temporary session pauses are separate ephemeral recovery state and are not cleared by this action/);
  assert.match(source, /button\.setAttribute\("aria-describedby", "reset-settings-help reset-settings-session-note reset-settings-privacy reset-settings-status reset-settings-error"\)/);
  assert.match(source, /confirmButton\.setAttribute\("aria-describedby", "reset-settings-confirmation-text reset-settings-session-note reset-settings-privacy reset-settings-status reset-settings-error"\)/);
  assert.match(source, /let succeeded = false/);
  assert.match(source, /succeeded = true/);
  assert.match(source, /\(succeeded \? resetButton : resetConfirmButton\)\.focus\(\)/);
  assert.match(source, /Configured settings restored to defaults\. Temporary session pauses were left unchanged\./);
});
