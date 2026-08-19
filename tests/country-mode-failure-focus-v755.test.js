import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/country.js", import.meta.url), "utf8");

test("failed country mode changes restore focus after committed-state rerender", () => {
  assert.match(source, /function restoreCountryModeFocus\(tld\)/);
  assert.match(source, /catch \(error\) \{[\s\S]*const rendered = await renderSafely\("Could not refresh country settings", true\);[\s\S]*if \(rendered\) restoreCountryModeFocus\(item\.tld\);/);
  assert.match(source, /select\.setAttribute\("aria-describedby", "country-status"\)/);
});
