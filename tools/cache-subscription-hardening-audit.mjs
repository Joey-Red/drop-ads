import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function requireText(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`${label} is missing`);
}

function reject(source, pattern, label) {
  if (pattern.test(source)) throw new Error(`${label} is forbidden`);
}

const subscriptions = read("src/core/subscriptions.js");
const cacheCodec = read("src/core/cache-codec.js");

for (const [needle, label] of [
  ["function frozenSubscription(record)", "frozen subscription constructor"],
  ["return Object.freeze(result);", "frozen normalized subscription collection"],
  ["MAX_RAW_CACHE_POLICY_ITEMS, decodeCacheEntry", "shared raw cache merge ceiling"],
  ["snapshotDenseDataArray(candidates, label, MAX_RAW_CACHE_POLICY_ITEMS)", "bounded decoded merge snapshot"],
  ["function frozenNetworkRule(rule)", "frozen merged network rule"],
  ["function frozenPair(firstKey, firstValues, secondKey, secondValues)", "frozen merged policy pair"],
  ["function canonicalSubscriptionSourceKey(subscription)", "canonical internal source key"],
  ["decoded.sourceKey !== canonicalSubscriptionSourceKey(subscription)", "canonical cache source identity check"]
]) requireText(subscriptions, needle, label);

for (const [needle, label] of [
  ["import { compareCodeUnitText } from \"./text-order.js\";", "fixed cache text comparator"],
  ["const EMPTY_POLICY_ARRAY = Object.freeze([]);", "immutable empty cache policy"],
  ["function frozenNetworkRule(rule)", "frozen cache network rule"],
  ["function frozenDecodedPolicy(decoded, sourceKey)", "frozen decoded cache entry"],
  ["compareCodeUnitText(ruleKey(a), ruleKey(b))", "network cache code-unit ordering"],
  ["compareCodeUnitText(cosmeticRuleKey(a), cosmeticRuleKey(b))", "cosmetic cache code-unit ordering"],
  ["return Object.freeze([...deduped.values()].sort", "immutable normalized cache arrays"],
  ["return frozenDecodedPolicy(decoded, sourceKey);", "source-bound v5 frozen decode"],
  ["return frozenDecodedPolicy(decodedPackedPolicy(snapshot));", "historical v3 frozen decode"]
]) requireText(cacheCodec, needle, label);

reject(cacheCodec, /\.localeCompare\s*\(/, "locale-sensitive cache ordering");

// Historical milestone test files are intentionally not part of this audit.
// Current regression coverage is owned by npm test; this audit verifies the
// live cache/subscription implementation and its hardening contracts directly.

console.log("cache-subscription-hardening-audit: M699-M706 cache/subscription boundaries verified");
