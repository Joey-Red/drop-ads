import test from "node:test";
import assert from "node:assert/strict";

import { encodeRulePack, encodeCosmeticPack } from "../src/core/cache-codec.js";

function revoked(target) {
  const { proxy, revoke } = Proxy.revocable(target, {});
  revoke();
  return proxy;
}

test("M435 direct cache encoders preserve ordinary non-array empty fallback", () => {
  assert.deepEqual(encodeRulePack(null), {});
  assert.deepEqual(encodeRulePack({}), {});
  assert.deepEqual(encodeCosmeticPack(null), []);
  assert.deepEqual(encodeCosmeticPack({}), []);
});

test("M435 revoked network encoder collections fail deterministically", () => {
  assert.throws(() => encodeRulePack(revoked([])), /Cache network encoder rules array kind is invalid/);
  assert.throws(() => encodeRulePack(revoked({})), /Cache network encoder rules array kind is invalid/);
});

test("M435 revoked cosmetic encoder collections fail deterministically", () => {
  assert.throws(() => encodeCosmeticPack(revoked([])), /Cache cosmetic encoder rules array kind is invalid/);
  assert.throws(() => encodeCosmeticPack(revoked({})), /Cache cosmetic encoder rules array kind is invalid/);
});
