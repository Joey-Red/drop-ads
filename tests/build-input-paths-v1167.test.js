import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const discovery = fs.readFileSync(new URL("../tools/build-input-discovery.mjs", import.meta.url), "utf8");
const buildInfo = fs.readFileSync(new URL("../tools/build-info.mjs", import.meta.url), "utf8");
const descriptorSafety = fs.readFileSync(new URL("../tools/build-input-descriptor-safety.mjs", import.meta.url), "utf8");

test("M1167 enforces canonical 1024-byte repository-relative paths", () => {
  assert.match(discovery, /MAX_BUILD_INPUT_PATH_BYTES = 1_024/);
  assert.match(discovery, /Buffer\.byteLength\(value, "utf8"\) > MAX_BUILD_INPUT_PATH_BYTES/);
  assert.match(discovery, /value\.startsWith\("\/"\)/);
  assert.match(discovery, /value\.includes\("\\\\"\)/);
  assert.match(discovery, /UNSAFE_BUILD_INPUT_PATH_TEXT/);
  assert.match(discovery, /part === "\." \|\| part === "\.\."/);
  assert.match(discovery, /posix\.normalize\(value\) !== value/);
});

test("M1167 applies canonical admission to discovered, fixed, and descriptor build inputs", () => {
  assert.match(discovery, /repoPath\(rootDirectory, path\)/);
  assert.match(buildInfo, /assertCanonicalBuildInputPath/);
  assert.match(buildInfo, /return assertCanonicalBuildInputPath\(relative\(root, path\)/);
  assert.match(buildInfo, /const canonicalPath = repoPath\(root, path\)/);
  assert.match(descriptorSafety, /const path = assertCanonicalBuildInputPath\(values\.path\)/);
});
