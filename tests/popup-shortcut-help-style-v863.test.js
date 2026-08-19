import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync(new URL("../src/popup/popup.css", import.meta.url), "utf8");

test("M863 shortcut help uses resilient matte system-color presentation", () => {
  assert.match(css, /\.shortcut-help \{[^}]*border: 1px solid/s);
  assert.match(css, /\.shortcut-help summary \{[^}]*min-height: 44px/s);
  assert.match(css, /kbd \{[^}]*border: 1px solid currentColor/s);
  assert.match(css, /@media \(max-width: 360px\)[\s\S]*\.shortcut-list li/);
  assert.match(css, /@media \(prefers-contrast: more\)[\s\S]*\.shortcut-help/);
  assert.match(css, /@media \(forced-colors: active\)[\s\S]*\.shortcut-help summary:focus-visible/);
  assert.doesNotMatch(css, /neon|text-shadow|box-shadow/);
});
