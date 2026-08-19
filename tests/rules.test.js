import test from "node:test";
import assert from "node:assert/strict";
import {
  COOKIE_RULE_ID,
  DOMAIN_BATCH_SIZE,
  MAX_NETWORK_RULE_VALUE_CHARS,
  RULE_TIERS,
  compileCookieRules,
  compileManagedRules,
  compileRules,
  isManagedRuleId,
  normalizeDomain,
  normalizeHttpUrl,
  normalizePattern,
  normalizeRule,
  ruleKey
} from "../src/core/rules.js";

test("normalizes domains and URLs without retaining fragments", () => {
  assert.equal(normalizeDomain("*.Ads.Example.COM."), "ads.example.com");
  assert.equal(normalizeDomain("https://Tracker.Example.com/path"), "tracker.example.com");
  assert.equal(normalizeHttpUrl("https://example.com/ad.js#fragment"), "https://example.com/ad.js");
});

test("network rules require the exact canonical plain-object schema", () => {
  assert.deepEqual(
    normalizeRule({ kind: "domain", value: "ads.example.com", resourceTypes: ["image", "script"] }),
    { kind: "domain", value: "ads.example.com", resourceTypes: ["image", "script"] }
  );
  assert.throws(() => normalizeRule({ kind: "domain", value: "ads.example.com", pageText: "Sponsored" }), /unsupported field: pageText/);
  assert.throws(() => normalizeRule({ kind: "domain", value: "ads.example.com", sourcePage: "https:\/\/private.example/" }), /unsupported field: sourcePage/);
  assert.throws(() => normalizeRule(["domain", "ads.example.com"]), /plain object/);

  const inherited = Object.create({ requestHistory: ["private.example"] });
  inherited.kind = "domain";
  inherited.value = "ads.example.com";
  assert.throws(() => normalizeRule(inherited), /plain object/);
});

test("network URL and pattern rules enforce the exact shared value ceiling", () => {
  const prefix = "https://example.com/";
  const exactUrl = prefix + "a".repeat(MAX_NETWORK_RULE_VALUE_CHARS - prefix.length);
  assert.equal(normalizeHttpUrl(exactUrl), exactUrl);
  assert.throws(() => normalizeHttpUrl(`${exactUrl}a`), /URL exceeds/);

  const exactPattern = "a".repeat(MAX_NETWORK_RULE_VALUE_CHARS);
  assert.equal(normalizePattern(exactPattern), exactPattern);
  assert.throws(() => normalizePattern(`${exactPattern}a`), /Pattern exceeds/);
});

test("canonical URL expansion cannot bypass the network rule value ceiling", () => {
  const unicodeUrl = `https://example.com/${"é".repeat(3_000)}`;
  assert.ok(unicodeUrl.length < MAX_NETWORK_RULE_VALUE_CHARS);
  assert.throws(() => normalizeHttpUrl(unicodeUrl), /Canonical URL exceeds/);
});

test("context-style URL input to domain normalization is bounded before URL parsing", () => {
  const prefix = "https://example.com/";
  const exact = prefix + "a".repeat(MAX_NETWORK_RULE_VALUE_CHARS - prefix.length);
  assert.equal(normalizeDomain(exact), "example.com");
  assert.throws(() => normalizeDomain(`${exact}a`), /Domain exceeds/);
});

test("personal rules can deliberately target local/private resources", () => {
  assert.equal(normalizeDomain("192.168.1.25"), "192.168.1.25");
  assert.equal(normalizeHttpUrl("http://127.0.0.2:41731/asset/domain-ad.svg"), "http://127.0.0.2:41731/asset/domain-ad.svg");
  assert.deepEqual(normalizeRule({ kind: "domain", value: "10.0.0.5" }), { kind: "domain", value: "10.0.0.5" });
});

test("rejects malformed domain rules, non-http URLs, and URL credentials", () => {
  assert.throws(() => normalizeDomain("example.com/path"));
  assert.throws(() => normalizeHttpUrl("file:///tmp/ad.js"));
  assert.throws(() => normalizeHttpUrl("https://user:secret@example.com/ad.js"), /credentials/);
  assert.throws(() => normalizeRule({ kind: "url", value: "https://token@example.com/ad.js" }), /credentials/);
});

test("deduplicates equivalent rules", () => {
  const rules = compileRules([
    { kind: "domain", value: "Ads.Example.com" },
    { kind: "domain", value: "ads.example.com" }
  ], "personalBlock");
  assert.equal(rules.length, 1);
  assert.deepEqual(rules[0].condition.requestDomains, ["ads.example.com"]);
});

test("batches large compatible domain sets into far fewer DNR rules", () => {
  const source = Array.from({ length: DOMAIN_BATCH_SIZE * 2 + 1 }, (_, index) => ({
    kind: "domain",
    value: `d${String(index).padStart(4, "0")}.example.com`
  }));
  const compiled = compileRules(source, "communityBlock");
  assert.equal(compiled.length, 3);
  assert.equal(compiled[0].condition.requestDomains.length, DOMAIN_BATCH_SIZE);
  assert.equal(compiled[1].condition.requestDomains.length, DOMAIN_BATCH_SIZE);
  assert.equal(compiled[2].condition.requestDomains.length, 1);
});

