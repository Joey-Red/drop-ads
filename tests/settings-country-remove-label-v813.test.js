import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/country.js", import.meta.url), "utf8");

test("Country TLD removal wording is explicit without changing canonical identity", () => {
  assert.match(source, /remove\.textContent = "Remove TLD block"/);
  assert.match(source, /remove\.setAttribute\("aria-label", `Remove \.\$\{item\.tld\} country block`\)/);
  assert.match(source, /removeCountryBlock\(item, remove, rowIndex\)/);
});
