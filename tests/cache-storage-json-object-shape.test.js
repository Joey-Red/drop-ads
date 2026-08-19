import assert from "node:assert/strict";
import test from "node:test";

import { serializedListCacheBytes } from "../src/core/cache-storage.js";

function nested(value) {
  return { community: { nested: value } };
}

for (const [name, handler] of [
  ["prototype", { getPrototypeOf() { throw new Error("prototype trap"); } }],
  ["ownKeys", { ownKeys() { throw new Error("ownKeys trap"); } }],
  ["descriptor", { getOwnPropertyDescriptor(target, key) { if (key === "value") throw new Error("descriptor trap"); return Reflect.getOwnPropertyDescriptor(target, key); } }]
]) {
  test(`nested cache objects contain ${name} traps`, () => {
    const proxied = new Proxy({ value: 1 }, handler);
    assert.throws(() => serializedListCacheBytes(nested(proxied)), /plain JSON object|inspectable|enumerable data field/i);
  });
}

test("nested cache objects do not execute getters", () => {
  let calls = 0;
  const value = {};
  Object.defineProperty(value, "secret", { enumerable: true, get() { calls += 1; return "unsafe"; } });
  assert.throws(() => serializedListCacheBytes(nested(value)), /enumerable data field/i);
  assert.equal(calls, 0);
});

test("nested cache objects accept null-prototype JSON data", () => {
  const value = Object.create(null);
  Object.defineProperty(value, "answer", { enumerable: true, value: 42 });
  assert.ok(serializedListCacheBytes(nested(value)) > 0);
});
