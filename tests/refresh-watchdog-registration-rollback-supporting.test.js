import test from "node:test";
import assert from "node:assert/strict";
import { installRefreshWatchdog, LIST_REFRESH_WATCHDOG_ALARM } from "../src/core/refresh-watchdog.js";

function apiWithEvent(event) {
  return {
    alarms: {
      onAlarm: event,
      async get() { return { name: LIST_REFRESH_WATCHDOG_ALARM }; },
      create() {}
    }
  };
}

test("retained listener is inert when registration throws and rollback removal also fails", async () => {
  let retained = null;
  let refreshCalls = 0;
  const event = {
    addListener(listener) {
      retained = listener;
      throw new Error("registration failed after retention");
    },
    removeListener() {
      throw new Error("rollback removal failed");
    }
  };
  const api = apiWithEvent(event);
  const controller = { async refreshListsOnce() { refreshCalls += 1; } };

  assert.throws(() => installRefreshWatchdog({ api, controller }), /registration failed after retention/);
  assert.equal(typeof retained, "function");
  retained({ name: LIST_REFRESH_WATCHDOG_ALARM });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(refreshCalls, 0);
});

test("failed registration publishes no installation identity and retry can succeed", async () => {
  const listeners = new Set();
  let fail = true;
  const event = {
    addListener(listener) {
      listeners.add(listener);
      if (fail) throw new Error("first add failed");
    },
    removeListener(listener) { listeners.delete(listener); }
  };
  const api = apiWithEvent(event);
  const controller = { async refreshListsOnce() {} };

  assert.throws(() => installRefreshWatchdog({ api, controller }), /first add failed/);
  assert.equal(listeners.size, 0);

  fail = false;
  const registration = installRefreshWatchdog({ api, controller });
  await registration.ready;
  registration.dispose();
  assert.equal(listeners.size, 0);
});
