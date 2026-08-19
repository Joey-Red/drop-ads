import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/country.js", import.meta.url), "utf8");

test("M463 country row mutations expose and release busy state", () => {
  assert.match(source, /const row = button\.closest\("li"\);[\s\S]*button\.disabled = true;[\s\S]*row\?\.setAttribute\("aria-busy", "true"\);/s);
  assert.match(source, /finally \{\s*if \(row\?\.isConnected\) row\.removeAttribute\("aria-busy"\);\s*if \(button\.isConnected\) button\.disabled = false;\s*\}/s);
  assert.match(source, /const row = select\.closest\("li"\);[\s\S]*select\.disabled = true;[\s\S]*row\?\.setAttribute\("aria-busy", "true"\);/s);
  assert.match(source, /finally \{\s*if \(row\?\.isConnected\) row\.removeAttribute\("aria-busy"\);\s*if \(select\.isConnected\) select\.disabled = false;\s*\}/s);
});

test("M463 successful rerenders leave detached old row controls untouched", () => {
  assert.match(source, /if \(rendered\) \{[\s\S]*nextButtons[\s\S]*\.focus\(\);\s*\}/s);
  assert.match(source, /if \(button\.isConnected\) button\.disabled = false;/);
  assert.match(source, /if \(select\.isConnected\) select\.disabled = false;/);
});
