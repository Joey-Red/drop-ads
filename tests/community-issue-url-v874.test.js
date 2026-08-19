import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/community-issue.js", import.meta.url), "utf8");

test("community issue URL is fixed-origin, descriptor-safe, encoded, and bounded", () => {
  assert.match(source, /COMMUNITY_ISSUE_BASE = "https:\/\/github\.com\/Joey-Red\/drop-ads\/issues\/new"/);
  assert.match(source, /snapshotCommunityIssueFields\(fields\)/);
  assert.match(source, /encodeURIComponent\(snapshot\.title\)/);
  assert.match(source, /encodeURIComponent\(snapshot\.body\)/);
  assert.match(source, /MAX_COMMUNITY_ISSUE_URL_CHARS = 8_192/);
  assert.match(source, /if \(url\.length > MAX_COMMUNITY_ISSUE_URL_CHARS\) throw/);
});
