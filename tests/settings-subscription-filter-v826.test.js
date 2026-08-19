import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("configured filter-list search matches visible source identity, not action text", () => {
  assert.match(source, /row\.classList\?\.contains\("subscription-item"\)/);
  assert.match(source, /!child\.classList\?\.contains\("subscription-controls"\)/);
  assert.match(source, /return \(rowIdentityNode\(row\)\?\.textContent \?\? ""\)\.toLowerCase\(\)/);
  assert.match(source, /\{ listId: "subscription-list", label: "Filter configured filter lists" \}/);
  assert.doesNotMatch(source, /fetch\(|storage\.|history\./);
});
