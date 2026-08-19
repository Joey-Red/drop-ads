import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/options/ui-semantics.js", import.meta.url), "utf8");

test("Settings actions expose the policy list they control", () => {
  for (const id of ["block-list", "allow-list", "country-list", "cosmetic-hide-list", "cosmetic-allow-list", "subscription-list", "cookie-exception-list"]) {
    assert.match(source, new RegExp(`"${id}"`));
  }
  assert.match(source, /setAttribute\("aria-controls", listId\)/);
});
