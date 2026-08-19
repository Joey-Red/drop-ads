import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("M821 list-filter feedback is generic and statistics-free", () => {
  assert.match(source, /return hasMatches \? "Filter active" : "No matching entries"/);
  assert.doesNotMatch(source, /shown} of \$\{total|\$\{shown\} of \$\{total\}/);
  assert.doesNotMatch(source, /status\.textContent\s*=.*query/);
});
