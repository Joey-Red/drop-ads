import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSubscriptions } from "../src/core/subscriptions.js";

function revoked(target) {
  const pair = Proxy.revocable(target, {});
  pair.revoke();
  return pair.proxy;
}

test("M424 ordinary non-array subscription input keeps the compatibility fallback", () => {
  const normalized = normalizeSubscriptions({ legacy: true });
  assert.ok(Array.isArray(normalized));
  assert.ok(normalized.length >= 1, "built-in subscriptions remain available");
});

test("M424 revoked subscription arrays and objects fail deterministically", () => {
  for (const value of [revoked([]), revoked({})]) {
    assert.throws(() => normalizeSubscriptions(value), /array kind is invalid/);
  }
});

test("M424 revoked values are not coerced during collection admission", () => {
  let conversions = 0;
  const value = {
    [Symbol.toPrimitive]() {
      conversions += 1;
      return "";
    }
  };
  normalizeSubscriptions(value);
  assert.equal(conversions, 0);
});
