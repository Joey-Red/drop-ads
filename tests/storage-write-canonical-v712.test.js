import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_STATE, saveState } from "../src/core/storage.js";
import { currentStateFixture } from "./helpers/current-state-fixture.js";

function writableState(overrides = {}) {
  return currentStateFixture({
    subscriptions: [...DEFAULT_STATE.subscriptions],
    ...overrides
  });
}

test("state writes use a canonical detached immutable snapshot", async () => {
  const rule = { kind: "domain", value: "Ads.Example.com", resourceTypes: ["script", "image"] };
  const state = writableState({ personalBlock: [rule], disabledSites: ["Example.COM"] });
  let captured;
  const local = {
    async get() { return {}; },
    async set(payload) { captured = payload.dropAdsState; }
  };

  await saveState({ storage: { local } }, state);
  assert.equal(Object.isFrozen(captured), true);
  assert.equal(Object.isFrozen(captured.personalBlock), true);
  assert.equal(Object.isFrozen(captured.personalBlock[0]), true);
  assert.equal(Object.isFrozen(captured.personalBlock[0].resourceTypes), true);
  assert.deepEqual(captured.personalBlock[0], {
    kind: "domain",
    value: "ads.example.com",
    resourceTypes: ["image", "script"]
  });
  assert.deepEqual(captured.disabledSites, ["example.com"]);

  rule.value = "mutated.example.com";
  rule.resourceTypes[0] = "media";
  state.disabledSites[0] = "mutated.example.com";
  assert.equal(captured.personalBlock[0].value, "ads.example.com");
  assert.deepEqual(captured.personalBlock[0].resourceTypes, ["image", "script"]);
  assert.deepEqual(captured.disabledSites, ["example.com"]);
});
