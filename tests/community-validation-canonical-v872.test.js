import test from "node:test";
import assert from "node:assert/strict";
import { validateCommunitySubmission } from "../tools/community-validation.mjs";

function body(domain) { return `\`\`\`text\nblock domain ${domain}\n\`\`\``; }

test("M872 accepts already-canonical candidate spelling", () => {
  assert.equal(validateCommunitySubmission({ body: body("ads.example.com"), listText: "" }).status, "ready");
});

test("M872 rejects candidate spelling that parser would silently normalize", () => {
  const uppercase = validateCommunitySubmission({ body: body("ADS.EXAMPLE.COM"), listText: "" });
  assert.equal(uppercase.status, "invalid");
  assert.match(uppercase.reason, /canonical normalized domain spelling/);
});
