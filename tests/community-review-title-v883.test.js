import test from "node:test";
import assert from "node:assert/strict";
import { validateCommunitySubmissionTitle } from "../tools/community-review-validation.mjs";

test("M883 community title must name the exact validated candidate domain", () => {
  assert.equal(validateCommunitySubmissionTitle("[Community block] ads.example.com", "block domain ads.example.com"), true);
  assert.equal(validateCommunitySubmissionTitle("[Community block] other.example.com", "block domain ads.example.com"), false);
  assert.equal(validateCommunitySubmissionTitle("[Community block] ads.example.com extra", "block domain ads.example.com"), false);
});
