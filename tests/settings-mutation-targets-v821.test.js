import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const dynamic = fs.readFileSync(new URL("../src/options/dynamic-list-semantics.js", import.meta.url), "utf8");
const targets = fs.readFileSync(new URL("../src/options/mutation-target-semantics.js", import.meta.url), "utf8");

test("dynamic Settings mutation controls expose their affected lists", () => {
  assert.match(dynamic, /import "\.\/mutation-target-semantics\.js";/);
  assert.match(targets, /remove\.setAttribute\("aria-controls", listId\)/);
  assert.match(targets, /action\.setAttribute\("aria-controls", "block-list allow-list"\)/);
  assert.match(targets, /checkbox\.setAttribute\("aria-controls", "subscription-list"\)/);
  assert.match(targets, /applySimpleListTarget\(lists\.country, "country-list", "select, button\.remove"\)/);
  assert.match(targets, /applySimpleListTarget\(lists\.cosmeticHide, "cosmetic-hide-list"\)/);
  assert.match(targets, /applySimpleListTarget\(lists\.cosmeticAllow, "cosmetic-allow-list"\)/);
  assert.match(targets, /window\.addEventListener\("pagehide"/);
});
