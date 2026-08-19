import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/mutation-target-semantics.js", import.meta.url), "utf8");
const loader = fs.readFileSync(new URL("../src/options/policy-row-semantics.js", import.meta.url), "utf8");

test("M810 dynamic actions expose only the lists they mutate", () => {
  assert.match(loader, /import "\.\/mutation-target-semantics\.js";/);
  assert.match(source, /remove\.setAttribute\("aria-controls", listId\)/);
  assert.match(source, /action\.setAttribute\("aria-controls", "block-list allow-list"\)/);
  assert.match(source, /checkbox\.setAttribute\("aria-controls", "subscription-list"\)/);
  assert.match(source, /else action\.removeAttribute\("aria-controls"\)/);
});
