import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/form-state-semantics.js", import.meta.url), "utf8");

test("country preset and custom TLD entry are mutually exclusive", () => {
  assert.match(source, /function ownCountrySourceState\(\)/);
  assert.match(source, /if \(preset\.value\) custom\.value = ""/);
  assert.match(source, /if \(custom\.value\.trim\(\)\) preset\.value = ""/);
  assert.match(source, /ownListener\(preset, "change", choosePreset\)/);
  assert.match(source, /ownListener\(custom, "input", chooseCustom\)/);
});
