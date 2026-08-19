import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const contract = fs.readFileSync(new URL("../tools/release-archive-contract.mjs", import.meta.url), "utf8");
const writer = fs.readFileSync(new URL("../tools/deterministic-zip.mjs", import.meta.url), "utf8");

test("M1139 publishes explicit source traversal ceilings", () => {
  assert.match(contract, /maxSourceDirectories: 4_096/);
  assert.match(contract, /maxSourcePathBytes: 1_024/);
  assert.match(writer, /maxSourceDirectories: RELEASE_ARCHIVE_LIMITS\.maxSourceDirectories/);
  assert.match(writer, /maxSourcePathBytes: RELEASE_ARCHIVE_LIMITS\.maxSourcePathBytes/);
});

test("M1139 bounds directory iteration, discovered entries, and source-relative path work", () => {
  for (const marker of [
    "opendir(current)",
    "ZIP source directory count exceeds supported limit",
    "ZIP source discovery count exceeds supported limit",
    "ZIP source path exceeds supported traversal boundary",
    "Buffer.byteLength(sourcePath, \"utf8\") > ZIP_LIMITS.maxSourcePathBytes",
    "const maxDiscoveredEntries = ZIP_LIMITS.maxEntries + ZIP_LIMITS.maxSourceDirectories"
  ]) assert.ok(writer.includes(marker), `missing M1139 marker ${marker}`);
  assert.doesNotMatch(writer, /readdir\(current/);
});
