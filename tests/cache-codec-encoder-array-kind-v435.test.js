import test from "node:test";
import assert from "node:assert/strict";

import { encodeCosmeticPack, encodeRulePack } from "../src/core/cache-codec.js";

function revoked(value) {
  const { proxy, revoke } = Proxy.revocable(value, {});
  revoke();
  return proxy;
}

test("M435 direct cache encoders reject revoked array-kind values deterministically", () => {
  for (const candidate of [revoked([]), revoked({})]) {
    assert.throws(() => encodeRulePack(candidate), /Cache network encoder rules array kind is invalid/);
  }
  for (const candidate of [revoked([]), revoked({})]) {
    assert.throws(() => encodeCosmeticPack(candidate), /Cache cosmetic encoder rules array kind is invalid/);
  }
});

test("M435 ordinary non-array direct encoder compatibility remains empty", () => {
  assert.deepEqual(encodeRulePack({}), {});
  assert.deepEqual(encodeCosmeticPack({}), []);
});
