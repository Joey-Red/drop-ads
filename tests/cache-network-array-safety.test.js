import test from "node:test";
import assert from "node:assert/strict";
import { decodeCacheEntry, decodeRulePack } from "../src/core/cache-codec.js";

function accessorArray(value) {
  let reads = 0;
  const array = [value];
  Object.defineProperty(array, "0", {
    enumerable: true,
    configurable: true,
    get() { reads += 1; return value; }
  });
  return { array, reads: () => reads };
}

test("network rule-pack arrays reject accessors without invocation", () => {
  const wrapped = accessorArray("ads.example.com");
  assert.deepEqual(decodeRulePack({ d: wrapped.array }), []);
  assert.equal(wrapped.reads(), 0);
});

test("network rule-pack arrays reject holes and extra properties", () => {
  const holey = ["a.example", "b.example"];
  delete holey[0];
  assert.deepEqual(decodeRulePack({ d: holey }), []);

  const extra = ["a.example"];
  extra.note = "hidden metadata";
  assert.deepEqual(decodeRulePack({ d: extra }), []);
});

test("resource-scoped tuples and resourceTypes are descriptor-safe", () => {
  let tupleReads = 0;
  const tuple = ["d", "ads.example.com", ["image"]];
  Object.defineProperty(tuple, "1", {
    enumerable: true,
    configurable: true,
    get() { tupleReads += 1; return "ads.example.com"; }
  });
  assert.deepEqual(decodeRulePack({ r: [tuple] }), []);
  assert.equal(tupleReads, 0);

  let typeReads = 0;
  const resourceTypes = ["image"];
  Object.defineProperty(resourceTypes, "0", {
    enumerable: true,
    configurable: true,
    get() { typeReads += 1; return "image"; }
  });
  assert.deepEqual(decodeRulePack({ r: [["d", "ads.example.com", resourceTypes]] }), []);
  assert.equal(typeReads, 0);
});

test("resource-scoped cache rules preserve valid dense tuples", () => {
  assert.deepEqual(decodeRulePack({
    r: [["d", "ads.example.com", ["image", "script"]]]
  }), [{ kind: "domain", value: "ads.example.com", resourceTypes: ["image", "script"] }]);
});

test("malformed network packs fail their containing compact entry closed", () => {
  const domains = ["ads.example.com"];
  domains[Symbol("hidden")] = true;
  assert.equal(decodeCacheEntry({ v: 2, b: { d: domains }, a: {}, n: 0 }), null);
});
