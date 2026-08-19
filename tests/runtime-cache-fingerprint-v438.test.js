import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M438 cache fingerprints use bounded descriptor-only JSON data", () => {
  assert.match(source, /CACHE_FINGERPRINT_SNAPSHOT_LIMITS = Object\.freeze\(\{ depth: 32, objectFields: 512, arrayEntries: 300_000, values: 1_000_000 \}\)/);
  assert.match(source, /boundedJsonData\(cache, CACHE_FINGERPRINT_SNAPSHOT_LIMITS, "List cache fingerprint"\)/);
  assert.match(source, /for \(const key of keys\.sort\(\)\)/);
  assert.doesNotMatch(source, /function canonicalValue\(/);
});

test("M438 bounded JSON snapshot rejects unsafe recursive shapes", () => {
  assert.match(source, /contains a cycle/);
  assert.match(source, /must contain plain objects/);
  assert.match(source, /must be dense and contain no extra properties/);
  assert.match(source, /contains a non-finite number/);
  assert.match(source, /contains symbol fields/);
});
