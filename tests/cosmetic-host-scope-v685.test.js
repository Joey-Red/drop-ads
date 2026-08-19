import assert from "node:assert/strict";
import test from "node:test";
import { compileCosmeticSelectors, cosmeticRuleMatchesHostname, normalizeCosmeticRule } from "../src/core/cosmetic-rules.js";

test("domain-scoped cosmetic rules inherit to subdomains after canonicalization", () => {
  const rule = normalizeCosmeticRule({ selector: ".ad", domains: ["EXAMPLE.COM"] });
  assert.equal(cosmeticRuleMatchesHostname(rule, "example.com"), true);
  assert.equal(cosmeticRuleMatchesHostname(rule, "news.example.com"), true);
  assert.equal(cosmeticRuleMatchesHostname(rule, "example.net"), false);
});

test("excluded domains suppress their subtree", () => {
  const rule = { selector: ".ad", domains: ["example.com"], excludedDomains: ["safe.example.com"] };
  assert.equal(cosmeticRuleMatchesHostname(rule, "safe.example.com"), false);
  assert.equal(cosmeticRuleMatchesHostname(rule, "deep.safe.example.com"), false);
  assert.equal(cosmeticRuleMatchesHostname(rule, "news.example.com"), true);
});

test("domain-scoped allow only suppresses hide where the allow matches", () => {
  const hide = [{ selector: ".ad", domains: ["example.com"] }];
  const allow = [{ selector: ".ad", domains: ["safe.example.com"] }];
  assert.deepEqual(compileCosmeticSelectors({ hostname: "safe.example.com", hide, allow }), []);
  assert.deepEqual(compileCosmeticSelectors({ hostname: "news.example.com", hide, allow }), [".ad"]);
});
