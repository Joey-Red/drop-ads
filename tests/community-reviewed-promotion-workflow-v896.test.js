import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const cli = fs.readFileSync(new URL("../tools/promote-community-submission.mjs", import.meta.url), "utf8");
const workflow = fs.readFileSync(new URL("../.github/workflows/community-promote.yml", import.meta.url), "utf8");
test("M896 promotion requires reviewed body, exact title, and per-issue serialization", () => {
  assert.match(cli, /validateReviewedCommunitySubmission/);
  assert.match(cli, /validateCommunitySubmissionTitle\(title, reviewed\.candidate\)/);
  assert.match(workflow, /SUBMISSION_TITLE: \$\{\{ github\.event\.issue\.title \}\}/);
  assert.match(workflow, /group: community-promotion-\$\{\{ github\.event\.issue\.number \}\}/);
});
