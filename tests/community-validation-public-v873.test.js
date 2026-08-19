import test from "node:test";
import assert from "node:assert/strict";
import { validateCommunitySubmission } from "../tools/community-validation.mjs";

function body(domain) { return `## Candidate\n\n\`\`\`text\nblock domain ${domain}\n\`\`\``; }

test("community validator rejects private, URL-shaped, and noncanonical candidates", () => {
  for (const candidate of ["127.0.0.1", "10.0.0.8", "https://ads.example.com/path", "ADS.EXAMPLE.COM"]) {
    const result = validateCommunitySubmission({ body: body(candidate), listText: "" });
    assert.equal(result.status, "invalid");
    assert.equal(result.changed, undefined);
  }
});

test("community validator accepts one canonical public domain candidate", () => {
  const result = validateCommunitySubmission({ body: body("ads.example.com"), listText: "" });
  assert.equal(result.status, "ready");
  assert.equal(result.candidate, "block domain ads.example.com");
  assert.equal(Object.isFrozen(result), true);
});
