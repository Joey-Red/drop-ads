import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("runtime cache fingerprints retain reviewed structural work ceilings", () => {
  assert.match(source, /CACHE_FINGERPRINT_SNAPSHOT_LIMITS = Object\.freeze\(\{ depth: 32, objectFields: 512, arrayEntries: 300_000, values: 1_000_000 \}\)/);
  assert.match(source, /JSON\.stringify\(boundedJsonData\(cache, CACHE_FINGERPRINT_SNAPSHOT_LIMITS, "List cache fingerprint"\)\)/);
});

test("bounded cache canonicalization remains descriptor-only and fail-closed", () => {
  assert.match(source, /Reflect\.ownKeys\(value\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(value, key\)/);
  assert.match(source, /contains a cycle/);
  assert.match(source, /contains symbol fields/);
  assert.match(source, /must be dense and contain no extra properties/);
  assert.match(source, /contains a non-finite number/);
  assert.match(source, /for \(const key of keys\.sort\(\)\)/);
  assert.doesNotMatch(source, /function canonicalValue\(/);
});

test("cache fingerprint contains revoked array-kind inspection", () => {
  assert.match(source, /function cacheFingerprint\(cache\) \{\s*let isArray;\s*try \{ isArray = Array\.isArray\(cache\); \}\s*catch \{ throw new TypeError\("List cache fingerprint input is invalid"\); \}/s);
});
