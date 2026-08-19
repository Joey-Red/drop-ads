import test from "node:test";
import assert from "node:assert/strict";
import { createBackgroundRuntime } from "../src/core/runtime.js";

function makeEvent() {
  const listeners = new Set();
  let throwOnAdd = false;
  let throwOnRemove = false;
  return {
    listeners,
    addListener(listener) {
      if (throwOnAdd) throw new Error("add failed");
      listeners.add(listener);
    },
    removeListener(listener) {
      if (throwOnRemove) throw new Error("remove failed");
      listeners.delete(listener);
    },
    setThrowOnAdd(value) { throwOnAdd = value; },
    setThrowOnRemove(value) { throwOnRemove = value; }
  };
}

function makeEvents() {
  return {
    installed: makeEvent(),
    startup: makeEvent(),
    message: makeEvent(),
    context: makeEvent(),
    alarm: makeEvent(),
    storage: makeEvent()
  };
}

function makeRuntime(events) {
  return createBackgroundRuntime({
    api: {
      runtime: { onInstalled: events.installed, onStartup: events.startup, onMessage: events.message },
      storage: { onChanged: events.storage },
      declarativeNetRequest: {},
      contextMenus: { onClicked: events.context },
      alarms: { onAlarm: events.alarm, async clear() { return false; }, create() {} },
      tabs: {}
    },
    fetchImpl: async () => { throw new Error("unused fetch"); },
    now: () => 0,
    logger: { warn() {}, error() {} }
  });
}

function listenerCounts(events) {
  return Object.values(events).map((event) => event.listeners.size);
}

test("M417 start owns one stable listener per core event and dispose removes them idempotently", () => {
  const events = makeEvents();
  const runtime = makeRuntime(events);

  assert.equal(runtime.start(), runtime);
  assert.deepEqual(listenerCounts(events), [1, 1, 1, 1, 1, 1]);
  assert.equal(runtime.start(), runtime);
  assert.deepEqual(listenerCounts(events), [1, 1, 1, 1, 1, 1]);

  runtime.dispose();
  assert.deepEqual(listenerCounts(events), [0, 0, 0, 0, 0, 0]);
  assert.doesNotThrow(() => runtime.dispose());
  assert.throws(() => runtime.start(), /disposed/);
});

test("M417 listener registration is transactional and a failed start can retry", () => {
  const events = makeEvents();
  const runtime = makeRuntime(events);
  events.alarm.setThrowOnAdd(true);

  assert.throws(() => runtime.start(), /add failed/);
  assert.deepEqual(listenerCounts(events), [0, 0, 0, 0, 0, 0]);

  events.alarm.setThrowOnAdd(false);
  assert.equal(runtime.start(), runtime);
  assert.deepEqual(listenerCounts(events), [1, 1, 1, 1, 1, 1]);
  runtime.dispose();
});

test("M417 teardown isolates browser listener-removal failure and stale retained callbacks are inert", () => {
  const events = makeEvents();
  const runtime = makeRuntime(events);
  runtime.start();
  const retainedMessage = [...events.message.listeners][0];
  events.message.setThrowOnRemove(true);

  assert.doesNotThrow(() => runtime.dispose());
  assert.equal(events.message.listeners.size, 1);
  assert.equal(events.installed.listeners.size, 0);
  assert.equal(events.startup.listeners.size, 0);
  assert.equal(events.context.listeners.size, 0);
  assert.equal(events.alarm.listeners.size, 0);
  assert.equal(events.storage.listeners.size, 0);
  assert.equal(retainedMessage({ type: "drop-ads:get-ui-state" }, {}, () => {}), false);
});
