import test from "node:test";
import assert from "node:assert/strict";
import { createBackgroundRuntime } from "../src/core/runtime.js";

function eventStub({ failAdd = false, failRemove = false } = {}) {
  const listeners = new Set();
  return {
    listeners,
    failAdd,
    failRemove,
    addListener(listener) {
      if (this.failAdd) throw new Error("add failed");
      listeners.add(listener);
    },
    removeListener(listener) {
      if (this.failRemove) throw new Error("remove failed");
      listeners.delete(listener);
    }
  };
}

function runtimeApi() {
  return {
    runtime: {
      onInstalled: eventStub(),
      onStartup: eventStub(),
      onMessage: eventStub()
    },
    storage: { onChanged: eventStub() },
    declarativeNetRequest: {},
    contextMenus: { onClicked: eventStub() },
    alarms: {
      onAlarm: eventStub(),
      async clear() { return true; },
      create() {}
    },
    tabs: {}
  };
}

function allEvents(api) {
  return [
    api.runtime.onInstalled,
    api.runtime.onStartup,
    api.contextMenus.onClicked,
    api.alarms.onAlarm,
    api.runtime.onMessage,
    api.storage.onChanged
  ];
}

test("core listener start is transactional and retryable after registration failure", () => {
  const api = runtimeApi();
  api.runtime.onMessage.failAdd = true;
  const runtime = createBackgroundRuntime({ api });

  assert.throws(() => runtime.start(), /add failed/);
  for (const event of allEvents(api)) assert.equal(event.listeners.size, 0);

  api.runtime.onMessage.failAdd = false;
  assert.equal(runtime.start(), runtime);
  for (const event of allEvents(api)) assert.equal(event.listeners.size, 1);

  assert.equal(runtime.start(), runtime);
  for (const event of allEvents(api)) assert.equal(event.listeners.size, 1);

  runtime.dispose();
  for (const event of allEvents(api)) assert.equal(event.listeners.size, 0);
  assert.throws(() => runtime.start(), /disposed/);
  runtime.dispose();
});

test("dispose continues when one browser listener refuses removal", () => {
  const api = runtimeApi();
  const runtime = createBackgroundRuntime({ api });
  runtime.start();

  api.contextMenus.onClicked.failRemove = true;
  assert.doesNotThrow(() => runtime.dispose());
  assert.equal(api.contextMenus.onClicked.listeners.size, 1);
  assert.equal(api.runtime.onInstalled.listeners.size, 0);
  assert.equal(api.runtime.onStartup.listeners.size, 0);
  assert.equal(api.alarms.onAlarm.listeners.size, 0);
  assert.equal(api.runtime.onMessage.listeners.size, 0);
  assert.equal(api.storage.onChanged.listeners.size, 0);
  assert.throws(() => runtime.start(), /disposed/);
});
