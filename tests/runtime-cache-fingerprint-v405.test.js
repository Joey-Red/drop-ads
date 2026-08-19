import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M405 cache fingerprinting uses bounded descriptor-only JSON snapshots", () => {
  assert.match(source, /CACHE_FINGERPRINT_SNAPSHOT_LIMITS = Object\.freeze\(\{ depth: 32, objectFields: 512, arrayEntries: 300_000, values: 1_000_000 \}\)/);
  assert.match(source, /boundedJsonData\(cache, CACHE_FINGERPRINT_SNAPSHOT_LIMITS, "List cache fingerprint"\)/);
  assert.match(source, /List cache fingerprint input is invalid/);
  assert.doesNotMatch(source, /function canonicalValue\(/);
  assert.doesNotMatch(source, /Object\.keys\(value\)\.sort\(\)\.map/);
});

test("M405 reviewed bounded JSON helper rejects hostile recursive shapes", () => {
  assert.match(source, /contains a cycle/);
  assert.match(source, /must contain enumerable own data entries/);
  assert.match(source, /must contain plain objects/);
  assert.match(source, /contains symbol fields/);
  assert.match(source, /contains a non-finite number/);
  assert.match(source, /exceeds the nesting-depth limit/);
  assert.match(source, /exceeds the visited-value limit/);
});
