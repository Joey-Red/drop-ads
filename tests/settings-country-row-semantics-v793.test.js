import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/options/policy-row-semantics.js", import.meta.url), "utf8");

test("country policy rows group controls under visible policy identity", () => {
  assert.match(source, /function enhanceCountryRows\(\)/);
  assert.match(source, /const labelId = `country-row-label-\$\{rowIndex\}`/);
  assert.match(source, /const noteId = `country-row-note-\$\{rowIndex\}`/);
  assert.match(source, /controls\.setAttribute\("role", "group"\)/);
  assert.match(source, /controls\.setAttribute\("aria-labelledby", labelId\)/);
  assert.match(source, /controls\.setAttribute\("aria-describedby", `\$\{noteId\} country-status`\)/);
  assert.match(source, /countryObserver\.observe\(countryList, \{ childList: true, subtree: true \}\)/);
  assert.match(source, /countryObserver\?\.disconnect\(\)/);
});
