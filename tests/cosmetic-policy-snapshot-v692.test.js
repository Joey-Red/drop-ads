import test from "node:test";
import assert from "node:assert/strict";
import { buildCosmeticPolicy } from "../src/core/cosmetic-runtime.js";

function baseState(overrides = {}) {
  return {
    enabled: true,
    disabledSites: [],
    subscriptions: [],
    personalCosmeticHide: [],
    personalCosmeticAllow: [],
    ...overrides
  };
}

test("enabled cosmetic policy result is immutable", () => {
  const policy = buildCosmeticPolicy({
    hostname: "example.com",
    state: baseState({ personalCosmeticHide: [{ selector: ".sponsor" }] }),
    session: { disabledSites: [] },
    cache: {}
  });
  assert.deepEqual(policy, {
    enabled: true,
    selectorCount: 1,
    stylesheet: ".sponsor { display: none !important; }\n"
  });
  assert.equal(Object.isFrozen(policy), true);
  assert.throws(() => { policy.selectorCount = 99; }, TypeError);
});

test("disabled cosmetic policy result is immutable", () => {
  const policy = buildCosmeticPolicy({
    hostname: "example.com",
    state: baseState({ enabled: false }),
    session: { disabledSites: [] },
    cache: {}
  });
  assert.deepEqual(policy, { enabled: false, selectorCount: 0, stylesheet: "" });
  assert.equal(Object.isFrozen(policy), true);
  assert.throws(() => { policy.enabled = true; }, TypeError);
});
