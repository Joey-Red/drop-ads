import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M400 cache fingerprint uses bounded descriptor-only JSON canonicalization", () => {
  assert.match(source, /CACHE_FINGERPRINT_SNAPSHOT_LIMITS = Object\.freeze\(\{ depth: 32, objectFields: 512, arrayEntries: 300_000, values: 1_000_000 \}\)/);
  assert.match(source, /function cacheFingerprint\(cache\) \{[\s\S]*Array\.isArray\(cache\)[\s\S]*boundedJsonData\(cache, CACHE_FINGERPRINT_SNAPSHOT_LIMITS, "List cache fingerprint"\)/);
  assert.doesNotMatch(source, /function canonicalValue\(/);
});

test("M400 bounded JSON snapshot rejects hostile recursive/cache shapes without normal property reads", () => {
  assert.match(source, /snapshotDenseDataArray\(value, label, limits\.arrayEntries\)/);
  assert.match(source, /state\.active\.has\(value\).*contains a cycle/s);
  assert.match(source, /prototype !== Object\.prototype && prototype !== null/);
  assert.match(source, /fields must be enumerable own data fields/);
  assert.match(source, /contains a non-finite number/);
  assert.match(source, /exceeds the visited-value limit/);
});
