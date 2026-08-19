import test from "node:test";
import assert from "node:assert/strict";

import { cosmeticStylesheet, normalizeCosmeticRules } from "../src/core/cosmetic-rules.js";

function revokedArrayProxy() {
  const { proxy, revoke } = Proxy.revocable([], {});
  revoke();
  return proxy;
}

test("direct cosmetic rule collection rejects revoked array-kind input deterministically", () => {
  assert.throws(() => normalizeCosmeticRules(revokedArrayProxy()), /Cosmetic rules array kind is invalid/);
});

test("direct cosmetic stylesheet collection rejects revoked array-kind input deterministically", () => {
  assert.throws(() => cosmeticStylesheet(revokedArrayProxy()), /Cosmetic stylesheet selectors array kind is invalid/);
});

test("ordinary non-array compatibility fallbacks remain unchanged", () => {
  assert.deepEqual(normalizeCosmeticRules(null), []);
  assert.equal(cosmeticStylesheet({}), "");
});
