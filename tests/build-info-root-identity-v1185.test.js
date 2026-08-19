import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../tools/build-info.mjs", import.meta.url), "utf8");

test("M1185 binds package metadata and build-input collection to one real repository root", () => {
  assert.match(source, /const rootBefore = await requireBuildRepositoryRoot\(root\)/);
  assert.match(source, /rootAfterPackage = await requireBuildRepositoryRoot\(root\)/);
  assert.match(source, /assertStableBuildRepositoryRoot\(rootBefore, rootAfterPackage, "package metadata read"\)/);
  assert.match(source, /rootAfterInputs = await requireBuildRepositoryRoot\(root\)/);
  assert.match(source, /assertStableBuildRepositoryRoot\(rootBefore, rootAfterInputs, "build input collection"\)/);
  assert.match(source, /stat\.isSymbolicLink\(\) \|\| !stat\.isDirectory\(\)/);
});
