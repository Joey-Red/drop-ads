import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../tools/verify-reproducible.mjs", import.meta.url), "utf8");

test("M1126 reproducibility snapshots have explicit bounded work ceilings", () => {
  for (const marker of [
    "maxFiles: 4_096",
    "maxDirectories: 4_096",
    "maxFileBytes: 64 * 1024 * 1024",
    "maxTotalBytes: 256 * 1024 * 1024",
    "maxPathBytes: 1_024",
    "file count exceeds supported limit",
    "directory count exceeds supported limit",
    "aggregate bytes exceed supported limit",
    "path exceeds supported limit"
  ]) assert.ok(source.includes(marker), `missing M1126 marker ${marker}`);
});

test("M1126 rejects oversized files before reproducibility hashing", () => {
  const lstatIndex = source.indexOf("const before = await lstat(path)", source.indexOf("hashReproducibilityFile"));
  const limitIndex = source.indexOf("before.size > maxBytes", lstatIndex);
  const openIndex = source.indexOf("const handle = await open(path, \"r\")", lstatIndex);
  assert.ok(lstatIndex >= 0 && limitIndex > lstatIndex && openIndex > limitIndex);
  assert.match(source, /opened\.size > maxBytes/);
  assert.match(source, /bytes > opened\.size \|\| bytes > maxBytes/);
});
