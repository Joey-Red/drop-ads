import test from "node:test";
import assert from "node:assert/strict";
import { communityCandidateFromRule, isCommunityCandidateEligible } from "../src/core/community.js";

test("private and loopback domains stay locally representable but cannot become community candidates", () => {
  for (const value of ["localhost", "127.0.0.1", "10.0.0.8", "192.168.1.20"]) {
    assert.equal(isCommunityCandidateEligible({ kind: "domain", value }), true);
    assert.throws(() => communityCandidateFromRule({ kind: "domain", value }), /Local\/private network targets/);
  }
});

test("private exact URLs fail public admission before domain-only community output", () => {
  for (const value of ["http://127.0.0.1/ad.js", "http://10.0.0.8/ad.js", "http://192.168.1.20/ad.js"]) {
    assert.equal(isCommunityCandidateEligible({ kind: "url", value }), true);
    assert.throws(() => communityCandidateFromRule({ kind: "url", value }), /Local\/private network targets/);
  }
});

test("public exact URL emits domain only", () => {
  assert.deepEqual(
    communityCandidateFromRule({ kind: "url", value: "https://ads.example.com/a.js?campaign=secret" }),
    { kind: "domain", value: "ads.example.com" }
  );
});
