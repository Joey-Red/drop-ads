import test from "node:test";
import assert from "node:assert/strict";
import { installRefreshWatchdog } from "../src/core/refresh-watchdog.js";

function makeApi({ throwOnRemove = false } = {}) {
  const listeners = new Set();
  return {
    alarms: {
      onAlarm: {
        addListener(listener) { listeners.add(listener); },
        removeListener(listener) {
          if (throwOnRemove) throw new Error("remove failed");
          listeners.delete(listener);
        }
      },
      async get() { return { name: "drop-ads:list-refresh-watchdog" }; },
      create() {}
    },
    listeners
  };
}

const controller = { async refreshListsOnce() {} };

test("M415 watchdog dispose contains listener-removal failure and is idempotent", () => {
  const api = makeApi({ throwOnRemove: true });
  const first = installRefreshWatchdog({ api, controller });
  assert.doesNotThrow(() => first.dispose());
  assert.doesNotThrow(() => first.dispose());
});

test("M415 failed listener removal does not pin installation identity", () => {
  const api = makeApi({ throwOnRemove: true });
  const first = installRefreshWatchdog({ api, controller });
  first.dispose();
  const second = installRefreshWatchdog({ api, controller });
  assert.notEqual(second, first);
  second.dispose();
});

test("M415 watchdog retains the reviewed 30-minute non-forced refresh path", async () => {
  let call;
  const api = makeApi();
  api.alarms.get = async () => null;
  api.alarms.create = (name, options) => { call = { name, options }; };
  const registration = installRefreshWatchdog({ api, controller });
  await registration.ready;
  assert.deepEqual(call, {
    name: "drop-ads:list-refresh-watchdog",
    options: { periodInMinutes: 30 }
  });
  registration.dispose();
});
