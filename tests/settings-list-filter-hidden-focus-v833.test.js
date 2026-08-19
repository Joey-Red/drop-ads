import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/list-filter-ergonomics.js", import.meta.url), "utf8");

test("active filters recover focus when a dynamic row becomes hidden", () => {
  assert.match(source, /function recoverHiddenRowFocus\(input, list\)/);
  assert.match(source, /if \(row\?\.hidden\) input\.focus\(\)/);
  assert.match(source, /attributeFilter: \["hidden"\]/);
  assert.match(source, /queueMicrotask\(\(\) => recoverHiddenRowFocus\(input, list\)\)/);
  assert.match(source, /focusObserver\?\.disconnect\(\)/);
});
