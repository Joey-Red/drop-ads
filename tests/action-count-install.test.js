import test from "node:test";
import assert from "node:assert/strict";
import {
  ACTION_COUNT_PREFERENCE_KEY,
  installActionCount,
  loadActionCountEnabled
} from "../src/core/action-count.js";

function event() {
  const listeners = new Set();
  return {
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); },
    emit(...args) { for (const listener of [...listeners]) listener(...args); },
    get size() { return listeners.size; }
  };
}

function fixture(initialValue) {
  const changed = event();
  const calls = [];
  const store = {};
  if (initialValue !== undefined) store[ACTION_COUNT_PREFERENCE_KEY] = initialValue;
  const api = {
    declarativeNetRequest: {
      async setExtensionActionOptions(options) { calls.push({ ...options }); }
    },
    storage: {
      local: {
        async get(key) { return Object.hasOwn(store, key) ? { [key]: store[key] } : {}; },
        async set(value) { Object.assign(store, value); }
      },
      onChanged: changed
    }
  };
  return { api, store, calls, changed };
}

test("corrupted action-count preference falls back to reviewed default-on", async () => {
  const fx = fixture("false");
  assert.equal(await loadActionCountEnabled(fx.api), true);
  const registration = installActionCount({ api: fx.api });
  await registration.whenIdle();
  assert.deepEqual(fx.calls, [{ displayActionCountAsBadgeText: true }]);
  assert.equal(fx.store[ACTION_COUNT_PREFERENCE_KEY], "false", "fallback must not invent a migration write");
});

test("action-count installation is idempotent per API object", async () => {
  const fx = fixture(false);
  const first = installActionCount({ api: fx.api });
  const second = installActionCount({ api: fx.api });
  assert.equal(second, first);
  assert.equal(fx.changed.size, 1);
  await first.whenIdle();
  assert.deepEqual(fx.calls, [{ displayActionCountAsBadgeText: false }]);

  fx.changed.emit({ [ACTION_COUNT_PREFERENCE_KEY]: { oldValue: false, newValue: true } }, "local");
  await first.whenIdle();
  assert.equal(fx.calls.length, 2, "one storage event must schedule one sync");
});

test("dispose removes the listener and permits a clean reinstall", async () => {
  const fx = fixture(true);
  const first = installActionCount({ api: fx.api });
  await first.whenIdle();
  first.dispose();
  first.dispose();
  assert.equal(fx.changed.size, 0);

  const second = installActionCount({ api: fx.api });
  assert.notEqual(second, first);
  assert.equal(fx.changed.size, 1);
  await second.whenIdle();
  assert.equal(fx.calls.length, 2);
});
