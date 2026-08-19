import test from "node:test";
import assert from "node:assert/strict";
import { createBackgroundRuntime } from "../src/core/runtime.js";

function eventSource({ failAdd = false, failRemove = false } = {}) {
  const listeners = new Set();
  return {
    listeners,
    addListener(listener) {
      if (failAdd) throw new Error("synthetic listener add failure");
      listeners.add(listener);
    },
    removeListener(listener) {
      if (failRemove) throw new Error("synthetic listener remove failure");
      listeners.delete(listener);
    }
  };
}

function makeApi(overrides = {}) {
  const events = {
    installed: eventSource(),
    startup: eventSource(),
    message: eventSource(),
    clicked: eventSource(),
    alarm: eventSource(),
    storage: eventSource(),
    ...overrides
  };
  return {
    events,
    api: {
      runtime: { onInstalled: events.installed, onStartup: events.startup, onMessage: events.message },
      storage: { onChanged: events.storage },
      declarativeNetRequest: {},
      contextMenus: { onClicked: events.clicked },
      alarms: { onAlarm: events.alarm, async clear() { return false; }, create() {} },
      tabs: {}
    }
  };
}

test("M423 core runtime dispose removes exactly its stable listener identities and is idempotent", () => {
  const harness = makeApi();
  const controller = createBackgroundRuntime({ api: harness.api });
  controller.start();

  for (const event of Object.values(harness.events)) assert.equal(event.listeners.size, 1);
  assert.doesNotThrow(() => controller.dispose());
  assert.doesNotThrow(() => controller.dispose());
  for (const event of Object.values(harness.events)) assert.equal(event.listeners.size, 0);
  assert.throws(() => controller.start(), /disposed/);
});

test("M423 failed core listener installation rolls back earlier registrations", () => {
  const harness = makeApi({ alarm: eventSource({ failAdd: true }) });
  const controller = createBackgroundRuntime({ api: harness.api });

  assert.throws(() => controller.start(), /synthetic listener add failure/);
  assert.equal(harness.events.installed.listeners.size, 0);
  assert.equal(harness.events.startup.listeners.size, 0);
  assert.equal(harness.events.clicked.listeners.size, 0);
  assert.equal(harness.events.message.listeners.size, 0);
  assert.equal(harness.events.storage.listeners.size, 0);
  assert.doesNotThrow(() => controller.dispose());
});

test("M423 browser removal failure cannot make a disposed retained listener active", () => {
  const stuck = eventSource({ failRemove: true });
  const harness = makeApi({ message: stuck });
  const controller = createBackgroundRuntime({ api: harness.api });
  controller.start();
  const retained = [...stuck.listeners][0];

  assert.doesNotThrow(() => controller.dispose());
  assert.equal(stuck.listeners.size, 1);
  assert.equal(retained({ type: "drop-ads:get-ui-state" }, {}, () => {}), false);
});
