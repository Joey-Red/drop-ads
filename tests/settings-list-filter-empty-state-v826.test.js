import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("true empty-list sentinel remains visible under a transient query", () => {
  assert.match(source, /if \(row\.classList\.contains\("empty"\)\) \{\s*row\.hidden = false;\s*continue;/s);
  assert.match(source, /if \(!hasEntries\) return "No entries";/);
  assert.doesNotMatch(source, /row\.hidden = Boolean\(query\)/);
});
