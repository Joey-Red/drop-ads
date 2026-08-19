import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/form-state-semantics.js", import.meta.url), "utf8");

test("country submission is gated without overriding busy transactions", () => {
  assert.match(source, /function ownCountrySourceState\(\)/);
  assert.match(source, /const hasSource = \(\) => Boolean\(preset\.value \|\| custom\.value\.trim\(\)\)/);
  assert.match(source, /if \(form\?\.getAttribute\("aria-busy"\) === "true"\) return/);
  assert.match(source, /submit\.disabled = !hasSource\(\)/);
  assert.match(source, /observer\.observe\(form, \{ attributes: true, attributeFilter: \["aria-busy"\] \}\)/);
});
