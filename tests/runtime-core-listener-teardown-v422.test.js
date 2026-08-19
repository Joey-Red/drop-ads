import test from "node:test";
import assert from "node:assert/strict";
import { createBackgroundRuntime } from "../src/core/runtime.js";

function eventSource() {
  const listeners = new Set();
  let failAdds = 0;
  return {
    addListener(listener) {
      if (failAdds > 0) {
        failAdds -= 1;
        throw new Error("listener unavailable");
      }
      listeners.add(listener);
    },
    removeListener(listener) { listeners.delete(listener); },
    failNextAdd() { failAdds += 1; },
    size() { return listeners.size; }
  };
}

function makeApi() {
  const events = {
    installed: eventSource(),
    startup: eventSource(),
    message: eventSource(),
    clicked: eventSource(),
    alarm: eventSource(),
    storage: eventSource()
  };
  return {
    api: {
      runtime: { onInstalled: events.installed, onStartup: events.startup, onMessage: events.message },
      storage: { onChanged: events.storage },
      declarativeNetRequest: {},
      contextMenus: { onClicked: events.clicked },
      alarms: { onAlarm: events.alarm, async clear() { return false; }, create() {} },
      tabs: {}
    },
    events
  };
}

function listenerCounts(events) {
  return Object.values(events).map((event) => event.size());
}

test("M422 background core owns and idempotently removes every listener", () => {
  const { api, events } = makeApi();
  const runtime = createBackgroundRuntime({ api, logger: { warn() {}, error() {} } });

  assert.equal(runtime.start(), runtime);
  assert.deepEqual(listenerCounts(events), [1, 1, 1, 1, 1, 1]);
  assert.equal(runtime.start(), runtime);
  assert.deepEqual(listenerCounts(events), [1, 1, 1, 1, 1, 1]);

  runtime.dispose();
  assert.deepEqual(listenerCounts(events), [0, 0, 0, 0, 0, 0]);
  assert.doesNotThrow(() => runtime.dispose());
  assert.throws(() => runtime.start(), /disposed/);
});

test("M422 listener installation rolls back partial startup and remains retryable", () => {
  const { api, events } = makeApi();
  const runtime = createBackgroundRuntime({ api, logger: { warn() {}, error() {} } });
  events.alarm.failNextAdd();

  assert.throws(() => runtime.start(), /listener unavailable/);
  assert.deepEqual(listenerCounts(events), [0, 0, 0, 0, 0, 0]);

  assert.equal(runtime.start(), runtime);
  assert.deepEqual(listenerCounts(events), [1, 1, 1, 1, 1, 1]);
  runtime.dispose();
});
