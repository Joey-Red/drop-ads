import test from "node:test";
import assert from "node:assert/strict";
import { createBackgroundRuntime, LIST_REFRESH_ALARM, MENU_BLOCK_DEFAULT, MENU_BLOCK_DOMAIN, MENU_BLOCK_EXACT, MENU_PARENT } from "../src/core/runtime.js";
import { LIST_CACHE_KEY, STORAGE_KEY } from "../src/core/storage.js";
import { COOKIE_RULE_ID, RULE_TIERS } from "../src/core/rules.js";
import { SESSION_STORAGE_KEY } from "../src/core/session.js";
import { createFixtureFetch, createMockWebExtension } from "./helpers/mock-webextension.js";

const quietLogger = Object.freeze({ warn() {}, error() {} });

async function installRuntime(limit) {
  const mock = createMockWebExtension({ dynamicRuleLimit: limit });
  const fixture = createFixtureFetch();
  const runtime = createBackgroundRuntime({ api: mock.api, fetchImpl: fixture.fetchImpl, now: () => 1_000_000, logger: quietLogger }).start();
  mock.events.runtimeInstalled.emit({ reason: "install" });
  await runtime.whenIdle();
  return { mock, fixture, runtime };
}

for (const [browserName, limit] of [["Chromium", 30_000], ["Firefox", 5_000]]) {
  test(`${browserName} contract initializes blocking, menus, cache, and privacy-safe fetches`, async () => {
    const { mock, fixture, runtime } = await installRuntime(limit);
    const state = mock.inspect.storageData[STORAGE_KEY];
    const cache = mock.inspect.storageData[LIST_CACHE_KEY];
    const rules = [...mock.inspect.dynamicRules.values()];

    assert.equal(runtime.dynamicRuleLimit(), limit);
    assert.equal(state.enabled, true);
    assert.equal(state.autoSubmitCommunity, false);
    assert.equal(state.cookieMode, "third-party");
    assert.equal(Object.hasOwn(state, "communityBlock"), false);
    assert.equal(Object.hasOwn(state, "communityAllow"), false);
    assert.equal(state.subscriptions.some((item) => item.id === "drop-ads-default"), true);
    assert.equal(state.subscriptions.some((item) => item.id === "hagezi-pro-mini"), true);
    assert.ok(cache["drop-ads-default"]);
    assert.ok(cache["hagezi-pro-mini"]);
    assert.equal(mock.inspect.menus.size, 4);
    assert.equal(mock.inspect.menus.get(MENU_BLOCK_DEFAULT).title, "Block ad/resource locally");
    assert.equal(mock.inspect.menus.get(MENU_BLOCK_DEFAULT).parentId, undefined);
    assert.equal(mock.inspect.menus.get(MENU_PARENT).title, "Drop Ads: advanced blocking");
    assert.equal(mock.inspect.menus.get(MENU_BLOCK_EXACT).parentId, MENU_PARENT);
    assert.equal(mock.inspect.menus.get(MENU_BLOCK_DOMAIN).parentId, MENU_PARENT);
    assert.deepEqual(mock.inspect.alarms.get(LIST_REFRESH_ALARM), { periodInMinutes: 720 });
    assert.ok(rules.some((rule) => rule.id === COOKIE_RULE_ID && rule.action.type === "modifyHeaders"));
    assert.ok(rules.some((rule) => rule.condition.requestDomains?.includes("ads.bootstrap.example")));

    const remoteCalls = fixture.calls.filter((call) => call.url.startsWith("https://"));
    assert.ok(remoteCalls.length >= 2);
    for (const call of remoteCalls) {
      assert.equal(call.options.credentials, "omit");
      assert.equal(call.options.referrerPolicy, "no-referrer");
      assert.equal(call.options.cache, "no-store");
    }

    const forbiddenStateKeys = Object.keys(state).filter((key) => /telemetry|analytics|history|stat|counter|identifier/i.test(key));
    assert.deepEqual(forbiddenStateKeys, []);
    assert.deepEqual(mock.inspect.tabs, []);
  });
}

test("one-click context blocking defaults to a local domain rule", async () => {
  const { mock, runtime } = await installRuntime(30_000);

  mock.events.menuClicked.emit({
    menuItemId: MENU_BLOCK_DEFAULT,
    srcUrl: "https://ads.oneclick.example/banner.js?private=value#fragment"
  });
  await runtime.whenIdle();

  const state = mock.inspect.storageData[STORAGE_KEY];
  assert.ok(state.personalBlock.some((rule) => rule.kind === "domain" && rule.value === "ads.oneclick.example"));
  assert.equal(state.personalBlock.some((rule) => rule.kind === "url" && rule.value.includes("ads.oneclick.example")), false);
  assert.deepEqual(mock.inspect.tabs, []);
});

