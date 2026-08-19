import assert from "node:assert/strict";
import test from "node:test";
import { promoteCommunitySubmission } from "../tools/community-promotion.mjs";
import { MAX_COMMUNITY_LIST_BYTES, MAX_COMMUNITY_SUBMISSION_BODY_BYTES } from "../tools/community-validation.mjs";

test("M873 rejects oversized promotion inputs without echoing them", () => {
  const hugeBody = "x".repeat(MAX_COMMUNITY_SUBMISSION_BODY_BYTES + 1);
  const bodyResult = promoteCommunitySubmission({ body: hugeBody, listText: "" });
  assert.equal(bodyResult.status, "invalid");
  assert.equal(bodyResult.changed, false);
  assert.equal(bodyResult.listText, "");
  assert.equal(Object.isFrozen(bodyResult), true);

  const hugeList = "x".repeat(MAX_COMMUNITY_LIST_BYTES + 1);
  const listResult = promoteCommunitySubmission({ body: "invalid", listText: hugeList });
  assert.equal(listResult.status, "invalid");
  assert.equal(listResult.changed, false);
  assert.equal(listResult.listText, "");
});

test("M876 rejects noncanonical promotion list text before output", () => {
  for (const listText of ["\uFEFFexample.com\n", "example.com\0\n", "example.com", "example.com\rbroken\n"]) {
    const result = promoteCommunitySubmission({ body: "invalid", listText });
    assert.equal(result.status, "invalid");
    assert.equal(result.changed, false);
    assert.equal(result.listText, "");
    assert.equal(Object.isFrozen(result), true);
  }
});
