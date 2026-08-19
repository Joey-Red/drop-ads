import test from "node:test";
import assert from "node:assert/strict";

import { loadSessionState, SESSION_STORAGE_KEY } from "../src/core/session.js";

function apiReturning(result) {
  return {
    storage: {
      session: {
        async get(key) {
          assert.equal(key, SESSION_STORAGE_KEY);
          return result;
        },
        async set() {}
      }
    }
  };
}

test("absent session value is a fresh immutable default", async () => {
  const state = await loadSessionState(apiReturning({}));
  assert.deepEqual(state, { disabledSites: [] });
  assert.equal(Object.isFrozen(state), true);
  assert.equal(Object.isFrozen(state.disabledSites), true);
});

test("present malformed session values fail instead of becoming defaults", async () => {
  for (const value of [null, false, 0, "", []]) {
    await assert.rejects(
      loadSessionState(apiReturning({ [SESSION_STORAGE_KEY]: value })),
      /Session state must be an object/
    );
  }
});
