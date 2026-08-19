import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("active filters restore mutation focus only to visible rows", () => {
  assert.match(source, /function visibleRows\(controller\)/);
  assert.match(source, /!row\.hidden/);
  assert.match(source, /function rememberFilteredMutationFocus\(controller, event\)/);
  assert.match(source, /if \(!normalizedQuery\(controller\.input\.value\)\) return;/);
  assert.match(source, /function restoreFilteredMutationFocus\(controller\)/);
  assert.match(source, /controller\.input\.focus\(\)/);
  assert.match(source, /pendingControlReenabled/);
});
