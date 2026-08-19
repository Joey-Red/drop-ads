import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../tools/promote-community-submission.mjs", import.meta.url), "utf8");

test("M886 promotion CLI requires reviewed body and exact title before mutation", () => {
  assert.match(source, /validateReviewedCommunitySubmission/);
  assert.match(source, /validateCommunitySubmissionTitle\(title, reviewed\.candidate\)/);
  assert.match(source, /if \(result\.changed\) await writeCommunityListFileAtomic/);
});
