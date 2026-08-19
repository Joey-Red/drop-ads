import assert from "node:assert/strict";
import test from "node:test";
import {
  COMMUNITY_ISSUE_BASE,
  MAX_COMMUNITY_ISSUE_URL_CHARS,
  serializeCommunityIssueUrl
} from "../src/core/community-issue.js";

test("M872 serializes bounded community issue fields onto the fixed GitHub base", () => {
  const url = serializeCommunityIssueUrl({ title: "[Community block] ads.example.com", body: "block domain ads.example.com" });
  assert.ok(url.startsWith(`${COMMUNITY_ISSUE_BASE}?`));
  assert.ok(url.length <= MAX_COMMUNITY_ISSUE_URL_CHARS);
  const parsed = new URL(url);
  assert.equal(parsed.origin, "https://github.com");
  assert.equal(parsed.pathname, "/Joey-Red/drop-ads/issues/new");
  assert.equal(parsed.username, "");
  assert.equal(parsed.password, "");
  assert.equal(parsed.hash, "");
  assert.equal(parsed.searchParams.get("title"), "[Community block] ads.example.com");
  assert.equal(parsed.searchParams.get("body"), "block domain ads.example.com");
});

test("M872 rejects malformed or accessor-backed issue fields before URL construction", () => {
  assert.throws(() => serializeCommunityIssueUrl({ title: "ok", body: "ok", token: "never" }));
  let reads = 0;
  const fields = { body: "ok" };
  Object.defineProperty(fields, "title", { enumerable: true, get() { reads += 1; return "ok"; } });
  assert.throws(() => serializeCommunityIssueUrl(fields));
  assert.equal(reads, 0);
});
