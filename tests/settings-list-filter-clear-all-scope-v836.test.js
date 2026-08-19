import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/list-filter-ergonomics.js", import.meta.url), "utf8");

test("clear-all filter action exposes its controlled Settings lists", () => {
  assert.match(source, /const controlledListIds = filterInputs/);
  assert.match(source, /clearAll\.setAttribute\("aria-controls", controlledListIds\.join\(" "\)\)/);
  assert.match(source, /toolbar\.setAttribute\("role", "group"\)/);
  assert.match(source, /toolbar\.setAttribute\("aria-label", "List filter actions"\)/);
});
