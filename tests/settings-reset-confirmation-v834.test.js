import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/options/reset-settings-ui.js", import.meta.url), "utf8");

test("configured reset requires inline confirmation before the runtime request", () => {
  const revealIndex = source.indexOf("setConfirmationVisible(true)");
  const confirmIndex = source.indexOf("async function confirmConfiguredReset()");
  const sendIndex = source.indexOf('sendOptionsRuntimeMessage(api, { type: "drop-ads:reset-settings" })');
  assert.ok(revealIndex >= 0 && confirmIndex > revealIndex && sendIndex > confirmIndex);
  assert.match(source, /confirmation\.hidden = true/);
  assert.match(source, /confirmButton\.textContent = "Confirm reset"/);
  assert.match(source, /cancelButton\.textContent = "Cancel"/);
  assert.match(source, /Configured settings reset cancelled\./);
  assert.match(source, /Temporary session pauses will remain until the browser session ends/);
  assert.doesNotMatch(source, /globalThis\.confirm/);
  assert.match(source, /optionsCaughtErrorMessage\(error, "Could not reset configured settings"\)/);
});
