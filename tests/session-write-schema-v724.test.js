import test from "node:test";
import assert from "node:assert/strict";

import { saveSessionState, SESSION_STORAGE_KEY } from "../src/core/session.js";

function writableApi() {
  const writes = [];
  return {
    writes,
    api: {
      storage: {
        session: {
          async get() { return {}; },
          async set(payload) { writes.push(payload[SESSION_STORAGE_KEY]); }
        }
      }
    }
  };
}

test("session writes require the explicit disabledSites field", async () => {
  const { api, writes } = writableApi();
  await assert.rejects(saveSessionState(api, {}), /requires an own enumerable disabledSites data field/);
  await assert.rejects(saveSessionState(api, { disabledSites: null }), /must be an array/);
  await assert.rejects(saveSessionState(api, { disabledSites: [], extra: true }), /unsupported field/);
  await assert.rejects(saveSessionState(api, { disabledSites: ["not a domain"] }));
  assert.equal(writes.length, 0);
});

test("session writes reject accessor fields without invoking them", async () => {
  const { api, writes } = writableApi();
  let invoked = false;
  const state = {};
  Object.defineProperty(state, "disabledSites", {
    enumerable: true,
    get() {
      invoked = true;
      return [];
    }
  });
  await assert.rejects(saveSessionState(api, state), /data field/);
  assert.equal(invoked, false);
  assert.equal(writes.length, 0);
});

test("valid session writes are canonical before persistence", async () => {
  const { api, writes } = writableApi();
  const input = { disabledSites: ["B.Example", "a.example", "b.example"] };
  const saved = await saveSessionState(api, input);
  assert.deepEqual(saved.disabledSites, ["a.example", "b.example"]);
  assert.equal(Object.isFrozen(saved), true);
  assert.equal(writes[0], saved);
});
