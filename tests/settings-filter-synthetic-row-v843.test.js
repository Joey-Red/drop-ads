import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const filter = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");
const placeholder = fs.readFileSync(new URL("../src/options/list-filter-no-match.js", import.meta.url), "utf8");

test("M843 no-match rows remain presentation-only", () => {
  assert.match(filter, /function isSyntheticPresentationRow\(row\)/);
  assert.match(filter, /if \(isSyntheticPresentationRow\(row\)\) continue;/);
  assert.match(filter, /!isSyntheticPresentationRow\(row\)/);
  assert.match(placeholder, /function syntheticPresentationRow\(row, placeholder\)/);
  assert.match(placeholder, /classList\?\.contains\("list-filter-no-match"\)/);
  assert.match(placeholder, /!syntheticPresentationRow\(row, placeholder\)/);
});
