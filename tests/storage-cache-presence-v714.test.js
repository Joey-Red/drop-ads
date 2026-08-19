import test from "node:test";
import assert from "node:assert/strict";
import { loadListCache } from "../src/core/storage.js";

function apiWithCache(value, present = true) {
  const local = {
    async get(key) {
      return present ? { [key]: value } : {};
    },
    async set() {}
  };
  return { storage: { local } };
}

test("absent list cache becomes an empty cache", async () => {
  const cache = await loadListCache(apiWithCache(undefined, false));
  assert.deepEqual(Object.keys(cache), []);
});

for (const malformed of [null, false, 0, ""]) {
  test(`present malformed list cache ${JSON.stringify(malformed)} fails closed`, async () => {
    await assert.rejects(loadListCache(apiWithCache(malformed)), /list cache|object/i);
  });
}
