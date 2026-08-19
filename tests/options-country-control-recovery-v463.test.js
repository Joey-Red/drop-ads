import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/country.js", import.meta.url), "utf8");

test("M463 country removal restores a still-connected stale row and control", () => {
  assert.match(source, /async function removeCountryBlock\(item, button, rowIndex\) \{\s*const row = button\.closest\("li"\);/s);
  assert.match(source, /button\.disabled = true;\s*row\?\.setAttribute\("aria-busy", "true"\);/s);
  assert.match(source, /finally \{\s*if \(row\?\.isConnected\) row\.removeAttribute\("aria-busy"\);\s*if \(button\.isConnected\) button\.disabled = false;\s*\}/s);
});

test("M463 country mode changes restore a still-connected stale row and select", () => {
  assert.match(source, /async function changeCountryMode\(item, select\) \{\s*const row = select\.closest\("li"\);/s);
  assert.match(source, /select\.disabled = true;\s*row\?\.setAttribute\("aria-busy", "true"\);/s);
  assert.match(source, /finally \{\s*if \(row\?\.isConnected\) row\.removeAttribute\("aria-busy"\);\s*if \(select\.isConnected\) select\.disabled = false;\s*\}/s);
});
