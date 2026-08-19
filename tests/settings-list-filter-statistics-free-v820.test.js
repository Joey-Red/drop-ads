import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("supporting filter feedback regression uses transient states instead of counts", () => {
  assert.match(source, /function filterStatus\(query, hasEntries, hasMatches\)/);
  assert.match(source, /if \(!hasEntries\) return "No entries";/);
  assert.match(source, /return hasMatches \? "Filter active" : "No matching entries";/);
  assert.doesNotMatch(source, /\$\{shown\}|\$\{total\}|shown\s+of\s+total/i);
  assert.doesNotMatch(source, /controller\.status\.textContent\s*=\s*.*(?:count|total|shown)/i);
});
