import test from "node:test";
import assert from "node:assert/strict";

import { saveSessionState, SESSION_STORAGE_KEY } from "../src/core/session.js";

test("session storage receives a frozen detached write envelope", async () => {
  const input = { disabledSites: ["Example.COM"] };
  let observedPayload;
  let mutationError;
  const api = {
    storage: {
      session: {
        async get() { return {}; },
        async set(payload) {
          observedPayload = payload;
          try { payload[SESSION_STORAGE_KEY] = { disabledSites: [] }; }
          catch (error) { mutationError = error; }
        }
      }
    }
  };

  const saved = await saveSessionState(api, input);
  assert.equal(Object.isFrozen(observedPayload), true);
  assert.equal(Object.isFrozen(observedPayload[SESSION_STORAGE_KEY]), true);
  assert.equal(Object.isFrozen(observedPayload[SESSION_STORAGE_KEY].disabledSites), true);
  assert.equal(observedPayload[SESSION_STORAGE_KEY], saved);
  assert.ok(mutationError instanceof TypeError);
  input.disabledSites[0] = "changed.example";
  assert.deepEqual(saved.disabledSites, ["example.com"]);
});
