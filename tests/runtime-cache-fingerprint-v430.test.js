import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M430 cache fingerprint uses bounded descriptor-only JSON data", () => {
  assert.match(source, /CACHE_FINGERPRINT_SNAPSHOT_LIMITS = Object\.freeze\(\{ depth: 32, objectFields: 512, arrayEntries: 300_000, values: 1_000_000 \}\)/);
  assert.match(source, /boundedJsonData\(cache, CACHE_FINGERPRINT_SNAPSHOT_LIMITS, "List cache fingerprint"\)/);
  assert.doesNotMatch(source, /function canonicalValue\(/);
});

test("M430 bounded JSON canonicalization rejects hostile recursive shapes", () => {
  assert.match(source, /prototype !== Object\.prototype && prototype !== null/);
  assert.match(source, /contains a cycle/);
  assert.match(source, /non-finite number/);
  assert.match(source, /fields must be enumerable own data fields/);
  assert.match(source, /keys\.sort\(\)/);
});
