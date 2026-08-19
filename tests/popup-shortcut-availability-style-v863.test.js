import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync(new URL("../src/popup/popup.css", import.meta.url), "utf8");

test("shortcut availability markers remain readable across popup presentation modes", () => {
  assert.match(css, /\.shortcut-list li\[aria-disabled="true"\] \{ opacity: \.55; \}/);
  assert.match(css, /\.shortcut-availability \{ grid-column: 2; font-size: 13px; font-weight: 650; \}/);
  assert.match(css, /@media \(prefers-contrast: more\)[\s\S]*\.shortcut-list li\[aria-disabled="true"\][\s\S]*opacity: 1/);
  assert.match(css, /@media \(forced-colors: active\)[\s\S]*\.shortcut-list li\[aria-disabled="true"\][\s\S]*opacity: 1/);
});
