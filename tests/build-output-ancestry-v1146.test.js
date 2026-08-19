import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const buildOutput = fs.readFileSync(new URL("../tools/build-output-io.mjs", import.meta.url), "utf8");

test("M1146 requires bounded real directory ancestry before build publication", () => {
  for (const marker of [
    "BUILD_OUTPUT_MAX_DIRECTORY_DEPTH = 32",
    "Build repository root",
    "Build output directory ancestry",
    "Build output directory ancestry exceeds its depth ceiling",
    "await requireRealBuildOutputAncestry(rootDirectory, output)"
  ]) assert.ok(buildOutput.includes(marker), `missing M1146 ancestry marker ${marker}`);
});

test("M1146 checks each parent component with lstat-backed real-directory refusal", () => {
  assert.match(buildOutput, /for \(const segment of segments\)[\s\S]*await requireRealDirectory\(current, "Build output directory ancestry"\)/);
  assert.match(buildOutput, /stat\.isSymbolicLink\(\) \|\| !stat\.isDirectory\(\)/);
});
