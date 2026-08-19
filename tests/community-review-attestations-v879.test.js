import test from "node:test";
import assert from "node:assert/strict";
import { validateCommunityReviewBody } from "../tools/community-review-validation.mjs";

function body(first = "x", second = "x") {
  return ["## Candidate", "", "```text", "block domain ads.example.com", "```", "", "## Review", "", `- [${first}] I reviewed the candidate domain before submitting.`, `- [${second}] This is a domain-only submission and contains no page, path, query, fragment, or account data.`, "", "## Why block this?", "", "Serves advertising resources.", "", "## Privacy note", "", "Domain-only."].join("\n");
}

test("M879 requires both explicit review attestations to be checked", () => {
  assert.equal(validateCommunityReviewBody(body()).reviewed, true);
  assert.throws(() => validateCommunityReviewBody(body(" ", "x")), /attestations/);
  assert.throws(() => validateCommunityReviewBody(body("x", " ")), /attestations/);
});
