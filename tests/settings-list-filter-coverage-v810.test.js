import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("local Settings filters cover country and cosmetic policy lists", () => {
  assert.match(source, /listId: "country-list"/);
  assert.match(source, /listId: "cosmetic-hide-list"/);
  assert.match(source, /listId: "cosmetic-allow-list"/);
  assert.match(source, /const FILTER_QUERY_LIMIT = 256/);
  assert.doesNotMatch(source, /storage|fetch\(|sendMessage|telemetry|analytics/i);
});
