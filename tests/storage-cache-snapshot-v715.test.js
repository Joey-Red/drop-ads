import test from "node:test";
import assert from "node:assert/strict";
import { loadListCache, saveListCache } from "../src/core/storage.js";

function legacyCache() {
  return {
    "external-test": {
      block: [{ kind: "domain", value: "ads.example.com" }],
      allow: [],
      cosmeticHide: [],
      cosmeticAllow: [],
      nextRefreshAt: 123
    }
  };
}

test("loaded list cache is a deep immutable compact snapshot", async () => {
  const raw = legacyCache();
  const local = {
    async get(key) { return { [key]: raw }; },
    async set() {}
  };
  const cache = await loadListCache({ storage: { local } });
  const entry = cache["external-test"];

  assert.equal(Object.isFrozen(cache), true);
  assert.equal(Object.isFrozen(entry), true);
  assert.equal(Object.isFrozen(entry.b), true);
  assert.equal(Object.isFrozen(entry.b.d), true);
  assert.equal(Object.isFrozen(entry.a), true);
  assert.equal(Object.isFrozen(entry.c), true);
  assert.deepEqual(entry.b.d, ["ads.example.com"]);

  raw["external-test"].block[0].value = "mutated.example.com";
  assert.deepEqual(entry.b.d, ["ads.example.com"]);
});

test("saved list cache reaches storage as an immutable normalized snapshot", async () => {
  let captured;
  const local = {
    async get() { return {}; },
    async set(payload) { captured = payload.dropAdsListCache; }
  };
  await saveListCache({ storage: { local } }, legacyCache());
  assert.equal(Object.isFrozen(captured), true);
  assert.equal(Object.isFrozen(captured["external-test"]), true);
  assert.equal(Object.isFrozen(captured["external-test"].b.d), true);
});
