import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("Settings list filtering is bounded, local, and presentation-only", () => {
  assert.match(source, /const FILTER_QUERY_LIMIT = 256;/);
  for (const id of ["block-list", "allow-list", "disabled-sites", "cookie-exception-list", "subscription-list", "country-list", "cosmetic-hide-list", "cosmetic-allow-list"]) {
    assert.match(source, new RegExp(`listId: "${id}"`));
  }
  assert.match(source, /row\.hidden = !matches;/);
  assert.doesNotMatch(source, /saveState|sendMessage|fetch\(|localStorage|sessionStorage|indexedDB/);
  assert.match(source, /window\.addEventListener\("pagehide"/);
});
