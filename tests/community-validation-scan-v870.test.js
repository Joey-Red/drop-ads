import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { validateCommunitySubmission } from "../tools/community-validation.mjs";

const source = fs.readFileSync(new URL("../tools/community-validation.mjs", import.meta.url), "utf8");
const candidate = "```text\nblock domain ads.example.com\n```";

test("M870 rejects zero or multiple candidate fences", () => {
  assert.equal(validateCommunitySubmission({ body: "No candidate", listText: "" }).status, "invalid");
  assert.equal(validateCommunitySubmission({ body: `${candidate}\n${candidate}`, listText: "" }).status, "invalid");
});

test("M870 scans at most two candidate matches instead of materializing all matches", () => {
  assert.match(source, /function extractSingleCandidateBlock\(body\)/);
  assert.match(source, /const first = CANDIDATE_BLOCK\.exec\(body\)/);
  assert.match(source, /const second = CANDIDATE_BLOCK\.exec\(body\)/);
  assert.doesNotMatch(source, /\[\.\.\.body\.matchAll/);
  assert.match(source, /CANDIDATE_BLOCK\.lastIndex = 0/);
});
