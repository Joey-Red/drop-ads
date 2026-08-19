import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const workflowIo = fs.readFileSync(new URL("../tools/community-workflow-io.mjs", import.meta.url), "utf8");
const check = fs.readFileSync(new URL("../tools/check-community-submission.mjs", import.meta.url), "utf8");
const promote = fs.readFileSync(new URL("../tools/promote-community-submission.mjs", import.meta.url), "utf8");

test("M883 GitHub output writes reject symlinks and bind to the opened file identity", () => {
  assert.match(workflowIo, /MAX_COMMUNITY_WORKFLOW_OUTPUT_BYTES/);
  assert.match(workflowIo, /before\.isSymbolicLink\(\)/);
  assert.match(workflowIo, /O_NOFOLLOW/);
  assert.match(workflowIo, /opened\.ino !== before\.ino/);
  assert.match(check, /appendCommunityWorkflowOutput/);
  assert.match(promote, /appendCommunityWorkflowOutput/);
  assert.doesNotMatch(check, /appendFile/);
  assert.doesNotMatch(promote, /appendFile/);
});
