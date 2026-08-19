import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/cache-codec.js", import.meta.url), "utf8");

test("M429 cache plain-record admission contains array-kind inspection", () => {
  const helper = source.match(/function plainDataSnapshot\(value\) \{([\s\S]*?)\n\}/)?.[1] ?? "";
  assert.match(helper, /try \{\s*isArray = Array\.isArray\(value\);/s);
  assert.match(helper, /catch \{\s*return null;\s*\}/s);
  assert.match(helper, /prototype !== Object\.prototype && prototype !== null/);
  assert.match(helper, /ownKeys\.some\(\(key\) => typeof key === "symbol"\)/);
  assert.match(helper, /Object\.getOwnPropertyDescriptor\(value, key\)/);
});

test("M429 cache record boundary keeps nested packs on dense-array validation", () => {
  assert.match(source, /snapshotDenseDataArray\(value, label, maxLength\)/);
  assert.match(source, /denseArrayOrNull\(snapshot\[code\], `Cache rule pack\.\$\{code\}`, MAX_RAW_CACHE_POLICY_ITEMS\)/);
});
