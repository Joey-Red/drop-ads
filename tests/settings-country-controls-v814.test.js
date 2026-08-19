import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/mutation-target-semantics.js", import.meta.url), "utf8");

test("Country mode and removal controls identify country-list as their mutation target", () => {
  assert.match(source, /country: document\.querySelector\("#country-list"\)/);
  assert.match(source, /applySimpleListTarget\(lists\.country, "country-list", "select, button\.remove"\)/);
  assert.match(source, /action\.setAttribute\("aria-controls", listId\)/);
});
