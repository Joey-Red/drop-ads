import test from "node:test";
import assert from "node:assert/strict";
import { addUniqueRule, normalizeDisabledSites, removeRule, ruleFromUserInput, setDomainFlag, setSiteDisabled } from "../src/core/personal-rules.js";
import { ruleKey } from "../src/core/rules.js";

test("user input becomes a domain or exact URL rule", () => {
  assert.deepEqual(ruleFromUserInput("Ads.Example.com"), { kind: "domain", value: "ads.example.com" });
  assert.deepEqual(ruleFromUserInput("https://example.com/ad.js#x"), { kind: "url", value: "https://example.com/ad.js" });
});

test("personal rules dedupe and remove by stable key", () => {
  const first = addUniqueRule([], { kind: "domain", value: "ads.example.com" });
  const second = addUniqueRule(first, { kind: "domain", value: "ADS.EXAMPLE.COM" });
  assert.equal(second.length, 1);
  assert.deepEqual(removeRule(second, ruleKey(second[0])), []);
});

test("disabled sites normalize, dedupe, add, and remove", () => {
  assert.deepEqual(normalizeDisabledSites(["News.Example.com", "news.example.com"]), ["news.example.com"]);
  const disabled = setSiteDisabled([], "https://news.example.com/story", true);
  assert.deepEqual(disabled, ["news.example.com"]);
  assert.deepEqual(setSiteDisabled(disabled, "news.example.com", false), []);
});

test("domain flags support local cookie exceptions", () => {
  const allowed = setDomainFlag([], "Accounts.Example.com", true);
  assert.deepEqual(allowed, ["accounts.example.com"]);
  assert.deepEqual(setDomainFlag(allowed, "accounts.example.com", false), []);
});
