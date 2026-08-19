import test from "node:test";
import assert from "node:assert/strict";
import { validateCommunityReviewBody } from "../tools/community-review-validation.mjs";

const review = "- [x] I reviewed the candidate domain before submitting.\n- [x] This is a domain-only submission and contains no page, path, query, fragment, or account data.";
const body = (reason) => `## Review\n\n${review}\n\n## Why block this?\n\n${reason}\n\n## Privacy note\n\nDomain-only.`;

test("M890 requires a human rationale and rejects the generated comment", () => {
  assert.equal(validateCommunityReviewBody(body("Advertising endpoint observed independently.")).rationalePresent, true);
  assert.throws(() => validateCommunityReviewBody(body("<!-- placeholder -->")), /template comment/);
  assert.throws(() => validateCommunityReviewBody(body("")), /bounded human reason/);
});
