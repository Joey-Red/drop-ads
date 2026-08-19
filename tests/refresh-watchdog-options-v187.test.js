import assert from "node:assert/strict";
import test from "node:test";

import { installRefreshWatchdog } from "../src/core/refresh-watchdog.js";

function fixture() {
  const listeners = [];
  let gets = 0;
  let creates = 0;
  const api = {
    alarms: {
      onAlarm: {
        addListener(listener) { listeners.push(listener); },
        removeListener() {}
      },
      async get() { gets += 1; return { name: "existing" }; },
      create() { creates += 1; }
    }
  };
  const controller = { async refreshListsOnce() {} };
  return { api, controller, listeners, counts: () => ({ gets, creates }) };
}

test("refresh watchdog rejects option accessors before listener registration", () => {
  const { api, controller, listeners, counts } = fixture();
  let reads = 0;
  const options = { controller };
  Object.defineProperty(options, "api", {
    enumerable: true,
    get() {
      reads += 1;
      return api;
    }
  });
  assert.throws(() => installRefreshWatchdog(options), /data field/);
  assert.equal(reads, 0);
  assert.equal(listeners.length, 0);
  assert.deepEqual(counts(), { gets: 0, creates: 0 });
});

test("refresh watchdog rejects unknown/custom-prototype options and bad logger before side effects", () => {
  const { api, controller, listeners, counts } = fixture();
  assert.throws(() => installRefreshWatchdog({ api, controller, history: [] }), /unsupported field/);
  assert.throws(() => installRefreshWatchdog(Object.assign(Object.create({}), { api, controller })), /plain object/);
  assert.throws(() => installRefreshWatchdog({ api, controller, logger: {} }), /logger/);
  assert.equal(listeners.length, 0);
  assert.deepEqual(counts(), { gets: 0, creates: 0 });
});

test("refresh watchdog default logger path still installs and remains idempotent", async () => {
  const { api, controller, listeners } = fixture();
  const first = installRefreshWatchdog({ api, controller });
  const second = installRefreshWatchdog({ api, controller });
  assert.equal(first, second);
  assert.equal(listeners.length, 1);
  await first.ready;
  first.dispose();
});
