import test from "node:test";
import assert from "node:assert/strict";
import { decodeCacheEntry, decodeCosmeticPack } from "../src/core/cache-codec.js";

test("cosmetic pack rejects accessor entries without invocation", () => {
  let reads = 0;
  const pack = [".ad"];
  Object.defineProperty(pack, "0", {
    enumerable: true,
    configurable: true,
    get() { reads += 1; return ".ad"; }
  });
  assert.deepEqual(decodeCosmeticPack(pack), []);
  assert.equal(reads, 0);
});

test("scoped cosmetic tuples reject unsafe nested domain arrays", () => {
  let reads = 0;
  const domains = ["example.com"];
  Object.defineProperty(domains, "0", {
    enumerable: true,
    configurable: true,
    get() { reads += 1; return "example.com"; }
  });
  assert.deepEqual(decodeCosmeticPack([[".ad", domains, []]]), []);
  assert.equal(reads, 0);

  const holey = ["example.com", "ads.example.com"];
  delete holey[1];
  assert.deepEqual(decodeCosmeticPack([[".ad", holey, []]]), []);
});

test("valid scoped cosmetic tuples preserve dense domain data", () => {
  assert.deepEqual(decodeCosmeticPack([[".ad", ["example.com"], ["allow.example.com"]]]), [{
    selector: ".ad",
    domains: ["example.com"],
    excludedDomains: ["allow.example.com"]
  }]);
});

test("v5 count vector rejects accessors without invocation", () => {
  let reads = 0;
  const counts = [1, 0, 0, 0];
  Object.defineProperty(counts, "0", {
    enumerable: true,
    configurable: true,
    get() { reads += 1; return 1; }
  });
  assert.equal(decodeCacheEntry({
    v: 5,
    b: { d: ["ads.example.com"] },
    a: {},
    c: counts,
    s: "hosts\u0000https://example.com/hosts.txt",
    n: 0
  }), null);
  assert.equal(reads, 0);
});

test("v5 count vector must be exact dense length four", () => {
  assert.equal(decodeCacheEntry({
    v: 5,
    b: { d: ["ads.example.com"] },
    a: {},
    c: [1, 0, 0],
    s: "hosts\u0000https://example.com/hosts.txt",
    n: 0
  }), null);

  const counts = [1, 0, 0, 0];
  counts.note = 1;
  assert.equal(decodeCacheEntry({
    v: 5,
    b: { d: ["ads.example.com"] },
    a: {},
    c: counts,
    s: "hosts\u0000https://example.com/hosts.txt",
    n: 0
  }), null);
});
