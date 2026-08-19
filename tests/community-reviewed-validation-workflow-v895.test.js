import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const workflow = fs.readFileSync(new URL("../.github/workflows/community-submission.yml", import.meta.url), "utf8");
test("M895 issue validation passes exact title and body into the review gate", () => {
  assert.match(workflow, /SUBMISSION_TITLE: \$\{\{ github\.event\.issue\.title \}\}/);
  assert.match(workflow, /SUBMISSION_BODY: \$\{\{ github\.event\.issue\.body \}\}/);
  assert.match(workflow, /Review attestations and a human rationale are present/);
});
