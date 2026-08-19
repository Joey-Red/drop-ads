import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

const requiredLists = [
  "block-list",
  "allow-list",
  "disabled-sites",
  "cookie-exception-list",
  "subscription-list",
  "country-list",
  "cosmetic-hide-list",
  "cosmetic-allow-list"
];

test("M819 canonical list filters cover dynamic Settings policy without retaining history", () => {
  for (const listId of requiredLists) assert.match(source, new RegExp(`listId: "${listId}"`));
  assert.match(source, /const FILTER_QUERY_LIMIT = 256/);
  assert.match(source, /row\.hidden = !matches/);
  assert.match(source, /childList: true,[\s\S]*subtree: true,[\s\S]*characterData: true/);
  assert.match(source, /attributeFilter: \["disabled"\]/);
  assert.doesNotMatch(source, /attributeFilter: \[[^\]]*"hidden"/);
  assert.match(source, /window\.addEventListener\("pagehide"/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|browser\.storage|chrome\.storage|fetch\(|XMLHttpRequest|telemetry|analytics/i);
});
