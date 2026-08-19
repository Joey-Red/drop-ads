import test from "node:test";
import assert from "node:assert/strict";
import { buildCommunityIssueFields, MAX_COMMUNITY_ISSUE_BODY_CHARS, MAX_COMMUNITY_ISSUE_TITLE_CHARS } from "../src/core/community-issue.js";
import { communityCandidateFromRule } from "../src/core/community.js";

test("community issue fields are frozen and bounded", () => {
  const fields = buildCommunityIssueFields(communityCandidateFromRule({ kind: "domain", value: "ads.example.com" }));
  assert.equal(Object.isFrozen(fields), true);
  assert.ok(fields.title.length <= MAX_COMMUNITY_ISSUE_TITLE_CHARS);
  assert.ok(fields.body.length <= MAX_COMMUNITY_ISSUE_BODY_CHARS);
  assert.match(fields.body, /block domain ads\.example\.com/);
});
