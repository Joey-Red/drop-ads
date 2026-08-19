import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const ancestry = fs.readFileSync(new URL("../tools/build-input-ancestry.mjs", import.meta.url), "utf8");
const buildInfo = fs.readFileSync(new URL("../tools/build-info.mjs", import.meta.url), "utf8");

test("M1187 bounds and snapshots only real repository directory ancestry", () => {
  assert.match(ancestry, /MAX_BUILD_INPUT_ANCESTRY_DIRECTORIES = 64/);
  assert.match(ancestry, /must be an absolute normalized path/);
  assert.match(ancestry, /ancestry escapes the repository root/);
  assert.match(ancestry, /isSymbolicLink\(\) \|\| !stat\.isDirectory\(\)/);
  assert.match(ancestry, /Object\.freeze\(snapshots\)/);
});

test("M1187 fingerprints and snapshots ancestry immediately before hashing", () => {
  assert.match(buildInfo, /snapshotBuildInputDirectoryAncestry/);
  assert.match(buildInfo, /"tools\/build-input-ancestry\.mjs"/);
  assert.match(buildInfo, /const ancestry = await snapshotBuildInputDirectoryAncestry\(root, path\);\s*const descriptor = await hashBuildInputFile\(path\);/s);
});
