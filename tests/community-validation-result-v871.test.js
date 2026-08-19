import test from "node:test";
import assert from "node:assert/strict";
import { MAX_COMMUNITY_RESULT_REASON_CHARS, validateCommunitySubmission } from "../tools/community-validation.mjs";

function body(domain) { return `\`\`\`text\nblock domain ${domain}\n\`\`\``; }

test("M871 returns frozen reviewed community validation outcomes", () => {
  const ready = validateCommunitySubmission({ body: body("ads.example.com"), listText: "" });
  assert.equal(ready.status, "ready");
  assert.equal(ready.valid, true);
  assert.equal(Object.isFrozen(ready), true);
  assert.deepEqual(Object.keys(ready), ["valid", "status", "candidate", "reason"]);

  const invalid = validateCommunitySubmission({ body: "invalid", listText: "" });
  assert.equal(invalid.status, "invalid");
  assert.equal(invalid.valid, false);
  assert.equal(Object.isFrozen(invalid), true);
  assert.ok(invalid.reason.length <= MAX_COMMUNITY_RESULT_REASON_CHARS);
});

test("M871 keeps duplicate/conflict-style syntax-valid outcomes distinct from invalid", () => {
  const duplicate = validateCommunitySubmission({ body: body("ads.example.com"), listText: "block domain ads.example.com\n" });
  assert.equal(duplicate.status, "duplicate");
  assert.equal(duplicate.valid, true);
});
