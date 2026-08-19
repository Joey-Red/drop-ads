import test from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_SESSION_STATE, loadSessionState, saveSessionState } from "../src/core/session.js";

function poisonBind(fn) {
  Object.defineProperty(fn, "bind", {
    configurable: true,
    get() { throw new Error("callback-owned bind must not be read"); }
  });
  return fn;
}

test("M450 session get/set retain the original area receiver without callback-owned bind", async () => {
  let stored = { disabledSites: ["example.com"] };
  const area = {
    get: poisonBind(function get(key) {
      assert.equal(this, area);
      return { [key]: stored };
    }),
    set: poisonBind(function set(record) {
      assert.equal(this, area);
      stored = record.dropAdsSessionState;
    })
  };
  const api = { storage: { session: area } };
  assert.deepEqual(await loadSessionState(api), { disabledSites: ["example.com"] });
  assert.deepEqual(await saveSessionState(api, { disabledSites: ["example.org"] }), { disabledSites: ["example.org"] });
  assert.deepEqual(stored, { disabledSites: ["example.org"] });
});

test("M450 accessor-shaped session methods fail without executing getters", async () => {
  let getterCalls = 0;
  const area = {};
  Object.defineProperty(area, "get", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return () => ({});
    }
  });
  await assert.rejects(loadSessionState({ storage: { session: area } }), /data property/);
  assert.equal(getterCalls, 0);
});

test("M450 missing session storage keeps load fallback and save error", async () => {
  assert.deepEqual(await loadSessionState({ storage: {} }), structuredClone(DEFAULT_SESSION_STATE));
  await assert.rejects(
    saveSessionState({ storage: {} }, { disabledSites: [] }),
    /Session storage is unavailable in this browser/
  );
});

test("M450 prototype data methods remain compatible", async () => {
  class Area {
    get(key) {
      assert.equal(this, area);
      return { [key]: { disabledSites: [] } };
    }
    set() {
      assert.equal(this, area);
    }
  }
  const area = new Area();
  assert.deepEqual(await loadSessionState({ storage: { session: area } }), { disabledSites: [] });
  assert.deepEqual(await saveSessionState({ storage: { session: area } }, { disabledSites: [] }), { disabledSites: [] });
});
