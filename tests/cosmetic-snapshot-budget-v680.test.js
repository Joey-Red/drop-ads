import assert from "node:assert/strict";
import test from "node:test";
import {
  compileCosmeticSelectors,
  compileTieredCosmeticSelectors,
  cosmeticStylesheet,
  normalizeCosmeticRule,
  normalizeCosmeticRules
} from "../src/core/cosmetic-rules.js";

test("normalized cosmetic snapshots are deeply immutable", () => {
  const rule = normalizeCosmeticRule({
    selector: ".ad",
    domains: ["Example.com", "example.com"],
    excludedDomains: ["safe.example.com"]
  });
  assert.equal(Object.isFrozen(rule), true);
  assert.equal(Object.isFrozen(rule.domains), true);
  assert.equal(Object.isFrozen(rule.excludedDomains), true);
  const rules = normalizeCosmeticRules([rule]);
  assert.equal(Object.isFrozen(rules), true);
  assert.equal(Object.isFrozen(rules[0]), true);
});

test("compile maxBytes bounds the exact emitted stylesheet", () => {
  const one = cosmeticStylesheet([".a"]);
  const exactBytes = new TextEncoder().encode(one).byteLength;
  assert.deepEqual(compileCosmeticSelectors({ hostname: "example.com", hide: [{ selector: ".a" }], maxBytes: exactBytes }), [".a"]);
  assert.deepEqual(compileCosmeticSelectors({ hostname: "example.com", hide: [{ selector: ".a" }], maxBytes: exactBytes - 1 }), []);
});

test("tiered compile keeps personal precedence while sharing one exact byte budget", () => {
  const selectors = compileTieredCosmeticSelectors({
    hostname: "example.com",
    personalHide: [{ selector: ".personal" }],
    sharedHide: [{ selector: ".shared" }]
  });
  assert.deepEqual(selectors, [".personal", ".shared"]);
  assert.ok(new TextEncoder().encode(cosmeticStylesheet(selectors)).byteLength <= 256 * 1024);
});
