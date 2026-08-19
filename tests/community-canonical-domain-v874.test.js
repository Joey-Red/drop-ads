import test from "node:test";
import assert from "node:assert/strict";
import { buildCommunityIssueFields } from "../src/core/community-issue.js";
import { validateCommunitySubmission } from "../tools/community-validation.mjs";

function candidateBody(value) {
  return `## Candidate\n\n\`\`\`text\nblock domain ${value}\n\`\`\`\n`;
}

test("community issue fields accept only already-canonical domain candidates", () => {
  assert.throws(() => buildCommunityIssueFields({ kind: "domain", value: "Ads.Example.com" }), /already be canonical/);
  assert.throws(() => buildCommunityIssueFields({ kind: "domain", value: ".ads.example.com" }), /already be canonical/);
  assert.match(buildCommunityIssueFields({ kind: "domain", value: "ads.example.com" }).body, /block domain ads\.example\.com/);
});

test("community validation rejects silently-normalizable and non-domain candidate spellings", () => {
  for (const value of [
    "Ads.Example.com",
    ".ads.example.com",
    "https://ads.example.com/path",
    "user@ads.example.com",
    "ads.example.com/path",
    "ads.example.com?campaign=private",
    "ads.example.com#fragment",
    "||ads.example.com^"
  ]) {
    const result = validateCommunitySubmission({ body: candidateBody(value), listText: "" });
    assert.equal(result.status, "invalid", value);
  }

  const accepted = validateCommunitySubmission({ body: candidateBody("ads.example.com"), listText: "" });
  assert.equal(accepted.status, "ready");
  assert.equal(accepted.candidate, "block domain ads.example.com");
});
