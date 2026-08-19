import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const ancestry = fs.readFileSync(new URL("../tools/build-input-ancestry.mjs", import.meta.url), "utf8");
const buildInfo = fs.readFileSync(new URL("../tools/build-info.mjs", import.meta.url), "utf8");

test("M1188 validates frozen dense ancestry snapshots before revalidation", () => {
  assert.match(ancestry, /export async function revalidateBuildInputDirectoryAncestry/);
  assert.match(ancestry, /Object\.isFrozen\(snapshots\)/);
  assert.match(ancestry, /Reflect\.ownKeys\(snapshots\)/);
  assert.match(ancestry, /SNAPSHOT_KEYS/);
  assert.match(ancestry, /must be dense without extra fields/);
});

test("M1188 rejects parent identity or metadata changes after hashing", () => {
  assert.match(ancestry, /directory changed while hashing/);
  assert.match(ancestry, /directory identity changed while hashing/);
  assert.match(buildInfo, /const ancestry = await snapshotBuildInputDirectoryAncestry\(root, path\);\s*const descriptor = await hashBuildInputFile\(path\);\s*await revalidateBuildInputDirectoryAncestry\(ancestry\);/s);
});
