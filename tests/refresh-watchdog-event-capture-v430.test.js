import test from "node:test";
import assert from "node:assert/strict";
import { installRefreshWatchdog } from "../src/core/refresh-watchdog.js";

function alarmEvent({ throwAfterAdd = false } = {}) {
  const listeners = new Set();
  return {
    listeners,
    addListener(listener) {
      assert.equal(this.listeners, listeners);
      listeners.add(listener);
      if (throwAfterAdd) throw new Error("registration failed");
    },
    removeListener(listener) {
      assert.equal(this.listeners, listeners);
      listeners.delete(listener);
    }
  };
}

test("refresh watchdog captures exact alarm event methods for install and teardown", async () => {
  const original = alarmEvent();
  const replacement = alarmEvent();
  const alarms = {
    onAlarm: original,
    async get() { return { name: "drop-ads:list-refresh-watchdog" }; },
    create() {}
  };
  const api = { alarms };
  const controller = { refreshListsOnce() {} };
  const installation = installRefreshWatchdog({ api, controller });
  alarms.onAlarm = replacement;
  await installation.ready;
  assert.equal(original.listeners.size, 1);
  assert.equal(replacement.listeners.size, 0);
  installation.dispose();
  assert.equal(original.listeners.size, 0);
  assert.equal(replacement.listeners.size, 0);
});

test("refresh watchdog rolls back a listener if registration installs and then throws", () => {
  const event = alarmEvent({ throwAfterAdd: true });
  const api = {
    alarms: {
      onAlarm: event,
      async get() { return null; },
      create() {}
    }
  };
  const controller = { refreshListsOnce() {} };
  assert.throws(() => installRefreshWatchdog({ api, controller }), /registration failed/);
  assert.equal(event.listeners.size, 0);
});
