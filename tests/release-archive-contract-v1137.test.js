import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const contract = fs.readFileSync(new URL("../tools/release-archive-contract.mjs", import.meta.url), "utf8");
const writer = fs.readFileSync(new URL("../tools/deterministic-zip.mjs", import.meta.url), "utf8");
const verifier = fs.readFileSync(new URL("../tools/zip-verify.mjs", import.meta.url), "utf8");
const provenance = fs.readFileSync(new URL("../tools/release-tool-contract.mjs", import.meta.url), "utf8");

test("M1137 centralizes the exact deterministic release archive ceilings", () => {
  for (const marker of [
    "maxEntries: 1_024",
    "maxArchiveBytes: 64 * 1024 * 1024",
    "maxEntryBytes: 16 * 1024 * 1024",
    "maxPathBytes: 512",
    "maxTotalUncompressedBytes: 64 * 1024 * 1024"
  ]) assert.ok(contract.includes(marker), `missing shared archive limit ${marker}`);
  assert.match(contract, /Object\.freeze/);
});

test("M1137 writer and verifier consume one release archive contract", () => {
  assert.match(writer, /import \{ RELEASE_ARCHIVE_LIMITS \} from "\.\/release-archive-contract\.mjs"/);
  assert.match(verifier, /import \{ RELEASE_ARCHIVE_LIMITS \} from "\.\/release-archive-contract\.mjs"/);
  assert.match(writer, /maxEntryNameBytes: RELEASE_ARCHIVE_LIMITS\.maxPathBytes/);
  assert.match(verifier, /export const ZIP_VERIFY_LIMITS = RELEASE_ARCHIVE_LIMITS/);
  assert.match(provenance, /tools\/release-archive-contract\.mjs/);
});
