import test from "node:test";
import assert from "node:assert/strict";
import { MAX_COMMUNITY_SUBMISSION_BODY_BYTES, validateCommunitySubmission } from "../tools/community-validation.mjs";

function candidateBody(domain = "ads.example.com") {
  return `## Candidate\n\n\`\`\`text\nblock domain ${domain}\n\`\`\`\n`;
}

test("community validation rejects accessor input without invoking getters", () => {
  const input = { listText: "" };
  Object.defineProperty(input, "body", { enumerable: true, get() { throw new Error("getter executed"); } });
  const result = validateCommunitySubmission(input);
  assert.equal(result.status, "invalid");
  assert.doesNotMatch(result.reason, /getter executed/);
});

test("community validation bounds submission body before candidate scanning", () => {
  const body = "x".repeat(MAX_COMMUNITY_SUBMISSION_BODY_BYTES + 1);
  const result = validateCommunitySubmission({ body, listText: "" });
  assert.equal(result.status, "invalid");
  assert.match(result.reason, /too large/);
});

test("community validation rejects canonical local/private network candidates", () => {
  for (const domain of ["127.0.0.1", "10.20.30.40", "192.168.1.20", "device.local", "router.home.arpa"]) {
    const result = validateCommunitySubmission({ body: candidateBody(domain), listText: "" });
    assert.equal(result.status, "invalid", domain);
    assert.match(result.reason, /public domain|local|private|non-public/i, domain);
  }
});

test("community validation returns frozen privacy-minimal results", () => {
  const result = validateCommunitySubmission({ body: candidateBody(), listText: "" });
  assert.equal(Object.isFrozen(result), true);
  assert.deepEqual(Object.keys(result).sort(), ["candidate", "reason", "status", "valid"]);
});
