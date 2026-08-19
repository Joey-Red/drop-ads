import test from "node:test";
import assert from "node:assert/strict";
import { loadState, saveState, normalizePersistedState } from "../src/core/storage.js";

function normalApi(result = {}) {
  const local = {
    async get(key) {
      assert.equal(this, local);
      return Object.hasOwn(result, key) ? { [key]: result[key] } : {};
    },
    async set(payload) {
      assert.equal(this, local);
      local.lastWrite = payload;
    }
  };
  return { api: { storage: { local } }, local };
}

test("storage collaborators preserve their receiver", async () => {
  const { api, local } = normalApi();
  const state = await loadState(api);
  await saveState(api, state);
  assert.ok(local.lastWrite.dropAdsState);
});

test("storage namespace accessors are rejected without invocation", async () => {
  let invoked = false;
  const api = {};
  Object.defineProperty(api, "storage", {
    enumerable: true,
    get() {
      invoked = true;
      throw new Error("should not execute");
    }
  });
  await assert.rejects(loadState(api), /data property/);
  assert.equal(invoked, false);
});

test("storage method accessors are rejected without invocation", async () => {
  let invoked = false;
  const local = {};
  Object.defineProperty(local, "get", {
    enumerable: true,
    get() {
      invoked = true;
      throw new Error("should not execute");
    }
  });
  local.set = async () => {};
  await assert.rejects(loadState({ storage: { local } }), /data function/);
  assert.equal(invoked, false);
});

test("revoked storage collaborators fail closed", async () => {
  const { proxy, revoke } = Proxy.revocable({}, {});
  revoke();
  await assert.rejects(loadState({ storage: proxy }), /safely inspectable|unavailable/);
});

test("normal persisted state remains usable through hardened storage boundary", async () => {
  const stored = normalizePersistedState({ enabled: false });
  const { api } = normalApi({ dropAdsState: stored });
  const loaded = await loadState(api);
  assert.equal(loaded.enabled, false);
});
