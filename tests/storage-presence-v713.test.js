import test from "node:test";
import assert from "node:assert/strict";
import { initializeState, loadState } from "../src/core/storage.js";

function apiWithStored(value, present = true) {
  const local = {
    async get(key) {
      return present ? { [key]: value } : {};
    },
    async set() {}
  };
  return { storage: { local } };
}

test("only an absent state field is treated as fresh state", async () => {
  const state = await loadState(apiWithStored(undefined, false));
  assert.equal(state.enabled, true);
  assert.equal(state.cookieMode, "third-party");
});

for (const malformed of [null, false, 0, ""]) {
  test(`present malformed state ${JSON.stringify(malformed)} fails closed on load`, async () => {
    await assert.rejects(loadState(apiWithStored(malformed)), /plain object/);
  });

  test(`present malformed state ${JSON.stringify(malformed)} fails closed on initialization`, async () => {
    await assert.rejects(initializeState(apiWithStored(malformed)), /plain object/);
  });
}
