import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/picker-ui.js", import.meta.url), "utf8");

test("M874 picker has explicit increased-contrast and forced-colors presentation", () => {
  assert.match(source, /@media \(prefers-contrast: more\)/);
  assert.match(source, /#panel \{ border-width:3px; box-shadow:none; \}/);
  assert.match(source, /@media \(forced-colors: active\)/);
  assert.match(source, /#box, #panel, #candidate, button \{ border-color: CanvasText; \}/);
  assert.match(source, /button:disabled \{ color:GrayText; opacity:1; \}/);
  assert.match(source, /button:focus-visible \{ outline-color: Highlight; \}/);
});
