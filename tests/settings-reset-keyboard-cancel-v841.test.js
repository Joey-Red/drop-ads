import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/options/reset-settings-ui.js", import.meta.url), "utf8");

test("M841 reset confirmation cancels with button or Escape and restores focus", () => {
  assert.match(source, /function cancelConfiguredReset\(\)[\s\S]*setConfirmationVisible\(false\)[\s\S]*resetButton\?\.focus\(\)/);
  assert.match(source, /function handleConfirmationKeydown\(event\)[\s\S]*event\.key !== "Escape"[\s\S]*event\.preventDefault\(\)[\s\S]*cancelConfiguredReset\(\)/);
  assert.match(source, /resetCancelButton\?\.addEventListener\("click", cancelConfiguredReset\)/);
  assert.match(source, /resetConfirmPanel\?\.addEventListener\("keydown", handleConfirmationKeydown\)/);
  assert.match(source, /resetConfirmPanel\?\.removeEventListener\("keydown", handleConfirmationKeydown\)/);
});