test("context-menu blocks stay local unless contribution is explicitly enabled", async () => {
  const { mock, runtime } = await installRuntime(30_000);

  mock.events.menuClicked.emit({
    menuItemId: MENU_BLOCK_EXACT,
    srcUrl: "https://ads.click.example/banner.js?local-secret=abc#fragment"
  });
  await runtime.whenIdle();

  let state = mock.inspect.storageData[STORAGE_KEY];
  assert.ok(state.personalBlock.some((rule) => rule.kind === "url" && rule.value === "https://ads.click.example/banner.js?local-secret=abc"));
  assert.deepEqual(mock.inspect.tabs, []);

  state = structuredClone(state);
  state.autoSubmitCommunity = true;
  await mock.api.storage.local.set({ [STORAGE_KEY]: state });
  await runtime.whenIdle();

  mock.events.menuClicked.emit({
    menuItemId: MENU_BLOCK_EXACT,
    srcUrl: "https://submit.example/private/ad.js?token=do-not-submit"
  });
  await runtime.whenIdle();

  assert.equal(mock.inspect.tabs.length, 1);
  const issueUrl = new URL(mock.inspect.tabs[0].url);
  const issueBody = issueUrl.searchParams.get("body");
  assert.match(issueBody, /block domain submit\.example/);
  assert.doesNotMatch(issueBody, /token=do-not-submit|private\/ad\.js/);

  mock.events.menuClicked.emit({
    menuItemId: MENU_BLOCK_DOMAIN,
    linkUrl: "https://domain-only.example/path/to/page"
  });
  await runtime.whenIdle();
  state = mock.inspect.storageData[STORAGE_KEY];
  assert.ok(state.personalBlock.some((rule) => rule.kind === "domain" && rule.value === "domain-only.example"));
});

test("per-site disable and cookie exceptions synchronize into active DNR rules", async () => {
  const { mock, runtime } = await installRuntime(5_000);
  const state = structuredClone(mock.inspect.storageData[STORAGE_KEY]);
  state.disabledSites = ["news.example"];
  state.cookieAllowSites = ["login.example"];
  state.cookieMode = "all";
  state.personalBlock.push({ kind: "domain", value: "tracker.example" });
  await mock.api.storage.local.set({ [STORAGE_KEY]: state });
  await runtime.whenIdle();

  const rules = [...mock.inspect.dynamicRules.values()];
  const cookieRule = rules.find((rule) => rule.id === COOKIE_RULE_ID);
  assert.deepEqual(cookieRule.condition.excludedInitiatorDomains, ["login.example", "news.example"]);
  assert.deepEqual(cookieRule.condition.excludedRequestDomains, ["login.example", "news.example"]);

  const personalBlock = rules.find((rule) => rule.id >= RULE_TIERS.personalBlock.idStart && rule.id <= RULE_TIERS.personalBlock.idEnd);
  assert.ok(personalBlock.condition.requestDomains.includes("tracker.example"));
  assert.deepEqual(personalBlock.condition.excludedInitiatorDomains, ["news.example"]);

  const personalAllow = rules.find((rule) => rule.id >= RULE_TIERS.personalAllow.idStart && rule.id <= RULE_TIERS.personalAllow.idEnd);
  assert.ok(personalAllow.condition.requestDomains.includes("news.example"));
});

test("session-only site pause affects blocking and cookies without touching persistent exceptions", async () => {
  const { mock, runtime } = await installRuntime(5_000);
  const localBefore = structuredClone(mock.inspect.storageData[STORAGE_KEY]);

  await mock.api.storage.session.set({
    [SESSION_STORAGE_KEY]: { disabledSites: ["paused.example"] }
  });
  await runtime.whenIdle();

  assert.deepEqual(mock.inspect.storageData[STORAGE_KEY].disabledSites, localBefore.disabledSites);
  assert.deepEqual(mock.inspect.sessionData[SESSION_STORAGE_KEY], { disabledSites: ["paused.example"] });

  const rules = [...mock.inspect.dynamicRules.values()];
  const cookieRule = rules.find((rule) => rule.id === COOKIE_RULE_ID);
  assert.ok(cookieRule.condition.excludedInitiatorDomains.includes("paused.example"));
  assert.ok(cookieRule.condition.excludedRequestDomains.includes("paused.example"));

  const personalAllow = rules.find((rule) => rule.id >= RULE_TIERS.personalAllow.idStart && rule.id <= RULE_TIERS.personalAllow.idEnd);
  assert.ok(personalAllow.condition.requestDomains.includes("paused.example"));
  const communityBlock = rules.find((rule) => rule.id >= RULE_TIERS.communityBlock.idStart && rule.id <= RULE_TIERS.communityBlock.idEnd);
  assert.ok(communityBlock.condition.excludedInitiatorDomains.includes("paused.example"));
});

test("remote refresh failure keeps last-known-good cache and rules", async () => {
  const { mock, fixture, runtime } = await installRuntime(30_000);
  const cacheBefore = structuredClone(mock.inspect.storageData[LIST_CACHE_KEY]);
  const rulesBefore = structuredClone([...mock.inspect.dynamicRules.values()]);

  fixture.setRemoteFailure(true);
  const response = await mock.sendMessage({ type: "drop-ads:refresh-lists", force: true });
  await runtime.whenIdle();

  assert.deepEqual(response, { ok: true, status: "fallback" });
  assert.deepEqual(mock.inspect.storageData[LIST_CACHE_KEY], cacheBefore);
  assert.deepEqual([...mock.inspect.dynamicRules.values()], rulesBefore);
});

