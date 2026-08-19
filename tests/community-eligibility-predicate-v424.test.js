import test from "node:test";
import assert from "node:assert/strict";

import { isCommunityCandidateEligible } from "../src/core/community.js";

test("M424 community eligibility is true only for valid unscoped domain and exact URL rules", () => {
  assert.equal(isCommunityCandidateEligible({ kind: "domain", value: "example.com" }), true);
  assert.equal(isCommunityCandidateEligible({ kind: "url", value: "https://example.com/ad.js" }), true);
  assert.equal(isCommunityCandidateEligible({ kind: "pattern", value: "||example.com^" }), false);
  assert.equal(isCommunityCandidateEligible({ kind: "domain", value: "example.com", resourceTypes: ["script"] }), false);
});

test("M424 malformed direct candidates fail closed without custom conversion", () => {
  let conversions = 0;
  const hostile = {
    kind: "domain",
    value: {
      toString() {
        conversions += 1;
        return "example.com";
      }
    }
  };
  assert.equal(isCommunityCandidateEligible(hostile), false);
  assert.equal(conversions, 0);
  assert.equal(isCommunityCandidateEligible(null), false);
  assert.equal(isCommunityCandidateEligible([]), false);
});

test("M424 revoked and accessor-backed candidates return false rather than throw", () => {
  const { proxy, revoke } = Proxy.revocable({ kind: "domain", value: "example.com" }, {});
  revoke();
  assert.doesNotThrow(() => assert.equal(isCommunityCandidateEligible(proxy), false));

  let getterReads = 0;
  const accessor = {};
  Object.defineProperty(accessor, "kind", {
    enumerable: true,
    get() {
      getterReads += 1;
      return "domain";
    }
  });
  Object.defineProperty(accessor, "value", {
    enumerable: true,
    value: "example.com"
  });
  assert.equal(isCommunityCandidateEligible(accessor), false);
  assert.equal(getterReads, 0);
});
