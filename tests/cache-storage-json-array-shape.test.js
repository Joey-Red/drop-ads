import assert from "node:assert/strict";
import test from "node:test";

import { serializedListCacheBytes } from "../src/core/cache-storage.js";

function cacheWith(value) {
  return { community: { nested: value } };
}

test("cache JSON arrays reject custom prototypes", () => {
  class FancyArray extends Array {}
  assert.throws(() => serializedListCacheBytes(cacheWith(new FancyArray("a"))), /normal dense array/i);
});

test("cache JSON arrays contain metadata proxy traps", () => {
  for (const handler of [
    { getPrototypeOf() { throw new Error("prototype trap"); } },
    { ownKeys() { throw new Error("ownKeys trap"); } },
    { getOwnPropertyDescriptor(target, key) { if (key === "length") throw new Error("length trap"); return Reflect.getOwnPropertyDescriptor(target, key); } }
  ]) {
    const proxied = new Proxy(["a"], handler);
    assert.throws(() => serializedListCacheBytes(cacheWith(proxied)), /normal dense array|inspectable/i);
  }
});

test("cache JSON arrays do not execute accessor indices", () => {
  let calls = 0;
  const array = ["a"];
  Object.defineProperty(array, "0", { enumerable: true, get() { calls += 1; return "unsafe"; } });
  assert.throws(() => serializedListCacheBytes(cacheWith(array)), /enumerable data entries/i);
  assert.equal(calls, 0);
});

test("cache JSON arrays still accept ordinary dense arrays", () => {
  assert.ok(serializedListCacheBytes(cacheWith(["a", 1, true, null])) > 0);
});
