import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const css = fs.readFileSync(new URL("../src/popup/popup.css", import.meta.url), "utf8");

test("M866 keeps popup shortcut help compact, matte, and contrast-safe", () => {
  assert.match(css, /\.shortcut-help summary \{[^}]*min-height: 44px/s);
  assert.match(css, /\.shortcut-list li \{ display: grid;/);
  assert.match(css, /kbd \{ display: inline-flex;/);
  assert.match(css, /@media \(max-width: 360px\)/);
  assert.match(css, /@media \(prefers-contrast: more\)/);
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(css, /neon|glow|text-shadow|box-shadow/i);
});
