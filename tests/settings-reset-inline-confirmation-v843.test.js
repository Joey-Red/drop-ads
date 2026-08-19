import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/options/reset-settings-ui.js", import.meta.url), "utf8");

test("configured reset mutation is reachable only from explicit inline confirmation", () => {
  assert.match(source, /button\.setAttribute\("aria-controls", "reset-settings-confirmation"\)/);
  assert.match(source, /confirmation\.setAttribute\("role", "group"\)/);
  assert.match(source, /resetConfirmButton\?\.focus\(\)/);
  const revealStart = source.indexOf("function requestConfiguredReset()");
  const confirmStart = source.indexOf("async function confirmConfiguredReset()");
  const sendIndex = source.indexOf('sendOptionsRuntimeMessage(api, { type: "drop-ads:reset-settings" })');
  assert.ok(revealStart >= 0 && confirmStart > revealStart && sendIndex > confirmStart);
  assert.doesNotMatch(source.slice(revealStart, confirmStart), /sendOptionsRuntimeMessage/);
  assert.match(source, /function cancelConfiguredReset\(\)[\s\S]*setConfirmationVisible\(false\)[\s\S]*resetButton\?\.focus\(\)/);
  assert.match(source, /event\.key !== "Escape"/);
  assert.match(source, /resetConfirmPanel\?\.removeEventListener\("keydown", handleConfirmationKeydown\)/);
});
