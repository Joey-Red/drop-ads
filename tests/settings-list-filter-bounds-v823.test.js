import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("M823 list-filter queries are bounded and locale-stable", () => {
  assert.match(source, /const FILTER_QUERY_LIMIT = 256;/);
  assert.match(source, /const text = typeof value === "string" \? value : "";/);
  assert.match(source, /text\.slice\(0, FILTER_QUERY_LIMIT\)\.trim\(\)\.toLowerCase\(\)/);
  assert.match(source, /input\.maxLength = FILTER_QUERY_LIMIT;/);
  assert.match(source, /controller\.input\.value = controller\.input\.value\.slice\(0, FILTER_QUERY_LIMIT\)/);
  assert.doesNotMatch(source, /toLocaleLowerCase|localStorage|sessionStorage|fetch\(|XMLHttpRequest/);
});
