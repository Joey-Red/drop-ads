import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("list filters expose local clear and Escape recovery with owned teardown", () => {
  assert.match(source, /clear\.className = "list-filter-clear"/);
  assert.match(source, /clear\.setAttribute\("aria-controls", spec\.listId\)/);
  assert.match(source, /controller\.clear\.disabled = !controller\.input\.value/);
  assert.match(source, /const clearFilter = \(\) => \{/);
  assert.match(source, /input\.value = "";[\s\S]*applyFilter\(controller\);[\s\S]*input\.focus\(\)/);
  assert.match(source, /event\.key !== "Escape"/);
  assert.match(source, /clear\.addEventListener\("click", clearFilter\)/);
  assert.match(source, /clear\.removeEventListener\("click", controller\.clearFilter\)/);
});
