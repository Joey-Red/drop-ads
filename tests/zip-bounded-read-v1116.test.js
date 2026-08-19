import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const zip = fs.readFileSync(new URL("../tools/zip-verify.mjs", import.meta.url), "utf8");

test("M1116 enforces archive ceilings before whole-file allocation", () => {
  for (const marker of [
    "ZIP_VERIFY_LIMITS",
    "maxArchiveBytes: 64 * 1024 * 1024",
    "ZIP archive must be a regular non-symlink file",
    "ZIP archive exceeds verification byte ceiling before allocation",
    "await lstat(path)",
    "await open(path, \"r\")",
    "Buffer.alloc(opened.size)",
    "ZIP archive changed during bounded read"
  ]) assert.ok(zip.includes(marker), `missing M1116 marker ${marker}`);
  assert.match(zip, /parseProjectStoredZip\(await readBoundedArchive\(archivePath\)\)/);
});

test("M1116 keeps entry/path/aggregate structural ceilings", () => {
  for (const marker of ["maxEntries", "maxEntryBytes", "maxPathBytes", "maxTotalUncompressedBytes"]) assert.ok(zip.includes(marker));
});
