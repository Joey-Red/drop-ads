import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../tools/build-input-discovery.mjs", import.meta.url), "utf8");
const buildInfo = fs.readFileSync(new URL("../tools/build-info.mjs", import.meta.url), "utf8");

test("M1164 bounds traversal entries and directories before further recursion", () => {
  assert.match(source, /MAX_BUILD_INPUT_TRAVERSAL_ENTRIES = 100_000/);
  assert.match(source, /MAX_BUILD_INPUT_ROOT_DIRECTORIES = 4_096/);
  assert.match(source, /state\.directories \+= 1/);
  assert.match(source, /state\.directories > MAX_BUILD_INPUT_ROOT_DIRECTORIES/);
  assert.match(source, /state\.entries \+= 1/);
  assert.match(source, /state\.entries > MAX_BUILD_INPUT_TRAVERSAL_ENTRIES/);
});

test("M1164 centralizes build-input discovery with a shared-root extension", () => {
  assert.match(buildInfo, /discoverBuildInputRoots/);
  assert.match(buildInfo, /discoverBuildInputRoots\(root, BUILD_INPUT_ROOTS\.map/);
  assert.match(source, /discoverBuildInputFilesWithState/);
  assert.match(source, /export async function discoverBuildInputFiles\(rootDirectory, directory\)/);
  assert.doesNotMatch(buildInfo, /async function filesUnder/);
});
