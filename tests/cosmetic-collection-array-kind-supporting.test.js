import test from "node:test";
import assert from "node:assert/strict";
import { cosmeticStylesheet, normalizeCosmeticRules } from "../src/core/cosmetic-rules.js";

function revoked(value) {
  const pair = Proxy.revocable(value, {});
  pair.revoke();
  return pair.proxy;
}

test("ordinary non-array cosmetic collections retain compatibility fallback", () => {
  assert.deepEqual(normalizeCosmeticRules(null), []);
  assert.deepEqual(normalizeCosmeticRules({}), []);
  assert.equal(cosmeticStylesheet(null), "");
  assert.equal(cosmeticStylesheet({}), "");
});

test("revoked cosmetic rule collections fail deterministically", () => {
  assert.throws(() => normalizeCosmeticRules(revoked([])), /Cosmetic rules array kind is invalid/);
  assert.throws(() => normalizeCosmeticRules(revoked({})), /Cosmetic rules array kind is invalid/);
});

test("revoked cosmetic stylesheet selector collections fail deterministically", () => {
  assert.throws(() => cosmeticStylesheet(revoked([])), /Cosmetic stylesheet selectors array kind is invalid/);
  assert.throws(() => cosmeticStylesheet(revoked({})), /Cosmetic stylesheet selectors array kind is invalid/);
});

test("canonical cosmetic output semantics remain intact", () => {
  assert.deepEqual(
    normalizeCosmeticRules([{ selector: ".ad" }, { selector: ".ad" }, { selector: "#banner" }]),
    [{ selector: "#banner" }, { selector: ".ad" }]
  );
  assert.equal(cosmeticStylesheet(["#banner", ".ad"]), "#banner,\n.ad { display: none !important; }\n");
});
