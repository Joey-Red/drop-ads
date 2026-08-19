import test from "node:test";
import assert from "node:assert/strict";

import { setSessionSitePaused, SESSION_STORAGE_KEY } from "../src/core/session.js";

function memoryApi(initial) {
  const area = {
    value: initial,
    writes: [],
    async get() { return { [SESSION_STORAGE_KEY]: this.value }; },
    async set(payload) {
      const next = payload[SESSION_STORAGE_KEY];
      this.writes.push(next);
      this.value = next;
    }
  };
  return { api: { storage: { session: area } }, area };
}

test("session pause updates create immutable canonical snapshots", async () => {
  const original = { disabledSites: ["Existing.EXAMPLE"] };
  const { api, area } = memoryApi(original);

  const paused = await setSessionSitePaused(api, "New.Example", true);
  assert.deepEqual(paused.disabledSites, ["existing.example", "new.example"]);
  assert.equal(Object.isFrozen(paused), true);
  assert.equal(Object.isFrozen(paused.disabledSites), true);
  assert.deepEqual(original, { disabledSites: ["Existing.EXAMPLE"] });
  assert.equal(area.writes.length, 1);
  assert.equal(area.writes[0], paused);

  const resumed = await setSessionSitePaused(api, "existing.example", false);
  assert.deepEqual(resumed.disabledSites, ["new.example"]);
  assert.equal(Object.isFrozen(resumed), true);
  assert.notEqual(resumed, paused);
});
