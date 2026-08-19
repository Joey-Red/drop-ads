import test from "node:test";
import assert from "node:assert/strict";
import { buildCommunityIssueUrl, communityCandidateFromRule } from "../src/core/community.js";

test("exact URL community submissions are reduced to a domain", () => {
  assert.deepEqual(communityCandidateFromRule({
    kind: "url",
    value: "https://ads.example.com/render?user_token=secret#private"
  }), { kind: "domain", value: "ads.example.com" });
});

test("prefilled GitHub issue contains no source page or original URL query", () => {
  const issue = new URL(buildCommunityIssueUrl({
    kind: "url",
    value: "https://ads.example.com/render?user_token=secret"
  }));
  const body = issue.searchParams.get("body");
  assert.match(body, /block domain ads\.example\.com/);
  assert.equal(body.includes("user_token"), false);
  assert.equal(body.includes("/render"), false);
});

test("local/private network candidates are rejected before a GitHub URL is prepared", () => {
  for (const rule of [
    { kind: "domain", value: "localhost" },
    { kind: "domain", value: "printer.local" },
    { kind: "domain", value: "service.home.arpa" },
    { kind: "domain", value: "192.168.50.20" },
    { kind: "url", value: "http://127.0.0.1/private" },
    { kind: "url", value: "http://10.1.2.3/private" },
    { kind: "url", value: "http://[::1]/private" },
    { kind: "url", value: "http://[fd00::42]/private" }
  ]) {
    assert.throws(() => communityCandidateFromRule(rule), /Local\/private network targets/);
    assert.throws(() => buildCommunityIssueUrl(rule), /Local\/private network targets/);
  }
});

test("ordinary public domains remain eligible for community preparation", () => {
  assert.deepEqual(
    communityCandidateFromRule({ kind: "domain", value: "tracker.example.com" }),
    { kind: "domain", value: "tracker.example.com" }
  );
  assert.match(buildCommunityIssueUrl({ kind: "domain", value: "tracker.example.com" }), /github\.com/);
});

test("pattern rules are not submitted through the simple community flow", () => {
  assert.throws(() => communityCandidateFromRule({ kind: "pattern", value: "||example.com/ads/*" }));
});
