import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/options/ui-semantics.js", import.meta.url), "utf8");

test("filter-list and cookie controls inherit operational guidance", () => {
  assert.match(source, /"filter-lists-help"/);
  assert.match(source, /"cookie-help"/);
  assert.match(source, /#subscription-url/);
  assert.match(source, /#cookie-mode/);
});
