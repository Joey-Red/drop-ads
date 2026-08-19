import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("Clear and Escape share keyboard-safe transient filter recovery", () => {
  assert.match(source, /clear\.disabled = !controller\.input\.value/);
  assert.match(source, /const clearFilter = \(\) => \{/);
  assert.match(source, /input\.value = "";[\s\S]*controller\.pendingMutationFocus = null;[\s\S]*applyFilter\(controller\);[\s\S]*input\.focus\(\);/);
  assert.match(source, /event\.key === "Escape" && input\.value/);
  assert.match(source, /event\.key === "ArrowDown" && focusFirstVisibleRowControl\(controller\)/);
  assert.match(source, /clear\.addEventListener\("click", clearFilter\)/);
  assert.match(source, /clear\.removeEventListener\("click", controller\.clearFilter\)/);
});
