import test from "node:test";
import assert from "node:assert/strict";
import {
  ACTION_COUNT_PREFERENCE_KEY,
  installActionCount,
  setActionCountEnabled,
  supportsActionCount
} from "../src/core/action-count.js";

function eventSource() {
  const listeners = new Set();
  return {
    listeners,
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); }
  };
}

function apiFixture() {
  const changed = eventSource();
  const writes = [];
  const actionOptions = [];
  const local = {
    async get() { return { [ACTION_COUNT_PREFERENCE_KEY]: true }; },
    async set(value) { writes.push(value); }
  };
  const storage = { local, onChanged: changed };
  const dnr = {
    async setExtensionActionOptions(value) { actionOptions.push(value); }
  };
  return { api: { storage, declarativeNetRequest: dnr }, storage, local, dnr, changed, writes, actionOptions };
}

test("M451 action-count installation uses captured namespaces after API mutation", async () => {
  const h = apiFixture();
  const registration = installActionCount({ api: h.api, logger: { warn() {} } });
  await registration.whenIdle();
  assert.equal(h.changed.listeners.size, 1);

  Object.defineProperty(h.api, "storage", {
    configurable: true,
    get() { throw new Error("late storage getter must not run"); }
  });
  Object.defineProperty(h.storage, "onChanged", {
    configurable: true,
    get() { throw new Error("late event getter must not run"); }
  });

  assert.doesNotThrow(() => registration.dispose());
  assert.equal(h.changed.listeners.size, 0);
});

test("M451 action-count rejects accessor-shaped namespaces without getter execution", async () => {
  let storageGetterRuns = 0;
  const api = {};
  Object.defineProperty(api, "storage", {
    enumerable: true,
    get() { storageGetterRuns += 1; return {}; }
  });

  await assert.rejects(
    () => setActionCountEnabled(api, false),
    /storage namespace must be a data property/
  );
  assert.equal(storageGetterRuns, 0);
});

test("M451 action-count keeps optional DNR degradation and captured receiver semantics", async () => {
  const h = apiFixture();
  assert.equal(supportsActionCount(h.api), true);
  const result = await setActionCountEnabled(h.api, false);
  assert.equal(result.enabled, false);
  assert.equal(result.supported, true);
  assert.deepEqual(h.writes, [{ [ACTION_COUNT_PREFERENCE_KEY]: false }]);
  assert.deepEqual(h.actionOptions.at(-1), { displayActionCountAsBadgeText: false });

  const withoutDnr = { storage: h.storage };
  assert.equal(supportsActionCount(withoutDnr), false);
});