test("failed refresh repair leaves cache and the pre-attempt DNR state unchanged", async () => {
  const { mock, runtime } = await installRuntime(30_000);
  const cacheBefore = structuredClone(mock.inspect.storageData[LIST_CACHE_KEY]);
  const victimId = [...mock.inspect.dynamicRules.keys()][0];
  mock.inspect.dynamicRules.delete(victimId);
  const rulesBeforeAttempt = structuredClone([...mock.inspect.dynamicRules.values()]);

  mock.inspect.failNextDynamicUpdate();
  const response = await mock.sendMessage({ type: "drop-ads:refresh-lists", force: true });
  await runtime.whenIdle();

  assert.equal(response.ok, false);
  assert.deepEqual(mock.inspect.storageData[LIST_CACHE_KEY], cacheBefore);
  assert.deepEqual([...mock.inspect.dynamicRules.values()], rulesBeforeAttempt);
});

test("failed queued refresh repair reaches idle and a later refresh repairs missing managed rules", async () => {
  const { mock, runtime } = await installRuntime(30_000);
  const victimId = [...mock.inspect.dynamicRules.keys()][0];
  const victimRule = structuredClone(mock.inspect.dynamicRules.get(victimId));
  mock.inspect.dynamicRules.delete(victimId);
  const cacheBefore = structuredClone(mock.inspect.storageData[LIST_CACHE_KEY]);
  const rulesBeforeAttempt = structuredClone([...mock.inspect.dynamicRules.values()]);

  mock.inspect.failNextDynamicUpdate();
  const failed = await mock.sendMessage({ type: "drop-ads:refresh-lists", force: true });
  assert.equal(failed.ok, false);
  await runtime.whenIdle();
  assert.deepEqual(mock.inspect.storageData[LIST_CACHE_KEY], cacheBefore);
  assert.deepEqual([...mock.inspect.dynamicRules.values()], rulesBeforeAttempt);

  const recovered = await mock.sendMessage({ type: "drop-ads:refresh-lists", force: true });
  assert.equal(recovered.ok, true);
  await runtime.whenIdle();
  assert.deepEqual(mock.inspect.dynamicRules.get(victimId), victimRule);
  assert.ok([...mock.inspect.dynamicRules.values()].some((rule) => rule.condition.requestDomains?.includes("ads.bootstrap.example")));
});

test("failed queued context-menu task does not poison the next local block", async () => {
  const { mock, runtime } = await installRuntime(30_000);

  mock.events.menuClicked.emit({ menuItemId: MENU_BLOCK_EXACT, srcUrl: "not-a-valid-url" });
  await runtime.whenIdle();

  mock.events.menuClicked.emit({ menuItemId: MENU_BLOCK_DOMAIN, srcUrl: "https://recovered-task.example/ad.js" });
  await runtime.whenIdle();

  const state = mock.inspect.storageData[STORAGE_KEY];
  assert.ok(state.personalBlock.some((rule) => rule.kind === "domain" && rule.value === "recovered-task.example"));
});

test("failed queued rule synchronization reaches idle and the next state change activates", async () => {
  const { mock, runtime } = await installRuntime(30_000);
  const first = structuredClone(mock.inspect.storageData[STORAGE_KEY]);
  first.personalBlock.push({ kind: "domain", value: "first-sync.example" });

  mock.inspect.failNextDynamicUpdate();
  await mock.api.storage.local.set({ [STORAGE_KEY]: first });
  await runtime.whenIdle();
  assert.equal([...mock.inspect.dynamicRules.values()].some((rule) => rule.condition.requestDomains?.includes("first-sync.example")), false);

  const second = structuredClone(mock.inspect.storageData[STORAGE_KEY]);
  second.personalBlock.push({ kind: "domain", value: "recovered-sync.example" });
  await mock.api.storage.local.set({ [STORAGE_KEY]: second });
  await runtime.whenIdle();

  const rules = [...mock.inspect.dynamicRules.values()];
  assert.ok(rules.some((rule) => rule.condition.requestDomains?.includes("first-sync.example")));
  assert.ok(rules.some((rule) => rule.condition.requestDomains?.includes("recovered-sync.example")));
});

test("failed DNR replacement is atomic and the next synchronization recovers", async () => {
  const { mock, runtime } = await installRuntime(30_000);
  const before = structuredClone([...mock.inspect.dynamicRules.values()]);
  const state = structuredClone(mock.inspect.storageData[STORAGE_KEY]);
  state.personalBlock.push({ kind: "domain", value: "atomic.example" });
  mock.inspect.storageData[STORAGE_KEY] = state;

  mock.inspect.failNextDynamicUpdate();
  await assert.rejects(runtime.syncRules(), /simulated atomic DNR failure/);
  assert.deepEqual([...mock.inspect.dynamicRules.values()], before);

  await runtime.syncRules();
  assert.ok([...mock.inspect.dynamicRules.values()].some((rule) => rule.condition.requestDomains?.includes("atomic.example")));
});
