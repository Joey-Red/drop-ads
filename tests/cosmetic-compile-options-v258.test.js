import test from "node:test";
import assert from "node:assert/strict";

import { compileCosmeticSelectors } from "../src/core/cosmetic-rules.js";

const hide = [
  { selector: ".ad" },
  { selector: ".sponsor" }
];

test("single-tier cosmetic compile preserves defaults, allow precedence, and lower limits", () => {
  assert.deepEqual(compileCosmeticSelectors({ hostname: "example.com", hide }), [".ad", ".sponsor"]);
  assert.deepEqual(compileCosmeticSelectors({
    hostname: "example.com",
    hide,
    allow: [{ selector: ".ad" }]
  }), [".sponsor"]);
  assert.deepEqual(compileCosmeticSelectors({ hostname: "example.com", hide, maxSelectors: 1 }), [".ad"]);
  assert.deepEqual(compileCosmeticSelectors({ hostname: "example.com", hide, maxSelectors: 0 }), []);
});

test("single-tier cosmetic compile option getters and normal get traps are never executed", () => {
  let getterRuns = 0;
  const accessor = { hide };
  Object.defineProperty(accessor, "hostname", {
    enumerable: true,
    get() {
      getterRuns += 1;
      return "example.com";
    }
  });
  assert.throws(() => compileCosmeticSelectors(accessor), /data field/);
  assert.equal(getterRuns, 0);

  let getRuns = 0;
  const proxy = new Proxy({ hostname: "example.com", hide, maxSelectors: 1 }, {
    get(target, key, receiver) {
      getRuns += 1;
      return Reflect.get(target, key, receiver);
    }
  });
  assert.deepEqual(compileCosmeticSelectors(proxy), [".ad"]);
  assert.equal(getRuns, 0);
});

test("single-tier cosmetic compile list and limit descriptor changes fail closed", () => {
  const optionWithGetter = { hostname: "example.com" };
  Object.defineProperty(optionWithGetter, "maxBytes", {
    enumerable: true,
    get() { throw new Error("must not run"); }
  });
  assert.throws(() => compileCosmeticSelectors(optionWithGetter), /data field/);

  let reads = 0;
  const proxy = new Proxy({ hostname: "example.com", hide }, {
    getOwnPropertyDescriptor(target, key) {
      if (key === "hide") {
        reads += 1;
        if (reads > 1) throw new Error("changed");
      }
      return Reflect.getOwnPropertyDescriptor(target, key);
    }
  });
  assert.throws(() => compileCosmeticSelectors(proxy), /data field|plain object/);
});
