import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/cache-codec.js", import.meta.url), "utf8");

test("M443 normalizeListCache uses null-prototype records for fallback and success", () => {
  assert.match(source, /export function normalizeListCache\(cache\) \{/);
  assert.match(source, /catch \{ return Object\.create\(null\); \}/);
  assert.match(source, /const normalized = Object\.create\(null\);/);
});

test("M443 normalized cache keys come only from snapshotted own entries", () => {
  assert.match(source, /snapshotRawListCache\(cache\)/);
  assert.match(source, /for \(const \[id, entry\] of Object\.entries\(snapshot\)\)/);
});
