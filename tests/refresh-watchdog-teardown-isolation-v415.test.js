import test from "node:test";
import assert from "node:assert/strict";
import { installRefreshWatchdog } from "../src/core/refresh-watchdog.js";

function alarmEvent({ throwOnRemove = false } = {}) {
  const listeners = new Set();
  return {
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) {
      listeners.delete(listener);
      if (throwOnRemove) throw new Error("remove failed");
    },
    count() { return listeners.size; }
  };
}

function makeApi(event) {
  return {
    alarms: {
      onAlarm: event,
      async get() { return { name: "drop-ads:list-refresh-watchdog" }; },
      create() {}
    }
  };
}

test("M415 watchdog dispose releases installation identity when listener removal throws", async () => {
  const firstEvent = alarmEvent({ throwOnRemove: true });
  const api = makeApi(firstEvent);
  const controller = { async refreshListsOnce() {} };
  const first = installRefreshWatchdog({ api, controller });
  await first.ready;

  assert.doesNotThrow(() => first.dispose());

  const second = installRefreshWatchdog({ api, controller });
  assert.notEqual(second, first);
  assert.equal(firstEvent.count(), 1, "reinstall should register a fresh listener after identity release");
  second.dispose();
});

test("M415 watchdog teardown uses the captured alarm event collaborator", async () => {
  const original = alarmEvent();
  const replacement = alarmEvent();
  const api = makeApi(original);
  const registration = installRefreshWatchdog({ api, controller: { async refreshListsOnce() {} } });
  await registration.ready;
  api.alarms.onAlarm = replacement;
  registration.dispose();
  assert.equal(original.count(), 0);
  assert.equal(replacement.count(), 0);
});
