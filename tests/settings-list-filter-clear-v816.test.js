import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");
test("list filters expose an explicit local clear action", () => {
  assert.match(source, /clear\.textContent = "Clear"/);
  assert.match(source, /controller\.clear\.disabled = !controller\.input\.value/);
  assert.match(source, /clear\.setAttribute\("aria-controls", spec\.listId\)/);
  assert.match(source, /clearFilter = \(\) =>/);
  assert.match(source, /input\.focus\(\)/);
  assert.match(source, /clear\.removeEventListener\("click", controller\.clearFilter\)/);
});
