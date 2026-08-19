import test from "node:test";
import assert from "node:assert/strict";
import { createBackgroundRuntime } from "../src/core/runtime.js";
import { SESSION_STORAGE_KEY } from "../src/core/session.js";
import { HAGEZI_PRO_MINI_SUBSCRIPTION } from "../src/core/subscriptions.js";
import { STORAGE_KEY } from "../src/core/storage.js";
import { createFixtureFetch, createMockWebExtension } from "./helpers/mock-webextension.js";

const quietLogger = Object.freeze({ warn() {}, error() {} });

async function installedRuntime() {
  const mock = createMockWebExtension({ dynamicRuleLimit: 30_000 });
  const fixture = createFixtureFetch();
  const runtime = createBackgroundRuntime({ api: mock.api, fetchImpl: fixture.fetchImpl, now: () => 1_000_000, logger: quietLogger }).start();
  mock.events.runtimeInstalled.emit({ reason: "install" });
  await runtime.whenIdle();
  return { mock, runtime };
}

test("changing only community auto-submit preference does not rewrite managed DNR", async () => {
  const { mock, runtime } = await installedRuntime();
  const beforeRules = structuredClone([...mock.inspect.dynamicRules.values()]);
  const beforeUpdates = mock.inspect.dnrUpdates.length;
  const current = structuredClone(mock.inspect.storageData[STORAGE_KEY]);
  await mock.api.storage.local.set({ [STORAGE_KEY]: { ...current, autoSubmitCommunity: !current.autoSubmitCommunity } });
  await runtime.whenIdle();
  assert.equal(mock.inspect.storageData[STORAGE_KEY].autoSubmitCommunity, !current.autoSubmitCommunity);
  assert.equal(mock.inspect.dnrUpdates.length, beforeUpdates);
  assert.deepEqual([...mock.inspect.dynamicRules.values()], beforeRules);
});

test("cosmetic-only personal state changes do not rewrite managed DNR", async () => {
  const { mock, runtime } = await installedRuntime();
  const beforeRules = structuredClone([...mock.inspect.dynamicRules.values()]);
  const beforeUpdates = mock.inspect.dnrUpdates.length;
  const current = structuredClone(mock.inspect.storageData[STORAGE_KEY]);
  await mock.api.storage.local.set({
    [STORAGE_KEY]: {
      ...current,
      personalCosmeticHide: [{ selector: ".sponsor", domains: ["example.com"] }],
      personalCosmeticAllow: [{ selector: ".needed", domains: ["example.com"] }]
    }
  });
  await runtime.whenIdle();
  assert.equal(mock.inspect.dnrUpdates.length, beforeUpdates);
  assert.deepEqual([...mock.inspect.dynamicRules.values()], beforeRules);
});

test("successful persistent policy transaction performs one DNR replacement, not transaction plus self-repair", async () => {
  const { mock, runtime } = await installedRuntime();
  const beforeUpdates = mock.inspect.dnrUpdates.length;
  const result = await mock.sendMessage({ type: "drop-ads:set-enabled", enabled: false });
  await runtime.whenIdle();
  assert.equal(result.ok, true);
  assert.equal(result.result.changed, true);
  assert.equal(mock.inspect.storageData[STORAGE_KEY].enabled, false);
  assert.equal(mock.inspect.dnrUpdates.length, beforeUpdates + 1);
});

test("successful session policy transaction performs one DNR replacement, not transaction plus self-repair", async () => {
  const { mock, runtime } = await installedRuntime();
  const beforeUpdates = mock.inspect.dnrUpdates.length;
  const result = await mock.sendMessage({ type: "drop-ads:set-session-site-paused", domain: "paused-once.example", paused: true });
  await runtime.whenIdle();
  assert.equal(result.ok, true);
  assert.equal(result.result.changed, true);
  assert.deepEqual(mock.inspect.sessionData[SESSION_STORAGE_KEY], { disabledSites: ["paused-once.example"] });
  assert.equal(mock.inspect.dnrUpdates.length, beforeUpdates + 1);
});

test("successful subscription mutation performs one DNR replacement, not transaction plus self-repair", async () => {
  const { mock, runtime } = await installedRuntime();
  const beforeUpdates = mock.inspect.dnrUpdates.length;
  const result = await mock.sendMessage({ type: "drop-ads:set-subscription-enabled", id: HAGEZI_PRO_MINI_SUBSCRIPTION.id, enabled: false });
  await runtime.whenIdle();
  assert.equal(result.ok, true);
  assert.equal(result.subscription.enabled, false);
  assert.equal(mock.inspect.dnrUpdates.length, beforeUpdates + 1);
});

test("external/legacy policy-relevant local state changes still trigger repair synchronization", async () => {
  const { mock, runtime } = await installedRuntime();
  const beforeUpdates = mock.inspect.dnrUpdates.length;
  const current = structuredClone(mock.inspect.storageData[STORAGE_KEY]);
  await mock.api.storage.local.set({ [STORAGE_KEY]: { ...current, personalBlock: [...current.personalBlock, { kind: "domain", value: "external-repair.example" }] } });
  await runtime.whenIdle();
  assert.equal(mock.inspect.dnrUpdates.length, beforeUpdates + 1);
  assert.ok([...mock.inspect.dynamicRules.values()].some((rule) => rule.condition.requestDomains?.includes("external-repair.example")));
});

test("external/legacy session state changes still trigger repair synchronization", async () => {
  const { mock, runtime } = await installedRuntime();
  const beforeUpdates = mock.inspect.dnrUpdates.length;
  await mock.api.storage.session.set({ [SESSION_STORAGE_KEY]: { disabledSites: ["external-session.example"] } });
  await runtime.whenIdle();
  assert.equal(mock.inspect.dnrUpdates.length, beforeUpdates + 1);
  assert.ok([...mock.inspect.dynamicRules.values()].some((rule) => rule.condition.requestDomains?.includes("external-session.example")));
});
