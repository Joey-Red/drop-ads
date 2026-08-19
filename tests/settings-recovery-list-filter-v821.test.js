import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const filter = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");
const semantics = fs.readFileSync(new URL("../src/options/ui-semantics.js", import.meta.url), "utf8");

test("recovery lists are filterable without replacing recovery semantics", () => {
  assert.match(filter, /\{ listId: "disabled-sites", label: "Filter disabled sites" \}/);
  assert.match(filter, /\{ listId: "cookie-exception-list", label: "Filter cookie exceptions" \}/);
  assert.match(filter, /row\.hidden = !matches/);
  assert.match(semantics, /action\.textContent = "Re-enable"/);
  assert.match(semantics, /action\.textContent = "Remove exception"/);
  assert.match(semantics, /disabledSitesHeading\.focus\(\{ preventScroll: true \}\)/);
});
