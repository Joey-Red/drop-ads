import test from "node:test";
import assert from "node:assert/strict";
import { installRefreshWatchdog, LIST_REFRESH_WATCHDOG_ALARM } from "../src/core/refresh-watchdog.js";

function retainingThrowEvent() {
  let listener = null;
  return {
    addListener(candidate) {
      listener = candidate;
      throw new Error("synthetic add failure");
    },
    removeListener() {
      throw new Error("synthetic remove failure");
    },
    emit(value) {
      return listener?.(value);
    }
  };
}

test("M430 failed watchdog registration leaves a retained callback inert", async () => {
  const onAlarm = retainingThrowEvent();
  let refreshes = 0;
  const api = {
    alarms: {
      onAlarm,
      get() { return null; },
      create() {}
    }
  };
  assert.throws(() => installRefreshWatchdog({
    api,
    controller: { async refreshListsOnce() { refreshes += 1; } }
  }), /synthetic add failure/);

  onAlarm.emit({ name: LIST_REFRESH_WATCHDOG_ALARM });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(refreshes, 0);
});
