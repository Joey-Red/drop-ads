import test from "node:test";
import assert from "node:assert/strict";
import { createBackgroundRuntime, LIST_REFRESH_ALARM, MENU_BLOCK_DEFAULT } from "../src/core/runtime.js";
import { STORAGE_KEY } from "../src/core/storage.js";
import { createMockWebExtension } from "./helpers/mock-webextension.js";

function runtimeFor(mock, fetchCalls = []) {
  const runtime = createBackgroundRuntime({
    api: mock.api,
    fetchImpl: async (...args) => {
      fetchCalls.push(args);
      throw new Error("unexpected fetch");
    }
  });
  runtime.start();
  return runtime;
}

test("background context and alarm routing never invokes accessor or inherited fields", async () => {
  const mock = createMockWebExtension();
  const fetchCalls = [];
  const runtime = runtimeFor(mock, fetchCalls);
  let reads = 0;

  const info = {};
  Object.defineProperty(info, "menuItemId", { enumerable: true, get() { reads += 1; return MENU_BLOCK_DEFAULT; } });
  Object.defineProperty(info, "srcUrl", { enumerable: true, get() { reads += 1; return "https://getter.example/ad.png"; } });
  mock.events.menuClicked.emit(info);
  mock.events.menuClicked.emit(Object.create({ menuItemId: MENU_BLOCK_DEFAULT, srcUrl: "https://inherited.example/ad.png" }));

  const alarm = {};
  Object.defineProperty(alarm, "name", { enumerable: true, get() { reads += 1; return LIST_REFRESH_ALARM; } });
  mock.events.alarmEvent.emit(alarm);
  mock.events.alarmEvent.emit(Object.create({ name: LIST_REFRESH_ALARM }));

  await runtime.whenIdle();
  assert.equal(reads, 0);
  assert.equal(mock.inspect.storageData[STORAGE_KEY], undefined);
  assert.equal(fetchCalls.length, 0);
});

test("background runtime messages ignore accessor and inherited fields without queueing work", async () => {
  const mock = createMockWebExtension();
  const runtime = runtimeFor(mock);
  let reads = 0;
  let responseCalled = false;

  const message = { type: "drop-ads:set-enabled" };
  Object.defineProperty(message, "enabled", { enumerable: true, get() { reads += 1; return false; } });
  const result = mock.events.runtimeMessage.emit(message, {}, () => { responseCalled = true; });
  assert.deepEqual(result, [false]);
  assert.deepEqual(mock.events.runtimeMessage.emit(Object.create({ type: "drop-ads:get-ui-state" }), {}, () => {}), [false]);

  await runtime.whenIdle();
  assert.equal(reads, 0);
  assert.equal(responseCalled, false);
  assert.equal(mock.inspect.storageData[STORAGE_KEY], undefined);
});

test("background storage repair discrimination never invokes nested accessors or array element getters", async () => {
  const mock = createMockWebExtension();
  const runtime = runtimeFor(mock);
  let reads = 0;

  const changes = {};
  Object.defineProperty(changes, STORAGE_KEY, {
    enumerable: true,
    get() { reads += 1; return { oldValue: {}, newValue: {} }; }
  });
  mock.events.storageChanged.emit(changes, "local");

  const nested = { [STORAGE_KEY]: {} };
  Object.defineProperty(nested[STORAGE_KEY], "newValue", {
    enumerable: true,
    get() { reads += 1; return { enabled: false }; }
  });
  mock.events.storageChanged.emit(nested, "local");

  const subscriptions = [];
  Object.defineProperty(subscriptions, "0", {
    enumerable: true,
    configurable: true,
    get() { reads += 1; return { id: "getter", enabled: true }; }
  });
  subscriptions.length = 1;
  mock.events.storageChanged.emit({
    [STORAGE_KEY]: {
      oldValue: { enabled: true, subscriptions: [] },
      newValue: { enabled: true, subscriptions }
    }
  }, "local");

  await runtime.whenIdle();
  assert.equal(reads, 0);
  assert.equal(mock.inspect.dnrUpdates.length, 0);
});

test("valid own-data context event still commits one local domain block", async () => {
  const mock = createMockWebExtension();
  const runtime = runtimeFor(mock);
  mock.events.menuClicked.emit({
    menuItemId: MENU_BLOCK_DEFAULT,
    srcUrl: "https://ads.valid-runtime.example/banner.png"
  });
  await runtime.whenIdle();
  assert.deepEqual(mock.inspect.storageData[STORAGE_KEY].personalBlock, [
    { kind: "domain", value: "ads.valid-runtime.example" }
  ]);
});
