import test from "node:test";
import assert from "node:assert/strict";

import { encodeCosmeticPack, encodeRulePack } from "../src/core/cache-codec.js";

function revoked(value) {
  const { proxy, revoke } = Proxy.revocable(value, {});
  revoke();
  return proxy;
}

test("M443 direct cache encoders preserve ordinary non-array empty fallback", () => {
  assert.deepEqual(encodeRulePack({}), {});
  assert.deepEqual(encodeCosmeticPack({}), []);
});

test("M443 revoked encoder collection array-kind failures are deterministic", () => {
  for (const value of [revoked({}), revoked([])]) {
    assert.throws(() => encodeRulePack(value), /Cache network encoder rules array kind is invalid/);
  }
  for (const value of [revoked({}), revoked([])]) {
    assert.throws(() => encodeCosmeticPack(value), /Cache cosmetic encoder rules array kind is invalid/);
  }
});
