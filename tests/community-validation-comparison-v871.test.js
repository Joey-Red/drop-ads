import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../tools/community-validation.mjs", import.meta.url), "utf8");

test("M871 compares community candidates without allocating a full rule-key Set", () => {
  assert.match(source, /export function classifyCommunityCandidate/);
  assert.match(source, /for \(const rule of current\.block\)/);
  assert.match(source, /for \(const rule of current\.allow\)/);
  assert.doesNotMatch(source, /new Set\(current\.block\.map\(ruleKey\)\)/);
});
