import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/reset-settings-ui.js", import.meta.url), "utf8");

test("M846 reset confirmation exposes Escape recovery and deterministic focus", () => {
  assert.match(source, /confirmation\.setAttribute\("aria-keyshortcuts", "Escape"\)/);
  assert.match(source, /if \(event\.key !== "Escape" \|\| resetBusy \|\| resetConfirmPanel\?\.hidden\) return;/);
  assert.match(source, /cancelConfiguredReset\(\);/);
  assert.match(source, /resetButton\?\.focus\(\);/);
  assert.match(source, /\(succeeded \? resetButton : resetConfirmButton\)\.focus\(\);/);
  assert.match(source, /resetConfirmPanel\?\.removeEventListener\("keydown", handleConfirmationKeydown\)/);
});
