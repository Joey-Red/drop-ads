import test from "node:test";
import assert from "node:assert/strict";
import { loadSessionState, saveSessionState, SESSION_STORAGE_KEY } from "../src/core/session.js";

function fixture() {
  const writes = [];
  const area = {
    async get() { return { [SESSION_STORAGE_KEY]: { disabledSites: ["example.com"] } }; },
    async set(value) { writes.push(value); }
  };
  return { api: { storage: { session: area } }, area, writes };
}

test("M455 session storage methods retain their admitted receiver", async () => {
  const h = fixture();
  assert.deepEqual(await loadSessionState(h.api), { disabledSites: ["example.com"] });
  await saveSessionState(h.api, { disabledSites: ["example.org"] });
  assert.deepEqual(h.writes, [{ [SESSION_STORAGE_KEY]: { disabledSites: ["example.org"] } }]);
});

test("M455 session storage namespace accessors are rejected without execution", async () => {
  let getterRuns = 0;
  const storage = {};
  Object.defineProperty(storage, "session", {
    get() { getterRuns += 1; return {}; }
  });
  await assert.rejects(() => loadSessionState({ storage }), /must be a data property/);
  assert.equal(getterRuns, 0);
});

test("M455 missing session storage preserves load fallback and save rejection", async () => {
  assert.deepEqual(await loadSessionState({ storage: {} }), { disabledSites: [] });
  await assert.rejects(() => saveSessionState({ storage: {} }, { disabledSites: [] }), /Session storage is unavailable/);
});

test("M455 callback-owned bind is never consulted", async () => {
  const h = fixture();
  h.area.get.bind = () => { throw new Error("bind must not run"); };
  h.area.set.bind = () => { throw new Error("bind must not run"); };
  await loadSessionState(h.api);
  await saveSessionState(h.api, { disabledSites: [] });
});
