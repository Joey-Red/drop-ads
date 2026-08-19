import test from "node:test";
import assert from "node:assert/strict";
import { createBackgroundRuntime } from "../src/core/runtime.js";
import { COOKIE_RULE_ID } from "../src/core/rules.js";
import { LIST_CACHE_KEY, STORAGE_KEY } from "../src/core/storage.js";
import { createFixtureFetch, createMockWebExtension } from "./helpers/mock-webextension.js";

const quietLogger = Object.freeze({ warn() {}, error() {} });

async function installWithRemoteFailure() {
  const mock = createMockWebExtension({ dynamicRuleLimit: 30_000 });
  const fixture = createFixtureFetch();
  fixture.setRemoteFailure(true);
  const runtime = createBackgroundRuntime({
    api: mock.api,
    fetchImpl: fixture.fetchImpl,
    now: () => 1_000_000,
    logger: quietLogger
  }).start();

  mock.events.runtimeInstalled.emit({ reason: "install" });
  await runtime.whenIdle();
  return { mock, fixture, runtime };
}

function activeRules(mock) {
  return [...mock.inspect.dynamicRules.values()];
}

function hasDomainRule(rules, domain) {
  return rules.some((rule) => rule.condition.requestDomains?.includes(domain));
}

test("fresh install activates bundled Drop Ads rules when every HTTPS source is unavailable", async () => {
  const { mock, fixture } = await installWithRemoteFailure();
  const state = mock.inspect.storageData[STORAGE_KEY];
  const cache = mock.inspect.storageData[LIST_CACHE_KEY];
  const rules = activeRules(mock);

  assert.equal(state.enabled, true);
  assert.equal(state.autoSubmitCommunity, false);
  assert.equal(state.subscriptions.some((item) => item.id === "drop-ads-default" && item.enabled), true);
  assert.equal(state.subscriptions.some((item) => item.id === "hagezi-pro-mini" && item.enabled), true);

  assert.ok(cache["drop-ads-default"], "packaged community list must seed last-known-good cache");
  assert.equal(Object.hasOwn(cache, "hagezi-pro-mini"), false, "unavailable upstream must not invent cache data");
  assert.ok(hasDomainRule(rules, "bundled.example"), "bundled community rule must be active");
  assert.equal(hasDomainRule(rules, "community.remote.example"), false);
  assert.equal(hasDomainRule(rules, "ads.bootstrap.example"), false);
  assert.ok(rules.some((rule) => rule.id === COOKIE_RULE_ID), "cookie policy remains active during list fallback");
  assert.equal(mock.inspect.menus.size, 4, "normal controls remain installed during list fallback");

  const localCalls = fixture.calls.filter((call) => call.url.startsWith("extension://"));
  assert.equal(localCalls.some((call) => call.url.endsWith("/lists/default.meta.json")), true);
  assert.equal(localCalls.some((call) => call.url.endsWith("/lists/default.txt")), true);

  const remoteCalls = fixture.calls.filter((call) => call.url.startsWith("https://"));
  assert.ok(remoteCalls.length >= 2);
  for (const call of remoteCalls) {
    assert.equal(call.options.credentials, "omit");
    assert.equal(call.options.referrerPolicy, "no-referrer");
    assert.equal(call.options.cache, "no-store");
    assert.equal(call.options.redirect, "error");
  }
});

test("later remote recovery replaces bundled community cache and restores other upstream rules transactionally", async () => {
  const { mock, fixture, runtime } = await installWithRemoteFailure();
  const stateBefore = structuredClone(mock.inspect.storageData[STORAGE_KEY]);

  fixture.setRemoteFailure(false);
  const response = await mock.sendMessage({ type: "drop-ads:refresh-lists", force: true });
  await runtime.whenIdle();

  assert.deepEqual(response, { ok: true, status: "updated" });
  const cache = mock.inspect.storageData[LIST_CACHE_KEY];
  const rules = activeRules(mock);

  assert.ok(cache["drop-ads-default"]);
  assert.ok(cache["hagezi-pro-mini"]);
  assert.ok(hasDomainRule(rules, "community.remote.example"));
  assert.ok(hasDomainRule(rules, "ads.bootstrap.example"));
  assert.equal(hasDomainRule(rules, "bundled.example"), false, "successful remote community refresh replaces seed data");
  assert.ok(rules.some((rule) => rule.id === COOKIE_RULE_ID));
  assert.equal(mock.inspect.menus.size, 4);

  const stateAfter = mock.inspect.storageData[STORAGE_KEY];
  assert.equal(stateAfter.enabled, stateBefore.enabled);
  assert.equal(stateAfter.autoSubmitCommunity, stateBefore.autoSubmitCommunity);
  assert.equal(stateAfter.cookieMode, stateBefore.cookieMode);
  assert.deepEqual(stateAfter.personalBlock, stateBefore.personalBlock);
  assert.deepEqual(stateAfter.personalAllow, stateBefore.personalAllow);
});
