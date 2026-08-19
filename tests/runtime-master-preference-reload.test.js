import test from "node:test";
import assert from "node:assert/strict";
import { createBackgroundRuntime } from "../src/core/runtime.js";
import { STORAGE_KEY } from "../src/core/storage.js";
import { createFixtureFetch, createMockWebExtension } from "./helpers/mock-webextension.js";

const quietLogger = Object.freeze({ warn() {}, error() {} });

async function installedRuntime() {
  const mock = createMockWebExtension({ dynamicRuleLimit: 30_000 });
  const fixture = createFixtureFetch();
  const runtime = createBackgroundRuntime({
    api: mock.api,
    fetchImpl: fixture.fetchImpl,
    now: () => 1_000_000,
    logger: quietLogger
  }).start();
  mock.events.runtimeInstalled.emit({ reason: "install" });
  await runtime.whenIdle();
  return { mock, runtime };
}

test("master preference is durable before DNR activation can be interrupted by reload", async () => {
  const { mock, runtime } = await installedRuntime();
  const disabled = await mock.sendMessage({ type: "drop-ads:set-enabled", enabled: false });
  await runtime.whenIdle();
  assert.equal(disabled.ok, true);
  assert.equal(mock.inspect.storageData[STORAGE_KEY].enabled, false);
  assert.equal(mock.inspect.dynamicRules.size, 0);

  const originalUpdate = mock.api.declarativeNetRequest.updateDynamicRules;
  let releaseUpdate;
  let enteredUpdate;
  const updateEntered = new Promise((resolve) => { enteredUpdate = resolve; });
  const updateGate = new Promise((resolve) => { releaseUpdate = resolve; });
  let gateNextUpdate = true;
  mock.api.declarativeNetRequest.updateDynamicRules = async (changes) => {
    if (gateNextUpdate) {
      gateNextUpdate = false;
      enteredUpdate();
      await updateGate;
    }
    return originalUpdate(changes);
  };

  const enabling = mock.sendMessage({ type: "drop-ads:set-enabled", enabled: true });
  await updateEntered;

  assert.equal(mock.inspect.storageData[STORAGE_KEY].enabled, true,
    "a reload during DNR work must restart from the newly selected preference");
  assert.equal(mock.inspect.dynamicRules.size, 0, "the test must still be paused before DNR activation");

  releaseUpdate();
  const enabled = await enabling;
  await runtime.whenIdle();
  assert.equal(enabled.ok, true);
  assert.equal(mock.inspect.storageData[STORAGE_KEY].enabled, true);
  assert.ok(mock.inspect.dynamicRules.size > 0);
});

test("failed global DNR activation restores the previous durable preference", async () => {
  const { mock, runtime } = await installedRuntime();
  await mock.sendMessage({ type: "drop-ads:set-enabled", enabled: false });
  await runtime.whenIdle();
  mock.inspect.failNextDynamicUpdate();

  const response = await mock.sendMessage({ type: "drop-ads:set-enabled", enabled: true });
  await runtime.whenIdle();

  assert.equal(response.ok, false);
  assert.equal(mock.inspect.storageData[STORAGE_KEY].enabled, false);
  assert.equal(mock.inspect.dynamicRules.size, 0);
});
