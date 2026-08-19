import assert from "node:assert/strict";
import test from "node:test";
import { MAX_COMMUNITY_LIST_BYTES } from "../tools/community-validation.mjs";
import { promoteCommunitySubmission } from "../tools/community-promotion.mjs";

const body = "```text\nblock domain ads.example.com\n```";

test("M876 promoted output stays immutable and within the community-list ceiling", () => {
  const result = promoteCommunitySubmission({ body, listText: "# Drop Ads\n" });
  assert.equal(result.status, "ready");
  assert.equal(result.changed, true);
  assert.equal(Object.isFrozen(result), true);
  assert.ok(Buffer.byteLength(result.listText, "utf8") <= MAX_COMMUNITY_LIST_BYTES);
  assert.match(result.listText, /block domain ads\.example\.com\n$/);
});

test("M876 refuses oversized promotion output without exceeding the reviewed ceiling", () => {
  const nearLimit = `${"#".repeat(MAX_COMMUNITY_LIST_BYTES - 1)}\n`;
  const result = promoteCommunitySubmission({ body, listText: nearLimit });
  assert.equal(result.changed, false);
  assert.equal(result.status, "invalid");
  assert.ok(Buffer.byteLength(result.listText, "utf8") <= MAX_COMMUNITY_LIST_BYTES);
});
