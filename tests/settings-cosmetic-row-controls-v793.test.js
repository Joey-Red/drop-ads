import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/policy-row-semantics.js", import.meta.url), "utf8");

test("cosmetic removal actions declare their mutated list", () => {
  assert.match(source, /remove\.setAttribute\("aria-controls", list\.id\)/);
  assert.match(source, /remove\.setAttribute\("aria-describedby", `\$\{scopeId\} \$\{errorId\}`\)/);
  assert.match(source, /remove\.textContent = "Remove cosmetic rule"/);
});
