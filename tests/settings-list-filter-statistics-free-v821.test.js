import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("M821 list-filter feedback is transient, generic, and statistics-free", () => {
  assert.match(source, /function filterStatus\(query, hasEntries, hasMatches\)/);
  assert.match(source, /if \(!hasEntries\) return "No entries"/);
  assert.match(source, /if \(!query\) return ""/);
  assert.match(source, /return hasMatches \? "Filter active" : "No matching entries"/);
  assert.match(source, /let hasEntries = false/);
  assert.match(source, /let hasMatches = false/);
  assert.doesNotMatch(source, /let total|let shown|shown of|of \$\{total\}|telemetry|analytics|localStorage|sessionStorage|browser\.storage|chrome\.storage/i);
});
