import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../tools/build-info.mjs", import.meta.url), "utf8");

test("M1186 validates immutable bounded unique build-input membership before build work", () => {
  assert.match(source, /validateBuildInputMembershipContract\(\);/);
  assert.match(source, /Object\.isFrozen\(BUILD_INPUT_ROOTS\)/);
  assert.match(source, /MAX_BUILD_INPUT_ROOT_MEMBERS = 32/);
  assert.match(source, /MAX_BUILD_INPUT_FIXED_MEMBERS = 256/);
  assert.match(source, /Duplicate build input recursive root/);
  assert.match(source, /Duplicate fixed build input file/);
  assert.match(source, /Fixed build input overlaps recursive root/);
  assert.match(source, /recursive root must be a single path segment/);
});
