import test from "node:test";
import assert from "node:assert/strict";

import { normalizeCosmeticRule } from "../src/core/cosmetic-rules.js";

test("cosmetic rule normalization accepts detached ordinary and null-prototype data", () => {
  assert.deepEqual(normalizeCosmeticRule({ selector: ".ad", domains: ["example.com"] }), {
    selector: ".ad",
    domains: ["example.com"]
  });
  const rule = Object.assign(Object.create(null), {
    selector: "#banner",
    excludedDomains: ["sub.example.com"]
  });
  assert.deepEqual(normalizeCosmeticRule(rule), {
    selector: "#banner",
    excludedDomains: ["sub.example.com"]
  });
});

test("cosmetic rule accessors and normal get traps are never executed", () => {
  let getterRuns = 0;
  const accessor = { domains: [] };
  Object.defineProperty(accessor, "selector", {
    enumerable: true,
    get() {
      getterRuns += 1;
      return ".ad";
    }
  });
  assert.throws(() => normalizeCosmeticRule(accessor), /data field/);
  assert.equal(getterRuns, 0);

  let getRuns = 0;
  const proxy = new Proxy({ selector: ".ad", domains: ["example.com"] }, {
    get(target, key, receiver) {
      getRuns += 1;
      return Reflect.get(target, key, receiver);
    }
  });
  assert.equal(normalizeCosmeticRule(proxy).selector, ".ad");
  assert.equal(getRuns, 0);
});

test("cosmetic rule domain array accessors and descriptor changes fail closed", () => {
  let domainGetterRuns = 0;
  const domains = [];
  Object.defineProperty(domains, "0", {
    enumerable: true,
    configurable: true,
    get() {
      domainGetterRuns += 1;
      return "example.com";
    }
  });
  domains.length = 1;
  assert.throws(() => normalizeCosmeticRule({ selector: ".ad", domains }), /enumerable data entries/);
  assert.equal(domainGetterRuns, 0);

  let reads = 0;
  const proxy = new Proxy({ selector: ".ad" }, {
    getOwnPropertyDescriptor(target, key) {
      if (key === "selector") {
        reads += 1;
        if (reads > 1) throw new Error("changed");
      }
      return Reflect.getOwnPropertyDescriptor(target, key);
    }
  });
  assert.throws(() => normalizeCosmeticRule(proxy), /data field|plain object/);
});
