import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("M827 active list filters restore mutation focus only to visible rows", () => {
  assert.match(source, /function visibleRows\(controller\)/);
  assert.match(source, /!row\.hidden && !row\.classList\.contains\("empty"\)/);
  assert.match(source, /function rememberFilteredMutationFocus\(controller, event\)/);
  assert.match(source, /if \(!normalizedQuery\(controller\.input\.value\)\) return/);
  assert.match(source, /button\.remove, button\.secondary-action/);
  assert.match(source, /action\.textContent\?\.trim\(\) !== "Remove allow override"/);
  assert.match(source, /function restoreFilteredMutationFocus\(controller\)/);
  assert.match(source, /if \(!rows\.length\) \{\s*controller\.input\.focus\(\)/s);
  assert.match(source, /controller\.observer\.observe\(list, \{[\s\S]*attributeFilter: \["disabled"\]/);
  assert.match(source, /controller\.list\.removeEventListener\("click", controller\.onListClick, true\)/);
  assert.doesNotMatch(source, /saveState|storage\.|localStorage|sessionStorage|fetch\(|XMLHttpRequest|telemetry|analytics/i);
});
