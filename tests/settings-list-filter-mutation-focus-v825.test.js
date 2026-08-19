import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("filtered list mutations restore focus only among visible rows", () => {
  assert.match(source, /function rememberFilteredMutationFocus\(controller, event\)/);
  assert.match(source, /if \(!normalizedQuery\(controller\.input\.value\)\) return/);
  assert.match(source, /button\.remove, button\.secondary-action/);
  assert.match(source, /pendingMutationFocus = \{ index, control: action \}/);
  assert.match(source, /function restoreFilteredMutationFocus\(controller\)/);
  assert.match(source, /const rows = visibleRows\(controller\)/);
  assert.match(source, /if \(!rows\.length\) \{\s*controller\.input\.focus\(\);/s);
  assert.match(source, /rows\[Math\.min\(pending\.index, rows\.length - 1\)\]/);
  assert.match(source, /pendingControlReenabled/);
  assert.match(source, /controller\.pendingMutationFocus = null/);
});
