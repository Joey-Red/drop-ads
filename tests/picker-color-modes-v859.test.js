import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/content/picker-ui.js", import.meta.url), "utf8");

test("picker uses system colors and forced-colors-safe focus", () => {
  assert.match(source, /color-scheme:\s*light dark/);
  assert.match(source, /background:\s*Canvas/);
  assert.match(source, /color:\s*CanvasText/);
  assert.match(source, /@media \(forced-colors: active\)/);
  assert.match(source, /outline-color:\s*Highlight/);
  assert.doesNotMatch(source, /background:\s*#fff/);
});
