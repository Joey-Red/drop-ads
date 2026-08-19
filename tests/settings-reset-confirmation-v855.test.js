import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/reset-settings-ui.js", import.meta.url), "utf8");

test("M855 reset requires explicit inline confirmation and keyboard-safe cancellation", () => {
  assert.match(source, /confirmation\.hidden = true/);
  assert.match(source, /confirmation\.setAttribute\("aria-keyshortcuts", "Escape"\)/);
  assert.match(source, /function requestConfiguredReset\(\)/);
  assert.match(source, /setConfirmationVisible\(true\)/);
  assert.match(source, /resetConfirmButton\?\.focus\(\)/);
  assert.match(source, /async function confirmConfiguredReset\(\)/);
  assert.match(source, /sendOptionsRuntimeMessage\(api, \{ type: "drop-ads:reset-settings" \}\)/);
  assert.match(source, /function cancelConfiguredReset\(\)/);
  assert.match(source, /setConfirmationVisible\(false\)/);
  assert.match(source, /resetButton\?\.focus\(\)/);
  assert.match(source, /event\.key !== "Escape" \|\| resetBusy \|\| resetConfirmPanel\?\.hidden/);
  assert.doesNotMatch(source, /globalThis\.confirm|window\.confirm/);
});
