import test from "node:test";
import assert from "node:assert/strict";
import {
  ZIP_LIMITS,
  createStoredZipBuffer,
  validateZipEntryName,
  validateZipEntryResourceLimits
} from "../tools/deterministic-zip.mjs";

test("ZIP resource-limit helper rejects oversized synthetic inputs without allocation", () => {
  assert.throws(() => validateZipEntryResourceLimits({
    entryCount: ZIP_LIMITS.maxEntries + 1,
    entryBytes: 0,
    totalBytes: 0
  }), /entry count/);
  assert.throws(() => validateZipEntryResourceLimits({
    entryCount: 1,
    entryBytes: ZIP_LIMITS.maxEntryBytes + 1,
    totalBytes: 0
  }), /entry byte size/);
  assert.throws(() => validateZipEntryResourceLimits({
    entryCount: 1,
    entryBytes: 1,
    totalBytes: ZIP_LIMITS.maxTotalUncompressedBytes + 1
  }), /total uncompressed size/);
});

test("ZIP entry names are byte bounded before header allocation", () => {
  const name = `${"x".repeat(ZIP_LIMITS.maxEntryNameBytes)}x`;
  assert.throws(() => validateZipEntryName(name), /too large/);
});

test("small deterministic stored ZIP inputs remain supported", () => {
  const zip = createStoredZipBuffer([
    { name: "a.txt", data: "a" },
    { name: "nested/b.txt", data: Buffer.from("b") }
  ]);
  assert.ok(Buffer.isBuffer(zip));
  assert.ok(zip.length > 22);
});
