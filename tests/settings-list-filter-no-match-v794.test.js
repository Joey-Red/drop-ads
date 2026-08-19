import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("local Settings filters expose a deterministic no-match presentation row", () => {
  assert.match(source, /function updateNoMatchRow\(controller, query, hasEntries, hasMatches\)/);
  assert.match(source, /row\.className = "list-filter-no-match"/);
  assert.match(source, /row\.setAttribute\("aria-hidden", "true"\)/);
  assert.match(source, /row\.textContent = "No matching entries"/);
});
