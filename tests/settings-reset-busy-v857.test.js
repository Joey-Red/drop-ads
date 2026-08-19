import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/options/reset-settings-ui.js", import.meta.url), "utf8");

test("M857 configured reset owns a single-flight busy state across confirmation controls", () => {
  assert.match(source, /let resetBusy = false/);
  assert.match(source, /function setResetBusy\(busy\)/);
  assert.match(source, /resetButton\.disabled = busy/);
  assert.match(source, /resetConfirmButton\.disabled = busy/);
  assert.match(source, /resetCancelButton\.disabled = busy/);
  assert.match(source, /resetConfirmButton\.setAttribute\("aria-busy", "true"\)/);
  assert.match(source, /resetPanel\?\.setAttribute\("aria-busy", "true"\)/);
  assert.match(source, /if \(!pageActive \|\| resetBusy \|\| !resetConfirmButton \|\| resetConfirmButton\.disabled\) return/);
  assert.match(source, /setResetBusy\(true\)/);
  assert.match(source, /setResetBusy\(false\)/);
  assert.match(source, /if \(!pageActive \|\| resetBusy\) return/);
  assert.match(source, /event\.key !== "Escape" \|\| resetBusy/);
});
