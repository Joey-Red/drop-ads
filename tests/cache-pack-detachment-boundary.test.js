import assert from "node:assert/strict";
import test from "node:test";

import { decodeCacheEntry } from "../src/core/cache-codec.js";

function changingPack() {
  let descriptorReads = 0;
  const target = { d: ["example.com"] };
  const proxy = new Proxy(target, {
    getOwnPropertyDescriptor(object, key) {
      if (key === "d") {
        descriptorReads += 1;
        return {
          configurable: true,
          enumerable: true,
          writable: true,
          value: descriptorReads === 1 ? ["example.com"] : []
        };
      }
      return Reflect.getOwnPropertyDescriptor(object, key);
    }
  });
  return { proxy, reads: () => descriptorReads };
}

test("cache entry admission detaches compact network packs before later decode work", () => {
  const block = changingPack();
  const decoded = decodeCacheEntry({
    v: 4,
    b: block.proxy,
    a: {},
    c: [1, 0, 0, 0],
    n: 0
  });

  assert.deepEqual(decoded, {
    block: [{ kind: "domain", value: "example.com" }],
    allow: [],
    cosmeticHide: [],
    cosmeticAllow: [],
    nextRefreshAt: 0
  });
  assert.equal(block.reads(), 1);
});

test("accessor compact pack fields remain rejected without executing the getter", () => {
  let getterReads = 0;
  const pack = {};
  Object.defineProperty(pack, "d", {
    enumerable: true,
    get() {
      getterReads += 1;
      return ["example.com"];
    }
  });

  assert.equal(decodeCacheEntry({ v: 4, b: pack, a: {}, c: [1, 0, 0, 0], n: 0 }), null);
  assert.equal(getterReads, 0);
});
