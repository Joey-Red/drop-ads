import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/picker-ui.js", import.meta.url), "utf8");

test("M870 picker actions keep the shared 44px target floor", () => {
  assert.match(source, /button \{ min-height:44px;/);
  assert.match(source, /button:focus-visible \{ outline:3px solid CanvasText;/);
  assert.match(source, /@media \(forced-colors: active\)/);
  assert.match(source, /button:focus-visible \{ outline-color: Highlight; \}/);
});
