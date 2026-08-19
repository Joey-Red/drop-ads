import test from "node:test";
import assert from "node:assert/strict";
import { buildCommunityIssueFields } from "../src/core/community-issue.js";

test("prepared community issue requires visible human review attestations and a reason", () => {
  const fields = buildCommunityIssueFields({ kind: "domain", value: "ads.example.com" });
  assert.match(fields.body, /\- \[ \] I reviewed the candidate domain before submitting\./);
  assert.match(fields.body, /domain-only submission and contains no page, path, query, fragment, or account data/);
  assert.match(fields.body, /## Why block this\?/);
  assert.match(fields.body, /add a reason before submitting/);
  assert.equal(Object.isFrozen(fields), true);
});
