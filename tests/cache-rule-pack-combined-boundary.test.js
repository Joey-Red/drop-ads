import assert from "node:assert/strict";
import test from "node:test";

import { decodeRulePack, MAX_RAW_CACHE_POLICY_ITEMS } from "../src/core/cache-codec.js";

test("decodeRulePack admits the exact combined raw-item ceiling", () => {
  const firstHalf = Math.floor(MAX_RAW_CACHE_POLICY_ITEMS / 2);
  const secondHalf = MAX_RAW_CACHE_POLICY_ITEMS - firstHalf;
  const pack = {
    d: ["example.com", ...Array(firstHalf - 1).fill(null)],
    u: Array(secondHalf).fill(null)
  };

  assert.deepEqual(decodeRulePack(pack), [{ kind: "domain", value: "example.com" }]);
});

test("decodeRulePack rejects a combined one-over compact pack before partial decode", () => {
  const firstHalf = Math.floor(MAX_RAW_CACHE_POLICY_ITEMS / 2) + 1;
  const secondHalf = MAX_RAW_CACHE_POLICY_ITEMS - Math.floor(MAX_RAW_CACHE_POLICY_ITEMS / 2);
  const pack = {
    d: ["example.com", ...Array(firstHalf - 1).fill(null)],
    u: Array(secondHalf).fill(null)
  };

  assert.deepEqual(decodeRulePack(pack), []);
});
