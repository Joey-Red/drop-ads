import test from "node:test";
import assert from "node:assert/strict";
import {
  loadSessionState,
  saveSessionState,
  SESSION_STORAGE_KEY
} from "../src/core/session.js";

function poisonBind(callback) {
  Object.defineProperty(callback, "bind", {
    enumerable: false,
    configurable: true,
    get() { throw new Error("callback bind must not be read"); }
  });
  return callback;
}

test("R3 session get/set retain the original storage-area receiver without callback.bind", async () => {
  const area = {
    stored: { disabledSites: ["example.com"] }
  };
  area.get = poisonBind(function get(key) {
    assert.equal(this, area);
    assert.equal(key, SESSION_STORAGE_KEY);
    return { [SESSION_STORAGE_KEY]: this.stored };
  });
  area.set = poisonBind(function set(value) {
    assert.equal(this, area);
    this.stored = value[SESSION_STORAGE_KEY];
  });

  const api = { storage: { session: area } };
  assert.deepEqual(await loadSessionState(api), { disabledSites: ["example.com"] });
  assert.deepEqual(await saveSessionState(api, { disabledSites: ["ads.example"] }), { disabledSites: ["ads.example"] });
  assert.deepEqual(area.stored, { disabledSites: ["ads.example"] });
});

test("R3 accessor-backed session namespace fails closed without getter execution", async () => {
  let getterCalls = 0;
  const storage = {};
  Object.defineProperty(storage, "session", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return { get() { return {}; } };
    }
  });

  await assert.rejects(loadSessionState({ storage }), /data property/i);
  assert.equal(getterCalls, 0);
});

test("R3 missing session storage keeps load default and save failure semantics", async () => {
  assert.deepEqual(await loadSessionState({ storage: {} }), { disabledSites: [] });
  await assert.rejects(saveSessionState({ storage: {} }, { disabledSites: [] }), /Session storage is unavailable/i);
});
