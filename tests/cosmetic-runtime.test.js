import test from "node:test";
import assert from "node:assert/strict";
import { encodeCacheEntry } from "../src/core/cache-codec.js";
import { buildCosmeticPolicy, installCosmeticRuntime } from "../src/core/cosmetic-runtime.js";
import { DEFAULT_STATE, LIST_CACHE_KEY, STORAGE_KEY } from "../src/core/storage.js";
import { HAGEZI_PRO_MINI_SUBSCRIPTION } from "../src/core/subscriptions.js";
import { createMockWebExtension } from "./helpers/mock-webextension.js";

function state(overrides = {}) {
  return {
    ...structuredClone(DEFAULT_STATE),
    personalCosmeticHide: [],
    personalCosmeticAllow: [],
    ...overrides
  };
}

function sharedCache() {
  return {
    [HAGEZI_PRO_MINI_SUBSCRIPTION.id]: encodeCacheEntry({
      block: [],
      allow: [],
      cosmeticHide: [{ selector: ".shared" }, { selector: ".shared-except" }, { selector: ".personal" }],
      cosmeticAllow: [{ selector: ".shared-except" }, { selector: ".personal" }]
    }, 123456)
  };
}

test("cosmetic policy obeys global/site/session disable and tiered precedence", () => {
  const base = state({
    personalCosmeticHide: [{ selector: ".personal", domains: ["example.com"] }, { selector: ".user-off" }],
    personalCosmeticAllow: [{ selector: ".user-off" }]
  });
  const policy = buildCosmeticPolicy({ hostname: "news.example.com", state: base, session: { disabledSites: [] }, cache: sharedCache() });
  assert.equal(policy.enabled, true);
  assert.equal(policy.selectorCount, 2);
  assert.match(policy.stylesheet, /\.personal/);
  assert.match(policy.stylesheet, /\.shared/);
  assert.doesNotMatch(policy.stylesheet, /shared-except|user-off/);

  for (const disabled of [
    { ...base, enabled: false },
    { ...base, disabledSites: ["example.com"] }
  ]) {
    assert.deepEqual(buildCosmeticPolicy({ hostname: "news.example.com", state: disabled, session: { disabledSites: [] }, cache: sharedCache() }), { enabled: false, selectorCount: 0, stylesheet: "" });
  }
  assert.deepEqual(buildCosmeticPolicy({ hostname: "news.example.com", state: base, session: { disabledSites: ["example.com"] }, cache: sharedCache() }), { enabled: false, selectorCount: 0, stylesheet: "" });
});

test("shared cosmetics never apply to private pages while personal local rules still can", () => {
  const policy = buildCosmeticPolicy({
    hostname: "127.0.0.1",
    state: state({ personalCosmeticHide: [{ selector: ".local-only", domains: ["127.0.0.1"] }] }),
    session: { disabledSites: [] },
    cache: sharedCache()
  });
  assert.equal(policy.enabled, true);
  assert.equal(policy.selectorCount, 1);
  assert.match(policy.stylesheet, /local-only/);
  assert.doesNotMatch(policy.stylesheet, /\.shared/);
});

test("runtime cosmetic add/remove relies on one storage-driven refresh fanout", async () => {
  const mock = createMockWebExtension({
    initialStorage: { [STORAGE_KEY]: state() },
    initialTabs: [{ id: 11, url: "https://example.com/" }, { id: 12, url: "https://example.net/" }]
  });
  const runtime = installCosmeticRuntime({ api: mock.api, logger: { warn() {} } });

  const add = await mock.sendMessage({ type: "drop-ads:add-cosmetic-rule", field: "personalCosmeticHide", rule: { selector: ".manual", domains: ["example.com"] } });
  assert.equal(add.ok, true);
  await runtime.whenIdle();
  assert.equal(mock.inspect.tabMessages.length, 2);

  const policy = await mock.sendMessage({ type: "drop-ads:get-cosmetic-policy" }, { url: "https://www.example.com/page" });
  assert.equal(policy.ok, true);
  assert.match(policy.policy.stylesheet, /\.manual/);

  const saved = mock.inspect.storageData[STORAGE_KEY];
  const key = `${saved.personalCosmeticHide[0].selector}\u0000example.com\u0000`;
  const remove = await mock.sendMessage({ type: "drop-ads:remove-cosmetic-rule", field: "personalCosmeticHide", key });
  assert.equal(remove.ok, true);
  await runtime.whenIdle();
  assert.equal(mock.inspect.tabMessages.length, 4);
});

test("cache and session storage changes both request live cosmetic refresh", async () => {
  const mock = createMockWebExtension({ initialStorage: { [STORAGE_KEY]: state() }, initialTabs: [{ id: 7 }] });
  const runtime = installCosmeticRuntime({ api: mock.api, logger: { warn() {} } });
  await mock.api.storage.local.set({ [LIST_CACHE_KEY]: {} });
  await runtime.whenIdle();
  await mock.api.storage.session.set({ dropAdsSessionState: { disabledSites: ["example.com"] } });
  await runtime.whenIdle();
  assert.equal(mock.inspect.tabMessages.length, 2);
});

test("same-tick storage invalidation bursts coalesce into one cosmetic refresh", async () => {
  const mock = createMockWebExtension({ initialStorage: { [STORAGE_KEY]: state() }, initialTabs: [{ id: 9 }] });
  const runtime = installCosmeticRuntime({ api: mock.api, logger: { warn() {} } });
  const writes = [
    mock.api.storage.local.set({ [LIST_CACHE_KEY]: {} }),
    mock.api.storage.session.set({ dropAdsSessionState: { disabledSites: ["one.example"] } }),
    mock.api.storage.local.set({ [LIST_CACHE_KEY]: { second: true } })
  ];
  await Promise.all(writes);
  await runtime.whenIdle();
  assert.equal(mock.inspect.tabMessages.length, 1);
  assert.equal(mock.inspect.tabMessages[0].message.type, "drop-ads:cosmetic-refresh");
});
