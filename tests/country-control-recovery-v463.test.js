import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/country.js", import.meta.url), "utf8");

test("country remove mutation releases the original connected row and button in finally", () => {
  assert.match(source, /const row = button\.closest\("li"\);/);
  assert.match(source, /button\.disabled = true;/);
  assert.match(source, /row\?\.setAttribute\("aria-busy", "true"\);/);
  assert.match(source, /finally \{\s*if \(row\?\.isConnected\) row\.removeAttribute\("aria-busy"\);\s*if \(button\.isConnected\) button\.disabled = false;\s*\}/s);
});

test("country mode mutation releases the original connected row and select in finally", () => {
  assert.match(source, /const row = select\.closest\("li"\);/);
  assert.match(source, /select\.disabled = true;/);
  assert.match(source, /finally \{\s*if \(row\?\.isConnected\) row\.removeAttribute\("aria-busy"\);\s*if \(select\.isConnected\) select\.disabled = false;\s*\}/s);
});

test("successful rerender may replace controls before the finally recovery path", () => {
  assert.match(source, /const rendered = await renderSafely\("Country blocking was removed, but Settings could not refresh"\);/);
  assert.match(source, /await renderSafely\("Country mode changed, but Settings could not refresh"\);/);
  assert.match(source, /if \(button\.isConnected\)/);
  assert.match(source, /if \(select\.isConnected\)/);
});
