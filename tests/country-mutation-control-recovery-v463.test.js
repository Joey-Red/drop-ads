import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/country.js", import.meta.url), "utf8");

test("M463 country remove and mode mutations retain their originating row", () => {
  assert.match(source, /async function removeCountryBlock\(item, button, rowIndex\) \{\s*const row = button\.closest\("li"\);/s);
  assert.match(source, /async function changeCountryMode\(item, select\) \{\s*const row = select\.closest\("li"\);/s);
  assert.match(source, /row\?\.setAttribute\("aria-busy", "true"\);/);
});

test("M463 stale connected controls recover in finally without touching replacement rows", () => {
  assert.match(source, /finally \{\s*if \(row\?\.isConnected\) row\.removeAttribute\("aria-busy"\);\s*if \(button\.isConnected\) button\.disabled = false;\s*\}/s);
  assert.match(source, /finally \{\s*if \(row\?\.isConnected\) row\.removeAttribute\("aria-busy"\);\s*if \(select\.isConnected\) select\.disabled = false;\s*\}/s);
});
