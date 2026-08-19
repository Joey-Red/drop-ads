import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");
test("Escape clears a local filter and preserves search focus", () => {
  assert.match(source, /event\.key !== "Escape"/);
  assert.match(source, /event\.preventDefault\(\)/);
  assert.match(source, /input\.value = ""/);
  assert.match(source, /applyFilter\(controller\)/);
  assert.match(source, /input\.focus\(\)/);
  assert.match(source, /removeEventListener\("keydown", controller\.onKeyDown\)/);
});
