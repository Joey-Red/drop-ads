import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../tools/community-promotion.mjs", import.meta.url), "utf8");

test("M875 promotion snapshots and bounds input/output", () => {
  assert.match(source, /Object\.getOwnPropertyDescriptor\(input, key\)/);
  assert.match(source, /MAX_COMMUNITY_SUBMISSION_BODY_BYTES/);
  assert.match(source, /MAX_COMMUNITY_LIST_BYTES/);
  assert.match(source, /Community promotion input is invalid/);
  assert.match(source, /Object\.freeze\(/);
  assert.match(source, /Promoted community list would exceed the supported size limit/);
  assert.doesNotMatch(source, /\.\.\.validation/);
});
