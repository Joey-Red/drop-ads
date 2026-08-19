import test from "node:test";
import assert from "node:assert/strict";

import {
  ACTION_COUNT_PREFERENCE_KEY,
  applyActionCountPreference,
  setActionCountEnabled,
  supportsActionCount
} from "../src/core/action-count.js";

function baseApi() {
  const state = { [ACTION_COUNT_PREFERENCE_KEY]: true };
  return {
    state,
    storage: {
      local: {
        async get() { return { [ACTION_COUNT_PREFERENCE_KEY]: state[ACTION_COUNT_PREFERENCE_KEY] }; },
        async set(value) { Object.assign(state, value); }
      }
    },
    declarativeNetRequest: {
      async setExtensionActionOptions() {}
    }
  };
}

test("supporting hardening: optional DNR accessor is not executed during capability admission", async () => {
  let getterCalls = 0;
  const api = baseApi();
  Object.defineProperty(api.declarativeNetRequest, "setExtensionActionOptions", {
    configurable: true,
    get() {
      getterCalls += 1;
      return async () => {};
    }
  });

  assert.equal(supportsActionCount(api), false);
  assert.equal(await applyActionCountPreference(api, true), false);
  assert.equal(getterCalls, 0);
});

test("supporting hardening: rollback uses the originally captured DNR method", async () => {
  const api = baseApi();
  const applied = [];
  api.declarativeNetRequest.setExtensionActionOptions = async ({ displayActionCountAsBadgeText }) => {
    applied.push(displayActionCountAsBadgeText);
  };

  const originalSet = api.storage.local.set;
  api.storage.local.set = async () => {
    api.declarativeNetRequest.setExtensionActionOptions = async () => applied.push("mutated");
    api.storage.local.set = originalSet;
    throw new Error("persist failed");
  };

  await assert.rejects(() => setActionCountEnabled(api, false), /persist failed/);
  assert.deepEqual(applied, [false, true]);
  assert.equal(api.state[ACTION_COUNT_PREFERENCE_KEY], true);
});

test("supporting hardening: unsupported action-count browsers still persist the preference", async () => {
  const api = baseApi();
  delete api.declarativeNetRequest.setExtensionActionOptions;

  const result = await setActionCountEnabled(api, false);
  assert.deepEqual(result, { enabled: false, supported: false, changed: true });
  assert.equal(api.state[ACTION_COUNT_PREFERENCE_KEY], false);
});
