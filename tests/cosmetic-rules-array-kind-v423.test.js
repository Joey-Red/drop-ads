import test from "node:test";
import assert from "node:assert/strict";

import { normalizeCosmeticRules, cosmeticStylesheet } from "../src/core/cosmetic-rules.js";

function revokedProxy(target) {
  const { proxy, revoke } = Proxy.revocable(target, {});
  revoke();
  return proxy;
}

test("M423 ordinary non-array cosmetic collections preserve compatibility fallbacks", () => {
  assert.deepEqual(normalizeCosmeticRules(null), []);
  assert.deepEqual(normalizeCosmeticRules({}), []);
  assert.equal(cosmeticStylesheet(null), "");
  assert.equal(cosmeticStylesheet({}), "");
});

test("M423 revoked cosmetic rule collections fail deterministically", () => {
  assert.throws(() => normalizeCosmeticRules(revokedProxy([])), /Cosmetic rules array kind is invalid/);
  assert.throws(() => normalizeCosmeticRules(revokedProxy({})), /Cosmetic rules array kind is invalid/);
});

test("M423 revoked stylesheet selector collections fail deterministically", () => {
  assert.throws(() => cosmeticStylesheet(revokedProxy([])), /Cosmetic stylesheet selectors array kind is invalid/);
  assert.throws(() => cosmeticStylesheet(revokedProxy({})), /Cosmetic stylesheet selectors array kind is invalid/);
});

test("M423 valid direct cosmetic collections retain canonical behavior", () => {
  assert.deepEqual(normalizeCosmeticRules([{ selector: ".ad" }, { selector: ".ad" }]), [{ selector: ".ad" }]);
  assert.equal(cosmeticStylesheet([".ad", "#sponsor"]), ".ad,\n#sponsor { display: none !important; }\n");
});
