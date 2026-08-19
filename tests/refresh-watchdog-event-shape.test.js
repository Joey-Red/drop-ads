import test from "node:test";
import assert from "node:assert/strict";
import { LIST_REFRESH_WATCHDOG_ALARM, installRefreshWatchdog } from "../src/core/refresh-watchdog.js";

function event() {
  const listeners = new Set();
  return {
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); },
    emit(value) { for (const listener of [...listeners]) listener(value); }
  };
}

test("refresh watchdog ignores accessor and inherited alarm names without invoking them", async () => {
  const onAlarm = event();
  const refreshCalls = [];
  const api = {
    alarms: {
      onAlarm,
      async get() { return { name: LIST_REFRESH_WATCHDOG_ALARM }; },
      create() {}
    }
  };
  const controller = {
    async refreshListsOnce(force) { refreshCalls.push(force); }
  };
  const registration = installRefreshWatchdog({ api, controller });
  await registration.ready;

  let reads = 0;
  const accessorAlarm = {};
  Object.defineProperty(accessorAlarm, "name", {
    enumerable: true,
    get() { reads += 1; return LIST_REFRESH_WATCHDOG_ALARM; }
  });
  onAlarm.emit(accessorAlarm);
  onAlarm.emit(Object.create({ name: LIST_REFRESH_WATCHDOG_ALARM }));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(reads, 0);
  assert.deepEqual(refreshCalls, []);

  onAlarm.emit({ name: LIST_REFRESH_WATCHDOG_ALARM });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(refreshCalls, [false]);
  registration.dispose();
});