test("domain batching preserves resource-type distinctions", () => {
  const compiled = compileRules([
    { kind: "domain", value: "img.example.com", resourceTypes: ["image"] },
    { kind: "domain", value: "script.example.com", resourceTypes: ["script"] },
    { kind: "domain", value: "img2.example.com", resourceTypes: ["image"] }
  ], "personalBlock");
  assert.equal(compiled.length, 2);
  const image = compiled.find((rule) => rule.condition.resourceTypes?.[0] === "image");
  assert.deepEqual(image.condition.requestDomains, ["img.example.com", "img2.example.com"]);
});

test("compiles exact URLs with both URL anchors", () => {
  const [rule] = compileRules([{ kind: "url", value: "https://example.com/ad.js" }], "personalBlock");
  assert.equal(rule.condition.urlFilter, "|https://example.com/ad.js|");
});

test("preserves the required precedence by priority", () => {
  const compiled = compileManagedRules({
    communityBlock: [{ kind: "domain", value: "ads.example.com" }],
    communityAllow: [{ kind: "domain", value: "ads.example.com" }],
    personalBlock: [{ kind: "domain", value: "ads.example.com" }],
    personalAllow: [{ kind: "domain", value: "ads.example.com" }],
    disabledSites: [],
    cookieMode: "off"
  });

  assert.deepEqual(compiled.map((rule) => rule.priority), [100, 200, 300, 400]);
  assert.equal(RULE_TIERS.personalAllow.priority > RULE_TIERS.personalBlock.priority, true);
  assert.equal(RULE_TIERS.personalBlock.priority > RULE_TIERS.communityAllow.priority, true);
});

test("disabled sites bypass block rules while retaining personal-allow priority", () => {
  const compiled = compileManagedRules({
    communityBlock: [{ kind: "domain", value: "ads.example.com" }],
    communityAllow: [],
    personalBlock: [{ kind: "domain", value: "tracker.example.com" }],
    personalAllow: [],
    disabledSites: ["News.Example.com"],
    cookieMode: "off"
  });

  assert.deepEqual(compiled[0].condition.excludedInitiatorDomains, ["news.example.com"]);
  assert.deepEqual(compiled[1].condition.excludedInitiatorDomains, ["news.example.com"]);
  assert.equal(compiled[2].action.type, "allow");
  assert.deepEqual(compiled[2].condition.requestDomains, ["news.example.com"]);
  assert.equal(compiled[2].priority, RULE_TIERS.personalAllow.priority);
});

test("third-party cookie mode removes Cookie and Set-Cookie without inspecting requests", () => {
  const [rule] = compileCookieRules({ cookieMode: "third-party", cookieAllowSites: [], disabledSites: [] });
  assert.equal(rule.id, COOKIE_RULE_ID);
  assert.equal(rule.action.type, "modifyHeaders");
  assert.deepEqual(rule.action.requestHeaders, [{ header: "cookie", operation: "remove" }]);
  assert.deepEqual(rule.action.responseHeaders, [{ header: "set-cookie", operation: "remove" }]);
  assert.equal(rule.condition.domainType, "thirdParty");
});

test("all-cookie hard mode includes main frames and respects local exceptions", () => {
  const [rule] = compileCookieRules({
    cookieMode: "all",
    cookieAllowSites: ["accounts.example.com"],
    disabledSites: ["broken.example.com"]
  });
  assert.equal(rule.condition.resourceTypes.includes("main_frame"), true);
  assert.deepEqual(rule.condition.excludedInitiatorDomains, ["accounts.example.com", "broken.example.com"]);
  assert.deepEqual(rule.condition.excludedRequestDomains, ["accounts.example.com", "broken.example.com"]);
});

test("dynamic rule budget is enforced after compression and personal reserve", () => {
  const manyDomains = Array.from({ length: DOMAIN_BATCH_SIZE + 1 }, (_, index) => ({ kind: "domain", value: `x${index}.example.com` }));
  assert.throws(() => compileManagedRules({
    communityBlock: manyDomains,
    communityAllow: [],
    personalBlock: [],
    personalAllow: [],
    disabledSites: [],
    cookieMode: "off"
  }, { maxDynamicRules: 2 }), /Shared dynamic rule budget exceeded/);
  assert.doesNotThrow(() => compileManagedRules({
    communityBlock: manyDomains,
    communityAllow: [],
    personalBlock: [],
    personalAllow: [],
    disabledSites: [],
    cookieMode: "off"
  }, { maxDynamicRules: 3 }));
});

test("resource types are validated and canonicalized", () => {
  assert.deepEqual(
    normalizeRule({ kind: "domain", value: "ads.example.com", resourceTypes: ["script", "image", "script"] }),
    { kind: "domain", value: "ads.example.com", resourceTypes: ["image", "script"] }
  );
  assert.throws(() => normalizeRule({ kind: "domain", value: "ads.example.com", resourceTypes: ["made_up"] }));
});

test("rule keys are stable across equivalent input", () => {
  assert.equal(
    ruleKey({ kind: "domain", value: "ADS.EXAMPLE.COM" }),
    ruleKey({ kind: "domain", value: "ads.example.com" })
  );
});

test("managed rule IDs include cookie policy and exclude unrelated ids", () => {
  assert.equal(isManagedRuleId(1_000_000), true);
  assert.equal(isManagedRuleId(COOKIE_RULE_ID), true);
  assert.equal(isManagedRuleId(999_999), false);
  assert.equal(isManagedRuleId(COOKIE_RULE_ID + 1), false);
});
