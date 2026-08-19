import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/list-filter-ergonomics.js", import.meta.url), "utf8");

test("filter presentation recovers focus from rows that become hidden", () => {
  assert.match(source, /function recoverHiddenRowFocus\(input, list\)/);
  assert.match(source, /const active = document\.activeElement/);
  assert.match(source, /if \(!active \|\| !list\.contains\(active\)\) return/);
  assert.match(source, /if \(row\?\.hidden\) input\.focus\(\)/);
  assert.match(source, /attributeFilter: \["hidden"\]/);
  assert.match(source, /focusObserver\?\.disconnect\(\)/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|fetch\(|sendMessage\(/);
});
