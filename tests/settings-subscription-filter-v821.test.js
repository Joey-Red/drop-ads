import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("M821 configured filter-list search uses visible identity only", () => {
  assert.match(source, /\{ listId: "subscription-list", label: "Filter configured filter lists" \}/);
  assert.match(source, /function rowIdentityNode\(row\)/);
  assert.match(source, /row\.classList\?\.contains\("subscription-item"\)/);
  assert.match(source, /!child\.classList\?\.contains\("subscription-controls"\)/);
  assert.match(source, /return \(rowIdentityNode\(row\)\?\.textContent \?\? ""\)\.toLowerCase\(\)/);
  assert.match(source, /rowSearchText\(row\)\.includes\(query\)/);
  assert.match(source, /input\.setAttribute\("aria-controls", spec\.listId\)/);
  assert.doesNotMatch(source, /saveState|storage\.|localStorage|sessionStorage|fetch\(|XMLHttpRequest/);
});
