import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const css = fs.readFileSync(new URL("../src/popup/popup.css", import.meta.url), "utf8");

test("M864 shortcut help remains readable across popup accessibility modes", () => {
  assert.match(css, /\.shortcut-help summary \{[^}]*min-height: 44px;/s);
  assert.match(css, /kbd \{[^}]*border: 1px solid currentColor;/s);
  assert.match(css, /\.shortcut-list span \{[^}]*overflow-wrap: anywhere;/s);
  assert.match(css, /@media \(max-width: 360px\)[\s\S]*\.shortcut-list li/);
  assert.match(css, /@media \(prefers-contrast: more\)[\s\S]*\.shortcut-help/);
  assert.match(css, /@media \(forced-colors: active\)[\s\S]*\.shortcut-help summary:focus-visible/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
