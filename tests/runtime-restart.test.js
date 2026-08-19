import test from "node:test";
import assert from "node:assert/strict";
import { createBackgroundRuntime, LIST_REFRESH_ALARM } from "../src/core/runtime.js";
import { STORAGE_KEY } from "../src/core/storage.js";
import { SESSION_STORAGE_KEY } from "../src/core/session.js";
import { createFixtureFetch, createMockWebExtension } from "./helpers/mock-webextension.js";

const quietLogger = Object.freeze({ warn() {}, error() {} });

function newController(mock, fetchImpl) {
  return createBackgroundRuntime({
    api: mock.api,
    fetchImpl,
    now: () => 1_000_000,
    logger: quietLogger
  });
}

async function installed() {
  const mock = createMockWebExtension({ dynamicRuleLimit: 30_000 });
  const fixture = createFixtureFetch();
  const runtime = newController(mock, fixture.fetchImpl).start();
  mock.events.runtimeInstalled.emit({ reason: "install" });
  await runtime.whenIdle();
  return { mock, fixture, runtime };
}

test("cold controller recreation reuses persisted DNR/session policy without redundant rewrite", async () => {
  const { mock, fixture, runtime } = await installed();

  await mock.sendMessage({ type: "drop-ads:add-personal-rule", field: "personalBlock", rule: { kind: "domain", value: "restart-block.example" } });
  await mock.sendMessage({ type: "drop-ads:set-session-site-paused", domain: "restart-pause.example", paused: true });
  await runtime.whenIdle();

  const rulesBefore = structuredClone([...mock.inspect.dynamicRules.values()]);
  const stateBefore = structuredClone(mock.inspect.storageData[STORAGE_KEY]);
  const sessionBefore = structuredClone(mock.inspect.sessionData[SESSION_STORAGE_KEY]);
  mock.inspect.dnrUpdates.length = 0;
  mock.inspect.menus.clear();
  mock.inspect.alarms.clear();

  const restarted = newController(mock, fixture.fetchImpl);
  await restarted.initializeRuntime();
  await restarted.whenIdle();

  assert.deepEqual(mock.inspect.storageData[STORAGE_KEY], stateBefore);
  assert.deepEqual(mock.inspect.sessionData[SESSION_STORAGE_KEY], sessionBefore);
  assert.deepEqual([...mock.inspect.dynamicRules.values()], rulesBefore);
  assert.equal(mock.inspect.dnrUpdates.length, 0, "already-correct DNR must not be rewritten on worker restart");
  assert.ok(mock.inspect.menus.size >= 4);
  assert.deepEqual(mock.inspect.alarms.get(LIST_REFRESH_ALARM), { periodInMinutes: 720 });
});

test("cold controller recreation repairs a missing managed rule minimally", async () => {
  const { mock, fixture, runtime } = await installed();
  await mock.sendMessage({ type: "drop-ads:add-personal-rule", field: "personalBlock", rule: { kind: "domain", value: "restart-repair.example" } });
  await runtime.whenIdle();

  const personalRule = [...mock.inspect.dynamicRules.values()].find((rule) => rule.condition.requestDomains?.includes("restart-repair.example"));
  assert.ok(personalRule);
  mock.inspect.dynamicRules.delete(personalRule.id);
  mock.inspect.dnrUpdates.length = 0;

  const restarted = newController(mock, fixture.fetchImpl);
  await restarted.initializeRuntime();
  await restarted.whenIdle();

  assert.equal(mock.inspect.dnrUpdates.length, 1);
  assert.deepEqual(mock.inspect.dnrUpdates[0].removeRuleIds, []);
  assert.deepEqual(mock.inspect.dnrUpdates[0].addRules.map((rule) => rule.id), [personalRule.id]);
});

test("session pause survives worker recreation but disappears when browser session storage resets", async () => {
  const { mock, fixture, runtime } = await installed();
  await mock.sendMessage({ type: "drop-ads:set-session-site-paused", domain: "session-only.example", paused: true });
  await runtime.whenIdle();

  const restarted = newController(mock, fixture.fetchImpl);
  const beforeReset = await restarted.uiStateSnapshot();
  assert.deepEqual(beforeReset.session.disabledSites, ["session-only.example"]);

  delete mock.inspect.sessionData[SESSION_STORAGE_KEY];
  const afterBrowserRestart = newController(mock, fixture.fetchImpl);
  await afterBrowserRestart.initializeRuntime();
  const afterReset = await afterBrowserRestart.uiStateSnapshot();
  assert.deepEqual(afterReset.session.disabledSites, []);
});
