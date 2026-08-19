import test from "node:test";
import assert from "node:assert/strict";
import { validateCommunityReviewBody } from "../tools/community-review-validation.mjs";
const review = "- [x] I reviewed the candidate domain before submitting.\n- [x] This is a domain-only submission and contains no page, path, query, fragment, or account data.";
test("M892 review sections must be unique and ordered", () => {
  const valid = `## Review\n\n${review}\n\n## Why block this?\n\nAdvertising endpoint.\n\n## Privacy note\n\nDomain-only.`;
  assert.doesNotThrow(() => validateCommunityReviewBody(valid));
  assert.throws(() => validateCommunityReviewBody(`${valid}\n## Review`), /exactly one Review/);
  assert.throws(() => validateCommunityReviewBody(`## Why block this?\n\nAdvertising endpoint.\n\n## Review\n\n${review}\n\n## Privacy note\n\nDomain-only.`), /out of order/);
});
