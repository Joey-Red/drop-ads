import test from "node:test";
import assert from "node:assert/strict";
import { createBackgroundRuntime } from "../src/core/runtime.js";

function browserEvent() {
  const listeners = new Set();
  let failAdd = false;
  let failRemove = false;
  return {
    addListener(listener) {
      if (failAdd) throw new Error("add failed");
      listeners.add(listener);
    },
    removeListener(listener) {
      listeners.delete(listener);
      if (failRemove) throw new Error("remove failed");
    },
    setFailAdd(value) { failAdd = value; },
    setFailRemove(value) { failRemove = value; },
    count() { return listeners.size; }
  };
}

function makeApi() {
  const events = {
    installed: browserEvent(),
    startup: browserEvent(),
    context: browserEvent(),
    alarm: browserEvent(),
    message: browserEvent(),
    storage: browserEvent()
  };
  return {
    api: {
      runtime: { onInstalled: events.installed, onStartup: events.startup, onMessage: events.message },
      storage: { onChanged: events.storage },
      declarativeNetRequest: {},
      contextMenus: { onClicked: events.context },
      alarms: { onAlarm: events.alarm, async clear() { return false; }, create() {} },
      tabs: {}
    },
    events
  };
}

function counts(events) {
  return Object.fromEntries(Object.entries(events).map(([name, event]) => [name, event.count()]));
}

test("M417 core runtime start is idempotent and dispose removes exactly its stable listeners", () => {
  const { api, events } = makeApi();
  const runtime = createBackgroundRuntime({ api });

  assert.equal(runtime.start(), runtime);
  assert.deepEqual(counts(events), { installed: 1, startup: 1, context: 1, alarm: 1, message: 1, storage: 1 });
  assert.equal(runtime.start(), runtime);
  assert.deepEqual(counts(events), { installed: 1, startup: 1, context: 1, alarm: 1, message: 1, storage: 1 });

  assert.doesNotThrow(() => runtime.dispose());
  assert.deepEqual(counts(events), { installed: 0, startup: 0, context: 0, alarm: 0, message: 0, storage: 0 });
  assert.doesNotThrow(() => runtime.dispose());
  assert.throws(() => runtime.start(), /disposed/);
});

test("M417 core runtime rolls back partial listener installation and can retry cleanly", () => {
  const { api, events } = makeApi();
  const runtime = createBackgroundRuntime({ api });
  events.alarm.setFailAdd(true);

  assert.throws(() => runtime.start(), /add failed/);
  assert.deepEqual(counts(events), { installed: 0, startup: 0, context: 0, alarm: 0, message: 0, storage: 0 });

  events.alarm.setFailAdd(false);
  assert.equal(runtime.start(), runtime);
  assert.deepEqual(counts(events), { installed: 1, startup: 1, context: 1, alarm: 1, message: 1, storage: 1 });
  runtime.dispose();
});

test("M417 dispose isolates removal failure and still tears down independent listeners", () => {
  const { api, events } = makeApi();
  const runtime = createBackgroundRuntime({ api });
  runtime.start();
  events.context.setFailRemove(true);

  assert.doesNotThrow(() => runtime.dispose());
  assert.deepEqual(counts(events), { installed: 0, startup: 0, context: 0, alarm: 0, message: 0, storage: 0 });
  assert.throws(() => runtime.start(), /disposed/);
});
