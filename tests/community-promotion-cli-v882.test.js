import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../tools/promote-community-submission.mjs", import.meta.url), "utf8");

test("community promotion CLI uses bounded list I/O and safe workflow output", () => {
  assert.match(source, /readCommunityListFile/);
  assert.match(source, /writeCommunityListFileAtomic/);
  assert.match(source, /serializeCommunityPromotionOutputs/);
  assert.match(source, /appendCommunityWorkflowOutput/);
  assert.doesNotMatch(source, /writeFile\(/);
  assert.doesNotMatch(source, /appendFile\(/);
});
