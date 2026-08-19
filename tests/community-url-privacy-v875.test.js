import test from "node:test";
import assert from "node:assert/strict";
import { buildCommunityIssueUrl, communityCandidateFromRule } from "../src/core/community.js";

test("exact URL community preparation emits hostname only", () => {
  const original = "https://tracker.example.com:8443/account/42/ad.js?session=very-secret&campaign=private#member";
  assert.deepEqual(communityCandidateFromRule({ kind: "url", value: original }), { kind: "domain", value: "tracker.example.com" });
  const prepared = decodeURIComponent(buildCommunityIssueUrl({ kind: "url", value: original }));
  for (const secret of [":8443", "/account/42", "session=very-secret", "campaign=private", "#member"]) {
    assert.equal(prepared.includes(secret), false);
  }
  assert.match(prepared, /block domain tracker\.example\.com/);
});

test("credential-bearing exact URLs are rejected rather than redacted into a submission", () => {
  assert.throws(() => buildCommunityIssueUrl({ kind: "url", value: "https://user:pass@tracker.example.com/ad" }), /credentials/);
});
