import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("local list filtering uses deterministic locale-independent case folding", () => {
  assert.match(source, /\.toLowerCase\(\)/);
  assert.doesNotMatch(source, /toLocaleLowerCase|localeCompare|Intl\./);
  assert.match(source, /const FILTER_QUERY_LIMIT = 256/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|storage\.|fetch\(|sendMessage/i);
});
