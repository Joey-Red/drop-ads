import test from "node:test";
import assert from "node:assert/strict";
import { MAX_COMMUNITY_LIST_BYTES, MAX_COMMUNITY_SUBMISSION_BODY_BYTES, validateCommunitySubmission } from "../tools/community-validation.mjs";

const validBody = "## Candidate\n\n```text\nblock domain ads.example.com\n```\n";

test("M869 accepts exact own-data community validation input", () => {
  const result = validateCommunitySubmission({ body: validBody, listText: "# Drop Ads\n" });
  assert.equal(result.status, "ready");
});

test("M869 fails closed on hostile input containers", () => {
  const accessor = {};
  Object.defineProperty(accessor, "body", { enumerable: true, get() { throw new Error("getter must not run"); } });
  Object.defineProperty(accessor, "listText", { enumerable: true, value: "" });
  assert.equal(validateCommunitySubmission(accessor).status, "invalid");
  assert.equal(validateCommunitySubmission({ body: validBody, listText: "", extra: true }).status, "invalid");
  assert.equal(validateCommunitySubmission(Object.assign(Object.create({ inherited: true }), { body: validBody, listText: "" })).status, "invalid");
});

test("M869 bounds issue-body and list text before parsing", () => {
  assert.equal(validateCommunitySubmission({ body: "x".repeat(MAX_COMMUNITY_SUBMISSION_BODY_BYTES + 1), listText: "" }).status, "invalid");
  assert.equal(validateCommunitySubmission({ body: validBody, listText: "x".repeat(MAX_COMMUNITY_LIST_BYTES + 1) }).status, "invalid");
});
