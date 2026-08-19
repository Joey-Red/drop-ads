import test from "node:test";
import assert from "node:assert/strict";

import { communityCandidateFromRule, isCommunityCandidateEligible } from "../src/core/community.js";

test("M424 community eligibility returns false for malformed direct candidates", () => {
  assert.equal(isCommunityCandidateEligible(null), false);
  assert.equal(isCommunityCandidateEligible({}), false);
  assert.equal(isCommunityCandidateEligible({ kind: "pattern", value: "ads.example" }), false);
  assert.equal(isCommunityCandidateEligible({ kind: "domain", value: "ads.example", resourceTypes: ["script"] }), false);

  const { proxy, revoke } = Proxy.revocable({ kind: "domain", value: "ads.example" }, {});
  revoke();
  assert.doesNotThrow(() => assert.equal(isCommunityCandidateEligible(proxy), false));
});

test("M424 valid unscoped domain and exact URL candidates remain eligible", () => {
  assert.equal(isCommunityCandidateEligible({ kind: "domain", value: "ads.example" }), true);
  assert.equal(isCommunityCandidateEligible({ kind: "url", value: "https://ads.example/pixel" }), true);
});

test("M424 command-style community normalization still rejects invalid candidates", () => {
  assert.throws(() => communityCandidateFromRule({}), /rule/i);
});
