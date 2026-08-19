import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/options/reset-settings-ui.js", import.meta.url), "utf8");

test("M842 confirmed reset owns busy state across every confirmation control", () => {
  assert.match(source, /let resetBusy = false/);
  assert.match(source, /setResetBusy\(true\)/);
  assert.match(source, /resetButton\.disabled = busy/);
  assert.match(source, /resetConfirmButton\.disabled = busy/);
  assert.match(source, /resetCancelButton\.disabled = busy/);
  assert.match(source, /event\.key !== "Escape" \|\| resetBusy/);
  assert.match(source, /finally \{[\s\S]*setResetBusy\(false\)/);
});
