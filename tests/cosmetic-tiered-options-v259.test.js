import test from "node:test";
import assert from "node:assert/strict";

import { compileTieredCosmeticSelectors } from "../src/core/cosmetic-rules.js";

test("tiered cosmetic compile preserves reviewed precedence and limits", () => {
  const result = compileTieredCosmeticSelectors({
    hostname: "example.com",
    personalAllow: [{ selector: ".allow-personal" }],
    personalHide: [{ selector: ".allow-personal" }, { selector: ".personal" }],
    sharedAllow: [{ selector: ".allow-shared" }],
    sharedHide: [
      { selector: ".allow-personal" },
      { selector: ".personal" },
      { selector: ".allow-shared" },
      { selector: ".shared" }
    ]
  });
  assert.deepEqual(result, [".personal", ".shared"]);
  assert.deepEqual(compileTieredCosmeticSelectors({
    hostname: "example.com",
    personalHide: [{ selector: ".a" }, { selector: ".b" }],
    maxSelectors: 1
  }), [".a"]);
});

test("tiered cosmetic compile option getters and normal get traps are never executed", () => {
  let getterRuns = 0;
  const accessor = { hostname: "example.com" };
  Object.defineProperty(accessor, "sharedHide", {
    enumerable: true,
    get() {
      getterRuns += 1;
      return [{ selector: ".ad" }];
    }
  });
  assert.throws(() => compileTieredCosmeticSelectors(accessor), /data field/);
  assert.equal(getterRuns, 0);

  let getRuns = 0;
  const proxy = new Proxy({
    hostname: "example.com",
    sharedHide: [{ selector: ".ad" }]
  }, {
    get(target, key, receiver) {
      getRuns += 1;
      return Reflect.get(target, key, receiver);
    }
  });
  assert.deepEqual(compileTieredCosmeticSelectors(proxy), [".ad"]);
  assert.equal(getRuns, 0);
});

test("tiered cosmetic compile descriptor changes fail closed", () => {
  let reads = 0;
  const proxy = new Proxy({ hostname: "example.com", maxBytes: 100 }, {
    getOwnPropertyDescriptor(target, key) {
      if (key === "maxBytes") {
        reads += 1;
        if (reads > 1) throw new Error("changed");
      }
      return Reflect.getOwnPropertyDescriptor(target, key);
    }
  });
  assert.throws(() => compileTieredCosmeticSelectors(proxy), /data field|plain object/);
});
