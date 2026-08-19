import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync(new URL("../src/popup/popup.css", import.meta.url), "utf8");

test("M865 keeps shortcut help readable at narrow widths and contrast modes", () => {
  assert.match(css, /\.shortcut-help summary \{[^}]*min-height: 44px;[^}]*overflow-wrap: anywhere;/s);
  assert.match(css, /\.shortcut-help\[open\] summary \{ border-bottom:/);
  assert.match(css, /kbd \{[^}]*flex-shrink: 0;/s);
  assert.match(css, /@media \(max-width: 360px\)[\s\S]*\.shortcut-list \{ padding-inline: 10px; \}/);
  assert.match(css, /@media \(prefers-contrast: more\)[\s\S]*\.shortcut-help\[open\] summary/);
  assert.match(css, /@media \(forced-colors: active\)[\s\S]*\.shortcut-help\[open\] summary/);
  assert.match(css, /\.shortcut-list li\[aria-disabled="true"\] \{ opacity: \.55; \}/);
  assert.doesNotMatch(css, /neon|glow|text-shadow|box-shadow/i);
});
