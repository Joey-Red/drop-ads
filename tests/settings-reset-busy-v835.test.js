import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/options/reset-settings-ui.js", import.meta.url), "utf8");

test("configured reset is single-flight and teardown-safe", () => {
  assert.match(source, /let resetBusy = false/);
  assert.match(source, /function setResetBusy\(busy\)/);
  assert.match(source, /resetButton\.disabled = busy/);
  assert.match(source, /resetConfirmButton\.disabled = busy/);
  assert.match(source, /resetCancelButton\.disabled = busy/);
  assert.match(source, /resetButton\.setAttribute\("aria-busy", "true"\)/);
  assert.match(source, /resetConfirmButton\.setAttribute\("aria-busy", "true"\)/);
  assert.match(source, /resetPanel\?\.setAttribute\("aria-busy", "true"\)/);
  assert.match(source, /if \(!pageActive \|\| resetBusy/);
  assert.match(source, /if \(pageActive && resetButton\?\.isConnected && resetConfirmButton\?\.isConnected\)/);
  assert.match(source, /pageActive = false/);
  assert.match(source, /removeEventListener\("click", requestConfiguredReset\)/);
});
