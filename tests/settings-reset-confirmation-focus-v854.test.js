import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/reset-settings-ui.js", import.meta.url), "utf8");

test("M854 configured reset confirmation is inline, cancelable, busy-safe, and focus-safe", () => {
  assert.match(source, /confirmation\.hidden = true/);
  assert.match(source, /confirmation\.setAttribute\("aria-keyshortcuts", "Escape"\)/);
  assert.match(source, /resetButton\.setAttribute\("aria-expanded", visible \? "true" : "false"\)/);
  assert.match(source, /resetConfirmButton\.setAttribute\("aria-busy", "true"\)/);
  assert.match(source, /resetStatus\.textContent = "Configured settings reset cancelled\."/);
  assert.match(source, /resetButton\?\.focus\(\)/);
  assert.match(source, /\(succeeded \? resetButton : resetConfirmButton\)\.focus\(\)/);
  assert.doesNotMatch(source, /globalThis\.confirm|window\.confirm/);
});
