import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/cache-codec.js", import.meta.url), "utf8");

test("M429 cache plain-record admission contains array-kind revocation", () => {
  assert.match(source, /function plainDataSnapshot\(value\) \{\s*let isArray;/s);
  assert.match(source, /try \{\s*isArray = Array\.isArray\(value\);[\s\S]*?\} catch \{\s*return null;\s*\}/);
});

test("M429 cache plain records remain ordinary own enumerable data only", () => {
  assert.match(source, /prototype !== Object\.prototype && prototype !== null/);
  assert.match(source, /ownKeys\.some\(\(key\) => typeof key === "symbol"\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(value, key\)/);
  assert.match(source, /!descriptor\?\.enumerable \|\| !\("value" in descriptor\)/);
});

test("M429 nested cache packs retain shared dense-array admission", () => {
  assert.match(source, /snapshotDenseDataArray\(value, label, maxLength\)/);
  assert.match(source, /MAX_RAW_CACHE_POLICY_ITEMS/);
});
