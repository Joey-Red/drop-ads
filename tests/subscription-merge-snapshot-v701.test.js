import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_COMMUNITY_SUBSCRIPTION,
  mergeCachedCosmeticRules,
  mergeCachedRules
} from "../src/core/subscriptions.js";

test("merged network policy is an immutable detached snapshot", () => {
  const merged = mergeCachedRules([DEFAULT_COMMUNITY_SUBSCRIPTION], {
    [DEFAULT_COMMUNITY_SUBSCRIPTION.id]: {
      block: [{ kind: "domain", value: "ads.example.com", resourceTypes: ["image", "script"] }],
      allow: [{ kind: "domain", value: "needed.example.com" }]
    }
  });

  assert.equal(Object.isFrozen(merged), true);
  assert.equal(Object.isFrozen(merged.block), true);
  assert.equal(Object.isFrozen(merged.allow), true);
  assert.equal(Object.isFrozen(merged.block[0]), true);
  assert.equal(Object.isFrozen(merged.block[0].resourceTypes), true);
  assert.throws(() => merged.block.push({}), TypeError);
  assert.throws(() => { merged.block[0].value = "changed.example"; }, TypeError);
});

test("merged cosmetic policy arrays and result object are immutable", () => {
  const merged = mergeCachedCosmeticRules([DEFAULT_COMMUNITY_SUBSCRIPTION], {
    [DEFAULT_COMMUNITY_SUBSCRIPTION.id]: {
      block: [],
      allow: [],
      cosmeticHide: [{ selector: ".sponsor", domains: ["example.com"] }],
      cosmeticAllow: [{ selector: ".needed", domains: ["example.com"] }]
    }
  });

  assert.equal(Object.isFrozen(merged), true);
  assert.equal(Object.isFrozen(merged.hide), true);
  assert.equal(Object.isFrozen(merged.allow), true);
  assert.equal(Object.isFrozen(merged.hide[0]), true);
  assert.throws(() => merged.hide.pop(), TypeError);
});
