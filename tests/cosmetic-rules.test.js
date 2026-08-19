import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_COSMETIC_RULE_KEY_CHARS,
  MAX_COSMETIC_SELECTOR_LENGTH,
  cosmeticRuleKey,
  cosmeticRuleMatchesHostname,
  cosmeticStylesheet,
  compileCosmeticSelectors,
  compileTieredCosmeticSelectors,
  normalizeCosmeticRule,
  normalizeCosmeticRules,
  parseCosmeticRuleKey
} from "../src/core/cosmetic-rules.js";

test("cosmetic rules normalize deterministic domain scope", () => {
  const rule = normalizeCosmeticRule({ selector: "  .sponsor-card > iframe  ", domains: ["Example.COM", "www.example.com", "example.com"], excludedDomains: ["accounts.example.com"] });
  assert.deepEqual(rule, { selector: ".sponsor-card > iframe", domains: ["example.com", "www.example.com"], excludedDomains: ["accounts.example.com"] });
  assert.equal(cosmeticRuleKey(rule), ".sponsor-card > iframe\u0000example.com,www.example.com\u0000accounts.example.com");
});

test("cosmetic rule keys round-trip only in canonical bounded form", () => {
  const rule = { selector: ".ad-slot", domains: ["example.com", "www.example.com"], excludedDomains: ["account.example.com"] };
  const key = cosmeticRuleKey(rule);
  assert.deepEqual(parseCosmeticRuleKey(key), normalizeCosmeticRule(rule));
  assert.throws(() => parseCosmeticRuleKey(".ad-slot\u0000Example.com\u0000"), /not canonical/);
  assert.throws(() => parseCosmeticRuleKey(".ad-slot\u0000example.com,example.com\u0000"), /not canonical/);
  assert.throws(() => parseCosmeticRuleKey(".ad-slot\u0000only-one-part"), /exactly two separators/);
  assert.throws(() => parseCosmeticRuleKey(`.ad-slot\u0000bad,,example.com\u0000`), /empty domain/);
  assert.throws(() => parseCosmeticRuleKey("x".repeat(MAX_COSMETIC_RULE_KEY_CHARS + 1)), /exceeds/);
});

test("maximum-length valid cosmetic selector remains key-round-trippable", () => {
  const selector = `.${"a".repeat(MAX_COSMETIC_SELECTOR_LENGTH - 1)}`;
  const key = cosmeticRuleKey({ selector });
  assert.equal(parseCosmeticRuleKey(key).selector, selector);
});

test("cosmetic rules require the exact canonical plain-object schema", () => {
  assert.deepEqual(normalizeCosmeticRule({ selector: ".ad", domains: ["example.com"], excludedDomains: ["accounts.example.com"] }), {
    selector: ".ad",
    domains: ["example.com"],
    excludedDomains: ["accounts.example.com"]
  });
  assert.throws(() => normalizeCosmeticRule({ selector: ".ad", pageText: "Sponsored" }), /unsupported field: pageText/);
  assert.throws(() => normalizeCosmeticRule({ selector: ".ad", innerHTML: "<div>private<\/div>" }), /unsupported field: innerHTML/);
  assert.throws(() => normalizeCosmeticRule([".ad"]), /plain object/);

  const inherited = Object.create({ sourcePage: "https://private.example/" });
  inherited.selector = ".ad";
  assert.throws(() => normalizeCosmeticRule(inherited), /plain object/);
});

test("cosmetic rules reject declaration, procedural, and executable syntax", () => {
  for (const selector of [".ad { display:none }", ".ad; color:red", ".ad:has(.tracker)", ".ad:contains(Sponsored)", "@import url(https://example.com/x.css)", "a[href^=javascript:]"]) {
    assert.throws(() => normalizeCosmeticRule({ selector }), /Cosmetic|Procedural|executable|invalid/);
  }
});

test("cosmetic domain scope matches subdomains and honors exclusions", () => {
  const rule = { selector: ".ad", domains: ["example.com"], excludedDomains: ["shop.example.com"] };
  assert.equal(cosmeticRuleMatchesHostname(rule, "www.example.com"), true);
  assert.equal(cosmeticRuleMatchesHostname(rule, "shop.example.com"), false);
  assert.equal(cosmeticRuleMatchesHostname(rule, "example.net"), false);
});

test("cosmetic selector compiler deduplicates and applies exception precedence", () => {
  const selectors = compileCosmeticSelectors({
    hostname: "news.example.com",
    hide: [{ selector: ".ad" }, { selector: ".ad", domains: ["example.com"] }, { selector: "#sponsor", domains: ["example.com"] }, { selector: ".other", domains: ["other.example"] }],
    allow: [{ selector: "#sponsor", domains: ["news.example.com"] }]
  });
  assert.deepEqual(selectors, [".ad"]);
  assert.equal(cosmeticStylesheet(selectors), ".ad { display: none !important; }\n");
});

test("tiered cosmetics preserve user control over shared policy", () => {
  assert.deepEqual(compileTieredCosmeticSelectors({
    hostname: "example.com",
    sharedHide: [{ selector: ".shared-block" }, { selector: ".shared-except" }, { selector: ".personal-allow" }],
    sharedAllow: [{ selector: ".shared-except" }, { selector: ".personal-hide" }],
    personalHide: [{ selector: ".personal-hide" }, { selector: ".personal-allow" }],
    personalAllow: [{ selector: ".personal-allow" }]
  }), [".personal-hide", ".shared-block"]);
});

test("invalid persisted cosmetic rules are discarded", () => {
  assert.deepEqual(normalizeCosmeticRules([{ selector: ".good" }, { selector: ".good" }, { selector: ".bad { color:red }" }, { selector: ".also-bad", pageText: "private" }]), [{ selector: ".good" }]);
});

test("cosmetic compilation obeys selector and byte caps", () => {
  assert.deepEqual(compileCosmeticSelectors({ hostname: "example.com", hide: [{ selector: ".a" }, { selector: ".b" }, { selector: ".c" }], maxSelectors: 2 }), [".a", ".b"]);
  assert.deepEqual(compileCosmeticSelectors({ hostname: "example.com", hide: [{ selector: ".abcdefgh" }, { selector: ".x" }], maxBytes: 4 }), []);
});
