import test from "node:test";
import assert from "node:assert/strict";

import { installRefreshWatchdog } from "../src/core/refresh-watchdog.js";

function controller() {
  return { async refreshListsOnce() { return "current"; } };
}

test("refresh watchdog rolls back a listener when addListener installs then throws", () => {
  const listeners = new Set();
  const onAlarm = {
    addListener(listener) {
      listeners.add(listener);
      throw new Error("registration failed after install");
    },
    removeListener(listener) { listeners.delete(listener); }
  };
  const api = {
    alarms: {
      onAlarm,
      get: async () => null,
      create: async () => undefined
    }
  };

  assert.throws(() => installRefreshWatchdog({ api, controller: controller() }), /registration failed/);
  assert.equal(listeners.size, 0);
});

test("refresh watchdog disposal uses the captured alarm-event remover", async () => {
  const listeners = new Set();
  let originalRemovals = 0;
  let replacementRemovals = 0;
  const onAlarm = {
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) {
      originalRemovals += 1;
      listeners.delete(listener);
    }
  };
  const api = {
    alarms: {
      onAlarm,
      get: async () => ({ name: "drop-ads:list-refresh-watchdog" }),
      create: async () => undefined
    }
  };

  const registration = installRefreshWatchdog({ api, controller: controller() });
  await registration.ready;
  onAlarm.removeListener = () => { replacementRemovals += 1; };

  registration.dispose();
  registration.dispose();
  assert.equal(originalRemovals, 1);
  assert.equal(replacementRemovals, 0);
  assert.equal(listeners.size, 0);
});

test("refresh watchdog can reinstall after teardown", async () => {
  const listeners = new Set();
  const onAlarm = {
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); }
  };
  const api = {
    alarms: {
      onAlarm,
      get: async () => ({ name: "drop-ads:list-refresh-watchdog" }),
      create: async () => undefined
    }
  };

  const first = installRefreshWatchdog({ api, controller: controller() });
  await first.ready;
  first.dispose();
  const second = installRefreshWatchdog({ api, controller: controller() });
  assert.notEqual(second, first);
  await second.ready;
  second.dispose();
});
