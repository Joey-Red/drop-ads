import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/cache-codec.js", import.meta.url), "utf8");

test("M430 legacy cache array-kind inspection is trap-contained", () => {
  assert.match(source, /function inspectArrayKind\(value\) \{\s*try \{ return Array\.isArray\(value\); \}\s*catch \{ return null; \}\s*\}/s);
  assert.match(source, /const isArray = inspectArrayKind\(snapshot\[key\]\);\s*if \(isArray == null\) return null;/s);
  assert.match(source, /if \(!isArray\) \{\s*snapshot\[key\] = null;\s*continue;\s*\}/s);
  assert.match(source, /const blockKind = inspectArrayKind\(snapshot\.block\);/);
  assert.match(source, /if \(blockKind == null \|\| allowKind == null\) return null;/);
});

test("M430 raw cache work counting uses detached array length descriptors", () => {
  assert.match(source, /function detachedArrayLength\(value, label\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(value, "length"\)/);
  assert.match(source, /detachedArrayLength\(entry\.block, "Legacy cache block"\)/);
  assert.match(source, /detachedArrayLength\(entry\.cosmeticAllow, "Legacy cache cosmetic allow"\)/);
  assert.doesNotMatch(source, /function arrayLength\(value\)/);
});
