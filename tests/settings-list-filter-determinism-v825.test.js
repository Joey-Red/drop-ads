import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("M825 list-filter matching avoids locale-sensitive transforms", () => {
  assert.match(source, /function normalizedQuery\(value\)[\s\S]*\.trim\(\)\.toLowerCase\(\)/);
  assert.match(source, /function rowSearchText\(row\)[\s\S]*\.toLowerCase\(\)/);
  assert.doesNotMatch(source, /toLocaleLowerCase|localeCompare|Intl\./);
  assert.match(source, /rowSearchText\(row\)\.includes\(query\)/);
});
