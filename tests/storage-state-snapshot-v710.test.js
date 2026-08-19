import test from "node:test";
import assert from "node:assert/strict";
import { normalizePersistedState } from "../src/core/storage.js";

test("normalized persisted state is a deep immutable policy snapshot", () => {
  const inputRule = { kind: "domain", value: "ads.example.com", resourceTypes: ["script", "image"] };
  const stored = {
    enabled: true,
    personalBlock: [inputRule],
    disabledSites: ["Example.COM"],
    cookieAllowSites: ["cookies.example.com"]
  };
  const state = normalizePersistedState(stored);

  assert.equal(Object.isFrozen(state), true);
  for (const key of [
    "personalBlock", "personalAllow", "personalCosmeticHide", "personalCosmeticAllow",
    "disabledSites", "cookieAllowSites", "subscriptions"
  ]) assert.equal(Object.isFrozen(state[key]), true, `${key} should be frozen`);

  assert.equal(Object.isFrozen(state.personalBlock[0]), true);
  assert.equal(Object.isFrozen(state.personalBlock[0].resourceTypes), true);
  assert.deepEqual(state.personalBlock[0].resourceTypes, ["image", "script"]);
  assert.deepEqual(state.disabledSites, ["example.com"]);

  inputRule.value = "mutated.example.com";
  inputRule.resourceTypes[0] = "media";
  stored.disabledSites[0] = "mutated.example.com";
  assert.equal(state.personalBlock[0].value, "ads.example.com");
  assert.deepEqual(state.personalBlock[0].resourceTypes, ["image", "script"]);
  assert.deepEqual(state.disabledSites, ["example.com"]);
});
