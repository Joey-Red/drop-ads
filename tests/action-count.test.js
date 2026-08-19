import test from "node:test";
import assert from "node:assert/strict";
import { ACTION_COUNT_PREFERENCE_KEY, applyActionCountPreference, loadActionCountEnabled, setActionCountEnabled, supportsActionCount } from "../src/core/action-count.js";

function mockApi() {
  const store = {};
  const calls = [];
  let failStorage = false;
  return {
    store,
    calls,
    failNextStorage() { failStorage = true; },
    api: {
      declarativeNetRequest: {
        async setExtensionActionOptions(options) { calls.push({ ...options }); }
      },
      storage: {
        local: {
          async get(key) { return Object.hasOwn(store, key) ? { [key]: store[key] } : {}; },
          async set(value) {
            if (failStorage) { failStorage = false; throw new Error("storage failed"); }
            Object.assign(store, value);
          }
        }
      }
    }
  };
}

test("action-count preference defaults on and uses only browser-owned aggregate API", async () => {
  const mock = mockApi();
  assert.equal(supportsActionCount(mock.api), true);
  assert.equal(await loadActionCountEnabled(mock.api), true);
  assert.equal(await applyActionCountPreference(mock.api, true), true);
  assert.deepEqual(mock.calls, [{ displayActionCountAsBadgeText: true }]);
});

test("badge can be hidden without changing protection policy", async () => {
  const mock = mockApi();
  const result = await setActionCountEnabled(mock.api, false);
  assert.deepEqual(result, { enabled: false, supported: true, changed: true });
  assert.equal(mock.store[ACTION_COUNT_PREFERENCE_KEY], false);
  assert.deepEqual(mock.calls.at(-1), { displayActionCountAsBadgeText: false });
});

test("storage failure rolls browser preference back instead of leaving UI state divergent", async () => {
  const mock = mockApi();
  mock.failNextStorage();
  await assert.rejects(() => setActionCountEnabled(mock.api, false), /storage failed/);
  assert.equal(mock.store[ACTION_COUNT_PREFERENCE_KEY], undefined);
  assert.deepEqual(mock.calls, [
    { displayActionCountAsBadgeText: false },
    { displayActionCountAsBadgeText: true }
  ]);
});
