import test from "node:test";
import assert from "node:assert/strict";

import { ACTION_COUNT_PREFERENCE_KEY, installActionCount } from "../src/core/action-count.js";

function makeApi() {
  const state = { [ACTION_COUNT_PREFERENCE_KEY]: true };
  const listeners = new Set();
  return {
    state,
    storage: {
      local: {
        async get() { return { [ACTION_COUNT_PREFERENCE_KEY]: state[ACTION_COUNT_PREFERENCE_KEY] }; },
        async set(value) { Object.assign(state, value); }
      },
      onChanged: {
        addListener(listener) { listeners.add(listener); },
        removeListener(listener) { listeners.delete(listener); }
      }
    },
    declarativeNetRequest: { async setExtensionActionOptions() {} }
  };
}

test("supporting hardening: duplicate install returns existing registration before collaborator recapture", async () => {
  const api = makeApi();
  const first = installActionCount({ api, logger: { warn() {} } });
  await first.whenIdle();
  let loggerGetterCalls = 0;
  const hostileLogger = {};
  Object.defineProperty(hostileLogger, "warn", { enumerable: true, get() { loggerGetterCalls += 1; throw new Error("late logger getter executed"); } });
  let storageGetterCalls = 0;
  Object.defineProperty(api, "storage", { configurable: true, get() { storageGetterCalls += 1; throw new Error("late storage getter executed"); } });
  const second = installActionCount({ api, logger: hostileLogger });
  assert.equal(second, first);
  assert.equal(loggerGetterCalls, 0);
  assert.equal(storageGetterCalls, 0);
  first.dispose();
});

test("supporting hardening: exact top-level option schema still applies before idempotent return", async () => {
  const api = makeApi();
  const first = installActionCount({ api, logger: { warn() {} } });
  await first.whenIdle();
  assert.throws(() => installActionCount({ api, logger: { warn() {} }, unexpected: true }), /unexpected|field|option/i);
  first.dispose();
});
