import test from "node:test";
import assert from "node:assert/strict";
import { LIST_REFRESH_WATCHDOG_ALARM, installRefreshWatchdog } from "../src/core/refresh-watchdog.js";

function event() {
  const listeners = [];
  return {
    addListener(listener) { listeners.push(listener); },
    removeListener(listener) {
      const index = listeners.indexOf(listener);
      if (index >= 0) listeners.splice(index, 1);
    },
    emit(value) { for (const listener of [...listeners]) listener(value); }
  };
}

function api({ getError = null } = {}) {
  const onAlarm = event();
  return {
    onAlarm,
    value: {
      alarms: {
        onAlarm,
        async get() {
          if (getError) throw getError;
          return { name: LIST_REFRESH_WATCHDOG_ALARM };
        },
        create() {}
      }
    }
  };
}

test("M402 synchronous watchdog refresh throws are contained and warned", async () => {
  const fixture = api();
  const warnings = [];
  const controller = {
    calls: 0,
    refreshListsOnce(force) {
      assert.equal(this, controller);
      assert.equal(force, false);
      this.calls += 1;
      throw new Error("sync refresh failure");
    }
  };
  const logger = {
    warn(...args) {
      assert.equal(this, logger);
      warnings.push(args);
    }
  };

  await installRefreshWatchdog({ api: fixture.value, controller, logger }).ready;
  assert.doesNotThrow(() => fixture.onAlarm.emit({ name: LIST_REFRESH_WATCHDOG_ALARM }));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(controller.calls, 1);
  assert.equal(warnings.length, 1);
  assert.match(String(warnings[0][0]), /last-known-good/);
});

test("M402 throwing warning collaborators cannot turn watchdog failures into escaping errors", async () => {
  const fixture = api({ getError: new Error("get failed") });
  const registration = installRefreshWatchdog({
    api: fixture.value,
    controller: { refreshListsOnce() { throw new Error("sync refresh failure"); } },
    logger: { warn() { throw new Error("logger failed"); } }
  });

  assert.equal(await registration.ready, false);
  assert.doesNotThrow(() => fixture.onAlarm.emit({ name: LIST_REFRESH_WATCHDOG_ALARM }));
  await new Promise((resolve) => setImmediate(resolve));
});

test("M402 unrelated alarms still perform no refresh work", async () => {
  const fixture = api();
  let calls = 0;
  const registration = installRefreshWatchdog({
    api: fixture.value,
    controller: { refreshListsOnce() { calls += 1; return Promise.resolve(); } }
  });
  await registration.ready;
  fixture.onAlarm.emit({ name: "unrelated" });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls, 0);
});
