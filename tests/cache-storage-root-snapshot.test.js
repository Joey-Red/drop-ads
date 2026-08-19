import assert from "node:assert/strict";
import test from "node:test";

import { snapshotRawListCache } from "../src/core/cache-storage.js";

function cacheProxy(target, onGet) {
  return new Proxy(target, {
    get(object, key, receiver) {
      onGet(key);
      return Reflect.get(object, key, receiver);
    }
  });
}

test("raw cache snapshot never performs normal property gets", () => {
  const seen = [];
  const entry = { version: 5 };
  const cache = cacheProxy({ community: entry }, (key) => seen.push(key));
  const snapshot = snapshotRawListCache(cache);
  assert.equal(seen.length, 0);
  assert.equal(Object.getPrototypeOf(snapshot), null);
  assert.equal(snapshot.community, entry);
});

test("raw cache snapshot is detached from later root mutation", () => {
  const cache = { community: { version: 5 } };
  const snapshot = snapshotRawListCache(cache);
  cache.community = { version: 4 };
  cache.other = {};
  assert.equal(snapshot.community.version, 5);
  assert.equal(Object.hasOwn(snapshot, "other"), false);
});

test("raw cache snapshot accepts null-prototype roots", () => {
  const cache = Object.create(null);
  Object.defineProperty(cache, "community", { enumerable: true, value: { version: 5 } });
  const snapshot = snapshotRawListCache(cache);
  assert.equal(snapshot.community.version, 5);
});
