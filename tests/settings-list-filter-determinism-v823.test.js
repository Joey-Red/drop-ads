import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("M823 local list-filter matching is bounded and locale-independent", () => {
  assert.match(source, /const FILTER_QUERY_LIMIT = 256/);
  assert.match(source, /text\.slice\(0, FILTER_QUERY_LIMIT\)\.trim\(\)\.toLowerCase\(\)/);
  assert.match(source, /textContent \?\? ""\)\.toLowerCase\(\)/);
  assert.doesNotMatch(source, /toLocaleLowerCase|toLocaleUpperCase/);
  assert.match(source, /rowIdentityNode\(row\)/);
});
