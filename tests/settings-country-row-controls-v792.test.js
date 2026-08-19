import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/policy-row-semantics.js", import.meta.url), "utf8");

test("country row controls declare the list they mutate", () => {
  assert.match(source, /mode\.setAttribute\("aria-controls", "country-list"\)/);
  assert.match(source, /remove\.setAttribute\("aria-controls", "country-list"\)/);
  assert.match(source, /controls\.setAttribute\("aria-labelledby", labelId\)/);
  assert.match(source, /controls\.setAttribute\("aria-describedby", `\$\{noteId\} country-status`\)/);
});
