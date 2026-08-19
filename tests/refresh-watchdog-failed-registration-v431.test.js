import test from "node:test";
import assert from "node:assert/strict";
import { installRefreshWatchdog, LIST_REFRESH_WATCHDOG_ALARM } from "../src/core/refresh-watchdog.js";

test("failed watchdog registration leaves a browser-retained callback inert when rollback removal fails", async () => {
  let retained = null;
  let refreshCalls = 0;
  const event = {
    addListener(listener) {
      retained = listener;
      throw new Error("registration failed");
    },
    removeListener() {
      throw new Error("removal failed");
    }
  };
  const api = {
    alarms: {
      onAlarm: event,
      async get() { return null; },
      create() {}
    }
  };
  const controller = { refreshListsOnce() { refreshCalls += 1; } };

  assert.throws(() => installRefreshWatchdog({ api, controller }), /registration failed/);
  assert.equal(typeof retained, "function");
  retained({ name: LIST_REFRESH_WATCHDOG_ALARM });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(refreshCalls, 0);
});
