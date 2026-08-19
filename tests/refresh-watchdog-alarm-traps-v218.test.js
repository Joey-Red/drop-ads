import assert from "node:assert/strict";
import test from "node:test";

import { installRefreshWatchdog, LIST_REFRESH_WATCHDOG_ALARM } from "../src/core/refresh-watchdog.js";

function event() {
  const listeners = new Set();
  return {
    listeners,
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); }
  };
}

function fixture() {
  const onAlarm = event();
  const calls = [];
  return {
    calls,
    api: { alarms: { onAlarm, get: async () => ({ name: LIST_REFRESH_WATCHDOG_ALARM }), create() {} } },
    controller: { refreshListsOnce: async (force) => { calls.push(force); } }
  };
}

test("watchdog contains throwing alarm descriptor/prototype traps", async () => {
  const { api, controller, calls } = fixture();
  const registration = installRefreshWatchdog({ api, controller });
  await registration.ready;
  const listener = [...api.alarms.onAlarm.listeners][0];
  const descriptorTrap = new Proxy({}, { getOwnPropertyDescriptor() { throw new Error("boom"); } });
  const prototypeTrap = new Proxy({}, { getPrototypeOf() { throw new Error("boom"); } });
  assert.doesNotThrow(() => listener(descriptorTrap));
  assert.doesNotThrow(() => listener(prototypeTrap));
  assert.deepEqual(calls, []);
  registration.dispose();
});

test("watchdog ignores custom prototypes and accepts null-prototype alarms", async () => {
  const { api, controller, calls } = fixture();
  const registration = installRefreshWatchdog({ api, controller });
  await registration.ready;
  const listener = [...api.alarms.onAlarm.listeners][0];
  listener(Object.assign(Object.create({ custom: true }), { name: LIST_REFRESH_WATCHDOG_ALARM }));
  assert.deepEqual(calls, []);
  listener(Object.assign(Object.create(null), { name: LIST_REFRESH_WATCHDOG_ALARM }));
  await Promise.resolve();
  assert.deepEqual(calls, [false]);
  registration.dispose();
});
