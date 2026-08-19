import test from "node:test";
import assert from "node:assert/strict";
import { encodeCacheEntry } from "../src/core/cache-codec.js";
import { DEFAULT_COMMUNITY_SUBSCRIPTION, HAGEZI_PRO_MINI_SUBSCRIPTION, mergeCachedCosmeticRules, normalizeSubscriptions } from "../src/core/subscriptions.js";

test("cosmetic cache merges only enabled sources and deduplicates selectors", () => {
  const subscriptions = normalizeSubscriptions([
    { ...DEFAULT_COMMUNITY_SUBSCRIPTION },
    { ...HAGEZI_PRO_MINI_SUBSCRIPTION, enabled: false }
  ]);
  const cache = {
    [DEFAULT_COMMUNITY_SUBSCRIPTION.id]: encodeCacheEntry({
      block: [], allow: [], cosmeticHide: [{ selector: ".ad" }, { selector: ".ad" }], cosmeticAllow: [{ selector: ".needed" }]
    }, 1000),
    [HAGEZI_PRO_MINI_SUBSCRIPTION.id]: encodeCacheEntry({ block: [], allow: [], cosmeticHide: [{ selector: ".disabled" }], cosmeticAllow: [] }, 1000)
  };
  assert.deepEqual(mergeCachedCosmeticRules(subscriptions, cache), {
    hide: [{ selector: ".ad" }],
    allow: [{ selector: ".needed" }]
  });
});

test("unsafe legacy cosmetic scopes are revalidated and discarded", () => {
  const subscriptions = normalizeSubscriptions([{ ...DEFAULT_COMMUNITY_SUBSCRIPTION }]);
  const cache = {
    [DEFAULT_COMMUNITY_SUBSCRIPTION.id]: {
      block: [], allow: [],
      cosmeticHide: [{ selector: ".safe", domains: ["example.com"] }, { selector: ".lan", domains: ["192.168.1.1"] }],
      cosmeticAllow: [],
      nextRefreshAt: 0
    }
  };
  assert.deepEqual(mergeCachedCosmeticRules(subscriptions, cache), {
    hide: [{ selector: ".safe", domains: ["example.com"] }],
    allow: []
  });
});
