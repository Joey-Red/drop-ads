import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("cache fingerprint uses the bounded descriptor-only JSON snapshot", () => {
  assert.match(source, /CACHE_FINGERPRINT_SNAPSHOT_LIMITS = Object\.freeze\(\{ depth: 32, objectFields: 512, arrayEntries: 300_000, values: 1_000_000 \}\)/);
  assert.match(source, /return JSON\.stringify\(boundedJsonData\(cache, CACHE_FINGERPRINT_SNAPSHOT_LIMITS, "List cache fingerprint"\)\);/);
  assert.doesNotMatch(source, /function canonicalValue\(/);
});

test("bounded cache fingerprint inherits cycle, descriptor, dense-array, and finite-number rejection", () => {
  assert.match(source, /contains a cycle/);
  assert.match(source, /fields must be enumerable own data fields/);
  assert.match(source, /must be dense and contain no extra properties/);
  assert.match(source, /contains a non-finite number/);
  assert.match(source, /keys\.sort\(\)/);
});
