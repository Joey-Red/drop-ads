import test from "node:test";
import assert from "node:assert/strict";
import { validateCommunitySubmissionTitle } from "../tools/community-review-validation.mjs";
test("M893 title must exactly identify the validated candidate", () => {
  assert.equal(validateCommunitySubmissionTitle("[Community block] ads.example.com", "block domain ads.example.com"), true);
  assert.equal(validateCommunitySubmissionTitle("[Community block] other.example.com", "block domain ads.example.com"), false);
  assert.equal(validateCommunitySubmissionTitle("community ads.example.com", "block domain ads.example.com"), false);
});
