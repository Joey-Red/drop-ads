import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/options/ui-semantics.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/options/options.css", import.meta.url), "utf8");

test("Settings jump links move focus to a visible destination heading", () => {
  assert.match(source, /function focusSettingsDestination\(event\)/);
  assert.match(source, /heading\.tabIndex = -1/);
  assert.match(source, /heading\.focus\(\{ preventScroll: true \}\)/);
  assert.match(source, /removeEventListener\("click", focusSettingsDestination\)/);
  assert.match(css, /\.jump-focus-target:focus \{ outline: 3px solid currentColor; outline-offset: 4px; \}/);
  assert.match(css, /\.jump-focus-target:focus \{ outline-color: Highlight; \}/);
});
