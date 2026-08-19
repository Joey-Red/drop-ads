import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("M826 true empty-list state remains visible under a transient query", () => {
  assert.match(source, /if \(row\.classList\.contains\("empty"\)\) \{\s*row\.hidden = false;\s*continue;\s*\}/s);
  assert.match(source, /if \(!hasEntries\) return "No entries"/);
  assert.doesNotMatch(source, /row\.hidden = Boolean\(query\)/);
  assert.doesNotMatch(source, /createElement\([^)]*empty|appendChild\([^)]*empty/i);
});
