import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("active Settings filters are reapplied after list rerenders", () => {
  assert.match(source, /controller\.observer = new globalThis\.MutationObserver\(\(mutations\) => handleListMutations\(controller, mutations\)\)/);
  assert.match(source, /controller\.observer\.observe\(list, \{[\s\S]*childList: true,[\s\S]*subtree: true/);
  assert.match(source, /controller\.pendingPresentationChange = true/);
  assert.match(source, /applyFilter\(controller\);[\s\S]*restoreFilteredMutationFocus\(controller\)/);
  assert.match(source, /const query = normalizedQuery\(controller\.input\.value\)/);
  assert.match(source, /row\.hidden = !matches/);
  assert.match(source, /controller\.observer\?\.disconnect\(\)/);
});
