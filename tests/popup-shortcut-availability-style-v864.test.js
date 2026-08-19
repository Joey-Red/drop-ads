import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const css = fs.readFileSync(new URL("../src/popup/popup.css", import.meta.url), "utf8");

test("M864 keeps unavailable shortcut guidance legible across presentation modes", () => {
  assert.match(css, /\.shortcut-list li\[aria-disabled="true"\] \{ opacity: \.55; \}/);
  assert.match(css, /@media \(prefers-contrast: more\)[\s\S]*\.shortcut-list li\[aria-disabled="true"\][^}]*opacity: 1;/);
  assert.match(css, /@media \(forced-colors: active\)[\s\S]*\.shortcut-list li\[aria-disabled="true"\][^}]*opacity: 1;/);
});
