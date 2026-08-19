import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

const expectedLists = [
  "block-list",
  "allow-list",
  "disabled-sites",
  "cookie-exception-list",
  "subscription-list",
  "country-list",
  "cosmetic-hide-list",
  "cosmetic-allow-list"
];

for (const listId of expectedLists) assert.match(source, new RegExp(`listId: \\"${listId}\\"`));
assert.match(source, /Filters only this Settings page and is not saved\./);
assert.match(source, /const FILTER_QUERY_LIMIT = 256;/);
for (const forbidden of ["storage.local", "storage.sync", "sendMessage(", "fetch(", "localStorage", "sessionStorage", "history.pushState", "history.replaceState"]) {
  assert.equal(source.includes(forbidden), false, `transient filter must not use ${forbidden}`);
}

test("canonical Settings filters remain local and cover every dynamic policy list", () => {
  assert.equal(expectedLists.length, 8);
});
