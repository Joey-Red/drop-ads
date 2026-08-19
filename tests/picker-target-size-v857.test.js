import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/picker-ui.js", import.meta.url), "utf8");

test("M857 picker actions retain the shared 44px target floor", () => {
  assert.match(source, /button \{[^}]*min-height:44px/s);
  assert.match(source, /button:focus-visible \{[^}]*outline:3px solid CanvasText/s);
  assert.match(source, /@media \(forced-colors: active\)[\s\S]*button:focus-visible \{ outline-color: Highlight; \}/);
  assert.match(source, /#panel \{[^}]*width: min\(620px, calc\(100vw - 32px\)\)/s);
});
