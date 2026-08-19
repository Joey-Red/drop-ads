import test from "node:test";
import assert from "node:assert/strict";
import { compileManagedRules, personalPolicyReserveForBudget } from "../src/core/rules.js";

function emptyState() {
  return {
    cookieMode: "off",
    disabledSites: [],
    cookieAllowSites: [],
    communityBlock: [],
    communityAllow: [],
    personalBlock: [],
    personalAllow: []
  };
}

test("compileManagedRules rejects accessor budget options without executing getters", () => {
  let getterCalls = 0;
  const options = {};
  Object.defineProperty(options, "maxDynamicRules", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return 1000;
    }
  });
  assert.throws(() => compileManagedRules(emptyState(), options), /data field/);
  assert.equal(getterCalls, 0);
});

test("invalid managed-rule options fail before candidate state reads", () => {
  let stateReads = 0;
  const state = {};
  Object.defineProperty(state, "disabledSites", {
    enumerable: true,
    get() {
      stateReads += 1;
      return [];
    }
  });
  assert.throws(() => compileManagedRules(state, { unknown: true }), /unsupported field/);
  assert.equal(stateReads, 0);
});

test("finite dynamic budgets require non-negative safe integers", () => {
  for (const value of ["1000", 1.5, Number.NaN, -1, Number.MAX_SAFE_INTEGER + 1, new Number(1000)]) {
    assert.throws(() => compileManagedRules(emptyState(), { maxDynamicRules: value }), /non-negative safe integer or Infinity/);
  }
});

test("budget validation never invokes conversion hooks", () => {
  let conversions = 0;
  const value = {
    valueOf() { conversions += 1; return 1000; },
    toString() { conversions += 1; return "1000"; }
  };
  assert.throws(() => personalPolicyReserveForBudget(value), /non-negative safe integer or Infinity/);
  assert.equal(conversions, 0);
});

test("zero and Infinity retain reviewed budget semantics", () => {
  assert.equal(personalPolicyReserveForBudget(0), 0);
  assert.equal(personalPolicyReserveForBudget(Number.POSITIVE_INFINITY), 0);
  assert.deepEqual(compileManagedRules(emptyState(), { maxDynamicRules: 0 }), []);
  assert.deepEqual(compileManagedRules(emptyState()), []);
});
