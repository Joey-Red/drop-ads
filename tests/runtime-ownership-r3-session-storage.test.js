import test from "node:test";
import assert from "node:assert/strict";
import { loadSessionState, saveSessionState, SESSION_STORAGE_KEY } from "../src/core/session.js";

test("R3 session storage get/set preserve the area receiver without callback-owned bind", async () => {
  const area = { writes: [] };
  function get(key) {
    assert.equal(this, area);
    assert.equal(key, SESSION_STORAGE_KEY);
    return { [SESSION_STORAGE_KEY]: { disabledSites: ["example.com"] } };
  }
  function set(value) {
    assert.equal(this, area);
    this.writes.push(value);
  }
  Object.defineProperty(get, "bind", { get() { throw new Error("bind must not be read"); } });
  Object.defineProperty(set, "bind", { get() { throw new Error("bind must not be read"); } });
  area.get = get;
  area.set = set;
  const api = { storage: { session: area } };

  assert.deepEqual(await loadSessionState(api), { disabledSites: ["example.com"] });
  assert.deepEqual(await saveSessionState(api, { disabledSites: ["example.org"] }), { disabledSites: ["example.org"] });
  assert.deepEqual(area.writes, [{ [SESSION_STORAGE_KEY]: { disabledSites: ["example.org"] } }]);
});

test("R3 accessor-backed session namespaces are rejected without getter execution", async () => {
  let getterCalls = 0;
  const storage = {};
  Object.defineProperty(storage, "session", {
    enumerable: true,
    get() { getterCalls += 1; return {}; }
  });
  await assert.rejects(loadSessionState({ storage }), /data property/);
  assert.equal(getterCalls, 0);
});
