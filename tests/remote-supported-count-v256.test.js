import test from "node:test";
import assert from "node:assert/strict";

import { assertRemoteSupportedRuleCount } from "../src/core/list-limits.js";

test("remote supported-rule counting uses detached policy fields", () => {
  const parsed = Object.assign(Object.create(null), {
    block: [{ kind: "domain", value: "ads.example" }],
    allow: [],
    unsupportedCount: 2
  });
  const cosmetic = Object.assign(Object.create(null), {
    hide: [{ selector: ".ad" }],
    allow: [],
    unsupportedCount: 1
  });
  assert.equal(assertRemoteSupportedRuleCount(parsed, cosmetic, 4), 2);
});

test("remote supported-rule input getters and normal get traps are never executed", () => {
  let getterRuns = 0;
  const parsed = { allow: [] };
  Object.defineProperty(parsed, "block", {
    enumerable: true,
    get() {
      getterRuns += 1;
      return [];
    }
  });
  assert.throws(() => assertRemoteSupportedRuleCount(parsed, { hide: [], allow: [] }, 4), /data field/);
  assert.equal(getterRuns, 0);

  let getRuns = 0;
  const cosmetic = new Proxy({ hide: [], allow: [], unsupportedCount: 0 }, {
    get(target, key, receiver) {
      getRuns += 1;
      return Reflect.get(target, key, receiver);
    }
  });
  assert.equal(assertRemoteSupportedRuleCount({ block: [], allow: [] }, cosmetic, 4), 0);
  assert.equal(getRuns, 0);
});

test("remote supported-rule field descriptor changes fail closed", () => {
  let reads = 0;
  const parsed = new Proxy({ block: [], allow: [] }, {
    getOwnPropertyDescriptor(target, key) {
      if (key === "block") {
        reads += 1;
        if (reads > 1) throw new Error("changed");
      }
      return Reflect.getOwnPropertyDescriptor(target, key);
    }
  });
  assert.throws(() => assertRemoteSupportedRuleCount(parsed, { hide: [], allow: [] }, 4), /data field|plain object/);
});

test("remote supported-rule combined count still enforces maxRules", () => {
  assert.equal(assertRemoteSupportedRuleCount(
    { block: [1], allow: [2] },
    { hide: [3], allow: [4] },
    4
  ), 4);
  assert.throws(() => assertRemoteSupportedRuleCount(
    { block: [1, 2], allow: [3] },
    { hide: [4], allow: [5] },
    4
  ), /too many supported rules|length/);
  assert.throws(() => assertRemoteSupportedRuleCount(
    { block: [], allow: [], unsupportedCount: Number.MAX_SAFE_INTEGER + 1 },
    { hide: [], allow: [] },
    4
  ), /non-negative safe integer/);
});
