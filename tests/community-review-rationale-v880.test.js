import test from "node:test";
import assert from "node:assert/strict";
import { validateCommunityReviewBody } from "../tools/community-review-validation.mjs";

function body(reason) {
  return ["## Review", "", "- [x] I reviewed the candidate domain before submitting.", "- [x] This is a domain-only submission and contains no page, path, query, fragment, or account data.", "", "## Why block this?", "", reason, "", "## Privacy note", "", "Domain-only."].join("\n");
}

test("M880 requires a human rationale instead of the generated placeholder", () => {
  assert.equal(validateCommunityReviewBody(body("Advertising endpoint observed independently.")).rationalePresent, true);
  assert.throws(() => validateCommunityReviewBody(body("<!-- Briefly explain why this domain should be blocked. -->")), /template comment/);
  assert.throws(() => validateCommunityReviewBody(body("")), /bounded human reason/);
});
