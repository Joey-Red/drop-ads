import test from "node:test";
import assert from "node:assert/strict";
import { validateCommunityReviewBody } from "../tools/community-review-validation.mjs";

const review = "- [x] I reviewed the candidate domain before submitting.\n- [x] This is a domain-only submission and contains no page, path, query, fragment, or account data.";
function body(extra = "") { return `## Review\n\n${review}\n\n## Why block this?\n\nAdvertising endpoint.\n\n${extra}## Privacy note\n\nDomain-only.`; }

test("M882 rejects duplicate or reordered review sections", () => {
  assert.doesNotThrow(() => validateCommunityReviewBody(body()));
  assert.throws(() => validateCommunityReviewBody(body("## Why block this?\n\nAnother reason.\n\n")), /exactly one Why block this/);
  assert.throws(() => validateCommunityReviewBody(`## Why block this?\n\nAdvertising endpoint.\n\n## Review\n\n${review}\n\n## Privacy note\n\nDomain-only.`), /out of order/);
});
