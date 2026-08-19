import assert from "node:assert/strict";
import test from "node:test";

import { buildCosmeticPolicy } from "../src/core/cosmetic-runtime.js";

function disabledState() {
  return { enabled: false, disabledSites: [], subscriptions: [], personalCosmeticHide: [], personalCosmeticAllow: [] };
}

test("cosmetic policy build input rejects accessors without invoking them", () => {
  let reads = 0;
  const input = { state: disabledState(), session: { disabledSites: [] }, cache: {} };
  Object.defineProperty(input, "hostname", {
    enumerable: true,
    get() {
      reads += 1;
      return "example.com";
    }
  });
  assert.throws(() => buildCosmeticPolicy(input), /Cosmetic policy build input/);
  assert.equal(reads, 0);
});

test("cosmetic policy build input rejects unknown and custom-prototype fields", () => {
  assert.throws(() => buildCosmeticPolicy({ hostname: "example.com", state: disabledState(), tracking: false }), /Cosmetic policy build input/);
  const custom = Object.assign(Object.create({ inherited: true }), { hostname: "example.com", state: disabledState() });
  assert.throws(() => buildCosmeticPolicy(custom), /Cosmetic policy build input/);
});

test("cosmetic policy build input preserves disabled and missing-state behavior", () => {
  assert.deepEqual(buildCosmeticPolicy({ hostname: "example.com", state: disabledState() }), {
    enabled: false,
    selectorCount: 0,
    stylesheet: ""
  });
  assert.deepEqual(buildCosmeticPolicy({ hostname: "example.com" }), {
    enabled: false,
    selectorCount: 0,
    stylesheet: ""
  });
});
