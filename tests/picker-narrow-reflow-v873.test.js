import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/picker-ui.js", import.meta.url), "utf8");

test("M873 picker reflows safely on narrow viewports", () => {
  assert.match(source, /@media \(max-width: 420px\)/);
  assert.match(source, /#panel \{ bottom: 10px; width: calc\(100vw - 20px\); max-height: calc\(100vh - 20px\); padding: 12px; \}/);
  assert.match(source, /#actions \{ flex-direction:column; \}/);
  assert.match(source, /#actions button \{ width:100%; box-sizing:border-box; \}/);
});
