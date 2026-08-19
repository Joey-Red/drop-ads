import test from "node:test";
import assert from "node:assert/strict";
import { MAX_COMMUNITY_RATIONALE_CHARS, validateCommunityReviewBody } from "../tools/community-review-validation.mjs";

function body(reason) {
  return ["## Review", "", "- [x] I reviewed the candidate domain before submitting.", "- [x] This is a domain-only submission and contains no page, path, query, fragment, or account data.", "", "## Why block this?", "", reason, "", "## Privacy note", "", "Domain-only."].join("\n");
}

test("M881 rationale work is explicitly bounded", () => {
  assert.doesNotThrow(() => validateCommunityReviewBody(body("a".repeat(MAX_COMMUNITY_RATIONALE_CHARS))));
  assert.throws(() => validateCommunityReviewBody(body("a".repeat(MAX_COMMUNITY_RATIONALE_CHARS + 1))), /bounded human reason/);
  assert.throws(() => validateCommunityReviewBody(body("short")), /bounded human reason/);
});
