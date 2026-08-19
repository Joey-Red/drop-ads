import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/options/policy-row-semantics.js", import.meta.url), "utf8");

test("cosmetic rows expose selector, scope, and feedback semantics", () => {
  assert.match(source, /function enhanceCosmeticRows\(list, prefix, errorId\)/);
  assert.match(source, /row\.setAttribute\("aria-labelledby", selectorId\)/);
  assert.match(source, /row\.setAttribute\("aria-describedby", scopeId\)/);
  assert.match(source, /remove\.setAttribute\("aria-describedby", `\$\{scopeId\} \$\{errorId\}`\)/);
  assert.match(source, /cosmeticHideObserver\?\.disconnect\(\)/);
  assert.match(source, /cosmeticAllowObserver\?\.disconnect\(\)/);
});
