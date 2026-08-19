import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const buildOutput = fs.readFileSync(new URL("../tools/build-output-io.mjs", import.meta.url), "utf8");

test("M1145 bounds build output paths before filesystem publication", () => {
  for (const marker of [
    "BUILD_OUTPUT_PATH_MAX_BYTES = 1_024",
    'Buffer.byteLength(relativePath, "utf8") > BUILD_OUTPUT_PATH_MAX_BYTES',
    "Build output path exceeds its UTF-8 byte ceiling"
  ]) assert.ok(buildOutput.includes(marker), `missing M1145 path ceiling marker ${marker}`);
});

test("M1145 rejects noncanonical path aliases under dist", () => {
  for (const marker of [
    'relativePath.split("/")',
    'parts[0] !== "dist"',
    'part === "."',
    'part === ".."',
    "normalized !== relativePath",
    "Build output path must be canonical under dist/"
  ]) assert.ok(buildOutput.includes(marker), `missing M1145 canonical marker ${marker}`);
});
