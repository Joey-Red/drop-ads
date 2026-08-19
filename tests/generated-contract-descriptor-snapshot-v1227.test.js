import test from "node:test";
import assert from "node:assert/strict";
import { snapshotGeneratedContractStringArray } from "../tools/generated-extension-contract.mjs";

test("M1227 snapshots dense generated-contract string arrays as frozen data", () => {
  const result = snapshotGeneratedContractStringArray(["a.js", "b.js"], "fixture");
  assert.deepEqual(result, ["a.js", "b.js"]);
  assert.equal(Object.isFrozen(result), true);
});

test("M1227 rejects accessor-backed contract entries without invoking getters", () => {
  let invoked = false;
  const hostile = ["safe.js"];
  Object.defineProperty(hostile, "0", {
    enumerable: true,
    configurable: true,
    get() {
      invoked = true;
      return "unsafe.js";
    }
  });
  assert.throws(() => snapshotGeneratedContractStringArray(hostile, "hostile"), /own string data fields/);
  assert.equal(invoked, false);
});

test("M1227 rejects sparse and extra-key contract arrays", () => {
  const sparse = new Array(2);
  sparse[0] = "a.js";
  assert.throws(() => snapshotGeneratedContractStringArray(sparse, "sparse"), /dense array/);

  const extra = ["a.js"];
  extra.extra = "b.js";
  assert.throws(() => snapshotGeneratedContractStringArray(extra, "extra"), /dense array/);

  const symbol = ["a.js"];
  symbol[Symbol("extra")] = "b.js";
  assert.throws(() => snapshotGeneratedContractStringArray(symbol, "symbol"), /dense array/);
});
