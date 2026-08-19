import assert from "node:assert/strict";
import test from "node:test";
import { normalizeCosmeticRules } from "../src/core/cosmetic-rules.js";

test("cosmetic normalization discards accessor rules without invoking getters", () => {
  let calls = 0;
  const hostile = {};
  Object.defineProperty(hostile, "selector", {
    enumerable: true,
    get() { calls += 1; return ".hostile"; }
  });
  const rules = normalizeCosmeticRules([{ selector: ".good" }, hostile]);
  assert.equal(calls, 0);
  assert.deepEqual(rules.map((rule) => rule.selector), [".good"]);
});

test("cosmetic normalization discards custom-prototype and revoked-proxy rules", () => {
  const custom = Object.create({ inherited: true });
  custom.selector = ".custom";
  const { proxy, revoke } = Proxy.revocable({ selector: ".proxy" }, {});
  revoke();
  const rules = normalizeCosmeticRules([{ selector: ".good" }, custom, proxy]);
  assert.deepEqual(rules.map((rule) => rule.selector), [".good"]);
  assert.equal(Object.isFrozen(rules), true);
  assert.equal(Object.isFrozen(rules[0]), true);
});
