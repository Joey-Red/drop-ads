import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../tools/check-community-submission.mjs", import.meta.url), "utf8");

test("community validation CLI uses bounded list and workflow-output boundaries", () => {
  assert.match(source, /readCommunityListFile/);
  assert.match(source, /serializeCommunityValidationOutputs/);
  assert.match(source, /appendCommunityWorkflowOutput/);
  assert.doesNotMatch(source, /readFile\(/);
  assert.doesNotMatch(source, /appendFile\(/);
});
