import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const filter = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");
const semantics = fs.readFileSync(new URL("../src/options/ui-semantics.js", import.meta.url), "utf8");

test("M822 recovery lists use presentation-only local filtering", () => {
  assert.match(filter, /\{ listId: "disabled-sites", label: "Filter disabled sites" \}/);
  assert.match(filter, /\{ listId: "cookie-exception-list", label: "Filter cookie exceptions" \}/);
  assert.match(filter, /row\.hidden = !matches/);
  assert.match(filter, /new globalThis\.MutationObserver\(\(mutations\) => handleListMutations\(controller, mutations\)\)/);
  assert.match(filter, /controller\.observer\.observe\(list, \{[\s\S]*childList: true,[\s\S]*subtree: true/);
  assert.doesNotMatch(filter, /storage\.|sendMessage|fetch\(|localStorage|sessionStorage/);
  assert.match(semantics, /action\.textContent = "Re-enable"/);
  assert.match(semantics, /action\.textContent = "Remove exception"/);
});
