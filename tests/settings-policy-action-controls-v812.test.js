import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/mutation-target-semantics.js", import.meta.url), "utf8");

test("M812 country and cosmetic actions expose their changed lists", () => {
  assert.match(source, /applySimpleListTarget\(lists\.country, "country-list", "select, button\.remove"\)/);
  assert.match(source, /applySimpleListTarget\(lists\.cosmeticHide, "cosmetic-hide-list"\)/);
  assert.match(source, /applySimpleListTarget\(lists\.cosmeticAllow, "cosmetic-allow-list"\)/);
});
