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
    emit(...args) { for (const listener of [...listeners]) listener(...args); }
  };
}

test("action-count preference load never invokes accessor or inherited fields", async () => {
  let reads = 0;
  const accessorResult = {};
  Object.defineProperty(accessorResult, ACTION_COUNT_PREFERENCE_KEY, {
    enumerable: true,
    get() { reads += 1; return false; }
  });
  const accessorApi = { storage: { local: { async get() { return accessorResult; } } } };
  assert.equal(await loadActionCountEnabled(accessorApi), true);
  assert.equal(reads, 0);

  const inheritedResult = Object.create({ [ACTION_COUNT_PREFERENCE_KEY]: false });
  const inheritedApi = { storage: { local: { async get() { return inheritedResult; } } } };
  assert.equal(await loadActionCountEnabled(inheritedApi), true);
});

test("action-count listener ignores accessor and inherited storage changes", async () => {
  const changed = event();
  const calls = [];
  const api = {
    declarativeNetRequest: {
      async setExtensionActionOptions(options) { calls.push({ ...options }); }
    },
    storage: {
      local: {
        async get() { return { [ACTION_COUNT_PREFERENCE_KEY]: true }; },
        async set() {}
      },
      onChanged: changed
    }
  };
  const registration = installActionCount({ api });
  await registration.whenIdle();
  assert.equal(calls.length, 1);

  let reads = 0;
  const accessorChanges = {};
  Object.defineProperty(accessorChanges, ACTION_COUNT_PREFERENCE_KEY, {
    enumerable: true,
    get() { reads += 1; return { newValue: false }; }
  });
  changed.emit(accessorChanges, "local");
  await registration.whenIdle();
  assert.equal(reads, 0);
  assert.equal(calls.length, 1);

  changed.emit(Object.create({ [ACTION_COUNT_PREFERENCE_KEY]: { newValue: false } }), "local");
  await registration.whenIdle();
  assert.equal(calls.length, 1);

  changed.emit({ [ACTION_COUNT_PREFERENCE_KEY]: { oldValue: false, newValue: true } }, "local");
  await registration.whenIdle();
  assert.equal(calls.length, 2);
  registration.dispose();
});
