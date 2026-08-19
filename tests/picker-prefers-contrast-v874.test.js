import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/picker-ui.js", import.meta.url), "utf8");

test("M874 picker has explicit increased-contrast presentation", () => {
  assert.match(source, /@media \(prefers-contrast: more\)/);
  assert.match(source, /#box \{ border-width:4px; background:transparent; \}/);
  assert.match(source, /#panel \{ border-width:3px; box-shadow:none; \}/);
  assert.match(source, /#candidate, button \{ border-width:2px; \}/);
});
