import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/options/ui-semantics.js", import.meta.url), "utf8");

test("country and cosmetic controls inherit policy guidance", () => {
  assert.match(source, /"country-help"/);
  assert.match(source, /"cosmetic-help"/);
  assert.match(source, /#country-custom-tld/);
  assert.match(source, /#cosmetic-allow-selector/);
});
