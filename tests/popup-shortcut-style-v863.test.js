import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const css = fs.readFileSync(new URL("../src/popup/popup.css", import.meta.url), "utf8");

test("M863 keeps shortcut help resilient and matte", () => {
  assert.match(css, /\.shortcut-help \{/);
  assert.match(css, /\.shortcut-help summary \{[^}]*min-height: 44px/s);
  assert.match(css, /@media \(max-width: 360px\)/);
  assert.match(css, /@media \(prefers-contrast: more\)/);
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(css, /neon|glow|text-shadow|box-shadow/i);
});
