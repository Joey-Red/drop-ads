import test from "node:test";
import assert from "node:assert/strict";
import {
  PERSONAL_POLICY_RULE_RESERVE,
  compileManagedRules,
  personalPolicyReserveForBudget
} from "../src/core/rules.js";

function patternRules(count, prefix) {
  return Array.from({ length: count }, (_, index) => ({ kind: "pattern", value: `||${prefix}${index}.example^` }));
}

function state(overrides = {}) {
  return {
    communityBlock: [],
    communityAllow: [],
    personalBlock: [],
    personalAllow: [],
    disabledSites: [],
    cookieAllowSites: [],
    cookieMode: "off",
    ...overrides
  };
}

test("personal reserve is deterministic and capped at 256 slots", () => {
  assert.equal(personalPolicyReserveForBudget(5_000), PERSONAL_POLICY_RULE_RESERVE);
  assert.equal(personalPolicyReserveForBudget(30_000), PERSONAL_POLICY_RULE_RESERVE);
  assert.equal(personalPolicyReserveForBudget(100), 10);
  assert.equal(personalPolicyReserveForBudget(2), 1);
  assert.equal(personalPolicyReserveForBudget(Number.POSITIVE_INFINITY), 0);
});

test("shared policy fits exactly inside capacity remaining after the personal reserve", () => {
  const maxDynamicRules = 100;
  const sharedBudget = 90;
  assert.doesNotThrow(() => compileManagedRules(state({ communityBlock: patternRules(sharedBudget, "shared-") }), { maxDynamicRules }));
  assert.throws(
    () => compileManagedRules(state({ communityBlock: patternRules(sharedBudget + 1, "shared-") }), { maxDynamicRules }),
    /Shared dynamic rule budget exceeded/
  );
});

test("actual personal usage above the reserve reduces shared capacity instead of being displaced", () => {
  const maxDynamicRules = 100;
  const personalBlock = patternRules(30, "personal-");
  assert.doesNotThrow(() => compileManagedRules(state({ personalBlock, communityBlock: patternRules(70, "shared-") }), { maxDynamicRules }));
  assert.throws(
    () => compileManagedRules(state({ personalBlock, communityBlock: patternRules(71, "shared-") }), { maxDynamicRules }),
    /Shared dynamic rule budget exceeded/
  );
});

test("cookie protection consumes actual personal/recovery capacity", () => {
  const maxDynamicRules = 10;
  assert.doesNotThrow(() => compileManagedRules(state({ cookieMode: "third-party", communityBlock: patternRules(9, "shared-") }), { maxDynamicRules }));
  assert.throws(
    () => compileManagedRules(state({ cookieMode: "third-party", communityBlock: patternRules(10, "shared-") }), { maxDynamicRules }),
    /Shared dynamic rule budget exceeded/
  );
});

test("total browser capacity still fails when personal policy alone cannot fit", () => {
  assert.throws(
    () => compileManagedRules(state({ personalBlock: patternRules(11, "personal-") }), { maxDynamicRules: 10 }),
    /Dynamic rule budget exceeded/
  );
});

test("shared policy is rejected whole rather than truncated", () => {
  const rules = patternRules(11, "shared-");
  assert.throws(() => compileManagedRules(state({ communityBlock: rules }), { maxDynamicRules: 10 }), /Shared dynamic rule budget exceeded/);
  assert.equal(rules.length, 11);
});
