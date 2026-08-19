import test from "node:test";
import assert from "node:assert/strict";
import { validateCommunityReviewBody } from "../tools/community-review-validation.mjs";

const statements = ["I reviewed the candidate domain before submitting.", "This is a domain-only submission and contains no page, path, query, fragment, or account data."];
function body(first = "x", second = "x") { return `## Review\n\n- [${first}] ${statements[0]}\n- [${second}] ${statements[1]}\n\n## Why block this?\n\nAdvertising endpoint.\n\n## Privacy note\n\nDomain-only.`; }

test("M889 requires both generated review attestations exactly checked", () => {
  assert.equal(validateCommunityReviewBody(body()).reviewed, true);
  assert.throws(() => validateCommunityReviewBody(body(" ", "x")), /attestations/);
  assert.throws(() => validateCommunityReviewBody(body("x", " ")), /attestations/);
});
