import test from "node:test";
import assert from "node:assert/strict";
import { COUNTRY_PRESETS, collectCountryRules, makeCountryRule, normalizeCountryTld, parseCountryRule } from "../src/core/country-policy.js";
import { compileRules } from "../src/core/rules.js";

test("country TLD normalization supports ASCII and IDN punycode without accepting hostnames", () => {
  assert.equal(normalizeCountryTld(".RU"), "ru");
  assert.equal(normalizeCountryTld("рф"), "xn--p1ai");
  assert.throws(() => normalizeCountryTld("example.ru"), /one TLD label/);
  assert.throws(() => normalizeCountryTld("com"), /two-letter ccTLD or an IDN/);
  assert.equal(COUNTRY_PRESETS.find((item) => item.region === "GB")?.tld, "uk");
});

test("navigation and all-resource country rules compile into personal-block DNR with normal precedence tier", () => {
  const navigation = makeCountryRule("ru", "navigation");
  const all = makeCountryRule("cn", "all");
  assert.deepEqual(navigation.resourceTypes, ["main_frame"]);
  assert.equal(all.resourceTypes, undefined);
  const compiled = compileRules([navigation, all], "personalBlock", { excludedInitiatorDomains: ["paused.example"] });
  assert.equal(compiled.length, 2);
  assert.ok(compiled.every((rule) => rule.priority === 300 && rule.action.type === "block"));
  assert.ok(compiled.some((rule) => rule.condition.urlFilter === "||ru^" && rule.condition.resourceTypes?.includes("main_frame")));
  assert.ok(compiled.every((rule) => rule.condition.excludedInitiatorDomains?.includes("paused.example")));
});

test("country rule collection is strict, deduplicated by TLD for UI, and all-resource mode wins duplicate recovery", () => {
  const ruNav = makeCountryRule("ru", "navigation");
  const ruAll = makeCountryRule("ru", "all");
  const cnNav = makeCountryRule("cn", "navigation");
  assert.equal(parseCountryRule({ kind: "pattern", value: "*ru*" }), null);
  const grouped = collectCountryRules([ruNav, cnNav, ruAll, { kind: "domain", value: "ads.example" }]);
  assert.deepEqual(grouped.map(({ tld, mode }) => ({ tld, mode })), [
    { tld: "cn", mode: "navigation" },
    { tld: "ru", mode: "all" }
  ]);
  assert.equal(grouped[1].rules.length, 2);
});
