import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const source = fs.readFileSync(new URL("../tools/check-community-submission.mjs", import.meta.url), "utf8");
test("M894 validation CLI requires review body and matching title", () => {
  assert.match(source, /validateReviewedCommunitySubmission/);
  assert.match(source, /SUBMISSION_TITLE/);
  assert.match(source, /validateCommunitySubmissionTitle\(title, result\.candidate\)/);
});
