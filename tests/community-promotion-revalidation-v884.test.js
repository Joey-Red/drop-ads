import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { promoteCommunitySubmission } from "../tools/community-promotion.mjs";

test("M884 promoted list is semantically revalidated before it is returned as changed", () => {
  const result = promoteCommunitySubmission({
    body: "## Candidate\n\n```text\nblock domain ads.example.com\n```",
    listText: "block domain tracker.example.com\n"
  });
  assert.equal(result.changed, true);
  assert.match(result.listText, /block domain ads\.example\.com\n$/);

  const source = fs.readFileSync(new URL("../tools/community-promotion.mjs", import.meta.url), "utf8");
  assert.match(source, /promotedListContainsCandidateExactlyOnce/);
  assert.match(source, /parseNativeList\(listText\)/);
  assert.match(source, /failed semantic revalidation/);
});
