import test from "node:test";
import assert from "node:assert/strict";

import { loadSessionState, saveSessionState, SESSION_STORAGE_KEY } from "../src/core/session.js";

test("missing session storage remains an unsupported-capability fallback", async () => {
  const state = await loadSessionState({ storage: {} });
  assert.deepEqual(state, { disabledSites: [] });
  await assert.rejects(saveSessionState({ storage: {} }, { disabledSites: [] }), /unavailable/);
});

test("session storage namespace accessors are rejected without invocation", async () => {
  let invoked = false;
  const api = {};
  Object.defineProperty(api, "storage", {
    enumerable: true,
    get() {
      invoked = true;
      throw new Error("must not run");
    }
  });
  await assert.rejects(loadSessionState(api), /must be a data property/);
  assert.equal(invoked, false);
});

test("revoked session storage collaborators fail closed", async () => {
  const { proxy, revoke } = Proxy.revocable({}, {});
  revoke();
  await assert.rejects(loadSessionState(proxy), /not safely inspectable/);
});

test("captured get and set preserve the session storage receiver", async () => {
  const area = {
    value: { disabledSites: ["example.com"] },
    async get(key) {
      assert.equal(this, area);
      assert.equal(key, SESSION_STORAGE_KEY);
      return { [SESSION_STORAGE_KEY]: this.value };
    },
    async set(payload) {
      assert.equal(this, area);
      this.value = payload[SESSION_STORAGE_KEY];
    }
  };
  const api = { storage: { session: area } };
  const loaded = await loadSessionState(api);
  assert.deepEqual(loaded.disabledSites, ["example.com"]);
  const saved = await saveSessionState(api, { disabledSites: ["other.example"] });
  assert.equal(area.value, saved);
});
