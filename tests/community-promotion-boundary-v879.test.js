import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { promoteCommunitySubmission } from "../tools/community-promotion.mjs";

test("M879 promotion accepts only exact own-data input and returns immutable results", () => {
  let invoked = false;
  const hostile = { listText: "" };
  Object.defineProperty(hostile, "body", { enumerable: true, get() { invoked = true; return ""; } });
  const rejected = promoteCommunitySubmission(hostile);
  assert.equal(invoked, false);
  assert.equal(rejected.status, "invalid");
  assert.equal(Object.isFrozen(rejected), true);

  const ready = promoteCommunitySubmission({
    body: "## Candidate\n\n```text\nblock domain ads.example.com\n```",
    listText: ""
  });
  assert.equal(ready.changed, true);
  assert.equal(ready.listText, "block domain ads.example.com\n");
  assert.equal(Object.isFrozen(ready), true);
});

test("M879 source keeps promotion work bounded by the shared list ceiling", () => {
  const source = fs.readFileSync(new URL("../tools/community-promotion.mjs", import.meta.url), "utf8");
  assert.match(source, /snapshotPromotionInput/);
  assert.match(source, /MAX_COMMUNITY_LIST_BYTES/);
  assert.match(source, /Object\.freeze/);
});
