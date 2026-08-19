import test from "node:test";
import assert from "node:assert/strict";
import { cosmeticStylesheet, normalizeCosmeticRules } from "../src/core/cosmetic-rules.js";

function revokedArrayProxy() {
  const { proxy, revoke } = Proxy.revocable([], {});
  revoke();
  return proxy;
}

test("direct cosmetic collection boundaries contain revoked array-kind failures", () => {
  assert.throws(() => normalizeCosmeticRules(revokedArrayProxy()), /array kind is invalid/);
  assert.throws(() => cosmeticStylesheet(revokedArrayProxy()), /array kind is invalid/);
});

test("ordinary non-array compatibility fallback remains unchanged", () => {
  assert.deepEqual(normalizeCosmeticRules(null), []);
  assert.deepEqual(normalizeCosmeticRules({}), []);
  assert.equal(cosmeticStylesheet(null), "");
  assert.equal(cosmeticStylesheet({}), "");
});
