import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/country.js", import.meta.url), "utf8");

test("M463 remove-country mutation owns row busy state and always restores live controls", () => {
  assert.match(source, /const row = button\.closest\("li"\);/);
  assert.match(source, /button\.disabled = true;\s*row\?\.setAttribute\("aria-busy", "true"\);/s);
  assert.match(source, /finally \{\s*if \(row\?\.isConnected\) row\.removeAttribute\("aria-busy"\);\s*if \(button\.isConnected\) button\.disabled = false;\s*\}/s);
});

test("M463 country-mode mutation always restores a still-connected original select", () => {
  assert.match(source, /const row = select\.closest\("li"\);/);
  assert.match(source, /select\.disabled = true;\s*row\?\.setAttribute\("aria-busy", "true"\);/s);
  assert.match(source, /finally \{\s*if \(row\?\.isConnected\) row\.removeAttribute\("aria-busy"\);\s*if \(select\.isConnected\) select\.disabled = false;\s*\}/s);
});

test("M463 successful replacement keeps focus recovery scoped to the newly rendered list", () => {
  assert.match(source, /const rendered = await renderSafely\("Country blocking was removed, but Settings could not refresh"\);/);
  assert.match(source, /if \(rendered\) \{\s*const nextButtons = \[\.\.\.list\.querySelectorAll\("button\.remove"\)\];/s);
  assert.match(source, /if \(button\.isConnected\) button\.disabled = false;/);
  assert.match(source, /if \(select\.isConnected\) select\.disabled = false;/);
});
