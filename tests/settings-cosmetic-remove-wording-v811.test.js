import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/cosmetics.js", import.meta.url), "utf8");

test("cosmetic rows use explicit removal wording without losing selector and scope", () => {
  assert.match(source, /remove\.textContent = "Remove cosmetic rule"/);
  assert.match(source, /Remove cosmetic rule \$\{rule\.selector\} on \$\{scope\}/);
  assert.match(source, /focusAfterRemoval\(container, index, fallback\)/);
});
