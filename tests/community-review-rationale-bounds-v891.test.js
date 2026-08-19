import test from "node:test";
import assert from "node:assert/strict";
import { MAX_COMMUNITY_RATIONALE_CHARS, validateCommunityReviewBody } from "../tools/community-review-validation.mjs";
const review = "- [x] I reviewed the candidate domain before submitting.\n- [x] This is a domain-only submission and contains no page, path, query, fragment, or account data.";
const body = (reason) => `## Review\n\n${review}\n\n## Why block this?\n\n${reason}\n\n## Privacy note\n\nDomain-only.`;
test("M891 rationale length stays explicitly bounded", () => {
  assert.doesNotThrow(() => validateCommunityReviewBody(body("a".repeat(MAX_COMMUNITY_RATIONALE_CHARS))));
  assert.throws(() => validateCommunityReviewBody(body("a".repeat(MAX_COMMUNITY_RATIONALE_CHARS + 1))), /bounded human reason/);
  assert.throws(() => validateCommunityReviewBody(body("short")), /bounded human reason/);
});
