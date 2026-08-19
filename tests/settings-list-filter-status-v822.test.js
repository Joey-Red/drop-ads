import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("list-filter status is generic and privacy help stays associated", () => {
  assert.match(source, /return "No entries"/);
  assert.match(source, /return hasMatches \? "Filter active" : "No matching entries"/);
  assert.match(source, /status\.setAttribute\("role", "status"\)/);
  assert.match(source, /status\.setAttribute\("aria-live", "polite"\)/);
  assert.match(source, /status\.setAttribute\("aria-atomic", "true"\)/);
  assert.match(source, /input\.setAttribute\("aria-describedby", `\$\{status\.id\} \$\{privacy\.id\}`\)/);
  assert.match(source, /clear\.setAttribute\("aria-describedby", `\$\{status\.id\} \$\{privacy\.id\}`\)/);
  assert.doesNotMatch(source, /status\.textContent\s*=\s*.*query/);
});
