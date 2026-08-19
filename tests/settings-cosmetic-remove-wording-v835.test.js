import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/policy-row-semantics.js", import.meta.url), "utf8");

test("cosmetic rows expose explicit visible removal wording with selector/scope identity", () => {
  assert.match(source, /remove\.textContent = "Remove cosmetic rule"/);
  assert.match(source, /`Remove cosmetic rule \$\{selectorText\} on \$\{scopeText\}`/);
  assert.match(source, /remove\.setAttribute\("aria-describedby", `\$\{scopeId\} \$\{errorId\}`\)/);
});
