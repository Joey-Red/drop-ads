import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/cosmetics.js", import.meta.url), "utf8");

test("cosmetic remove controls include canonical scope in their accessible names", () => {
  assert.match(source, /const scope = scopeLabel\(rule\);/);
  assert.match(source, /remove\.setAttribute\("aria-label", `Remove cosmetic rule \$\{rule\.selector\} on \$\{scope\}`\)/);
  assert.match(source, /note\.textContent = scope;/);
});
