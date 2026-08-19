import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("M821 configured filter-list search is visible-identity and presentation only", () => {
  assert.match(source, /\{ listId: "subscription-list", label: "Filter configured filter lists" \}/);
  assert.match(source, /row\.classList\?\.contains\("subscription-item"\)/);
  assert.match(source, /!child\.classList\?\.contains\("subscription-controls"\)/);
  assert.match(source, /return \(rowIdentityNode\(row\)\?\.textContent \?\? ""\)\.toLowerCase\(\)/);
  assert.match(source, /new globalThis\.MutationObserver\(\(mutations\) => handleListMutations\(controller, mutations\)\)/);
  assert.match(source, /childList: true,[\s\S]*subtree: true,[\s\S]*characterData: true/);
  assert.match(source, /row\.hidden = !matches/);
  assert.doesNotMatch(source, /toLocaleLowerCase|set-subscription|remove-subscription|saveState/);
});
