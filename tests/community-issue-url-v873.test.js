import test from "node:test";
import assert from "node:assert/strict";
import { buildCommunityIssueUrl, COMMUNITY_ISSUE_BASE } from "../src/core/community.js";
import { MAX_COMMUNITY_ISSUE_URL_CHARS } from "../src/core/community-issue.js";

test("community issue URL has fixed destination, deterministic parameters, and bounded length", () => {
  const first = buildCommunityIssueUrl({ kind: "domain", value: "ads.example.com" });
  const second = buildCommunityIssueUrl({ kind: "domain", value: "ADS.EXAMPLE.COM" });
  assert.equal(first, second);
  assert.ok(first.startsWith(`${COMMUNITY_ISSUE_BASE}?title=`));
  assert.ok(first.length <= MAX_COMMUNITY_ISSUE_URL_CHARS);
  const parsed = new URL(first);
  assert.equal(parsed.origin, "https://github.com");
  assert.equal(parsed.pathname, "/Joey-Red/drop-ads/issues/new");
  assert.deepEqual([...parsed.searchParams.keys()], ["title", "body"]);
});
