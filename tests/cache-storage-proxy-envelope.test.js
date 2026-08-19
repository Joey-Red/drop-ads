import assert from "node:assert/strict";
import test from "node:test";

import { assertRawListCacheBound } from "../src/core/cache-storage.js";

for (const [name, handler] of [
  ["prototype", { getPrototypeOf() { throw new Error("prototype trap"); } }],
  ["ownKeys", { ownKeys() { throw new Error("ownKeys trap"); } }],
  ["descriptor", { getOwnPropertyDescriptor(target, key) { if (key === "community") throw new Error("descriptor trap"); return Reflect.getOwnPropertyDescriptor(target, key); } }]
]) {
  test(`raw list cache contains ${name} proxy traps`, () => {
    const target = { community: { version: 5 } };
    assert.throws(() => assertRawListCacheBound(new Proxy(target, handler)), /inspectable|plain|entries/i);
  });
}

test("raw list cache does not execute entry getters", () => {
  let calls = 0;
  const cache = {};
  Object.defineProperty(cache, "community", { enumerable: true, get() { calls += 1; return {}; } });
  assert.throws(() => assertRawListCacheBound(cache), /data fields/i);
  assert.equal(calls, 0);
});

test("raw list cache accepts null-prototype data envelopes", () => {
  const cache = Object.create(null);
  Object.defineProperty(cache, "community", { enumerable: true, value: { version: 5 } });
  assert.equal(assertRawListCacheBound(cache), cache);
});
