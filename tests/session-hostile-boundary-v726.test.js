import test from "node:test";
import assert from "node:assert/strict";

import { loadSessionState, normalizeSessionState, SESSION_STORAGE_KEY } from "../src/core/session.js";
import { LIVE_STATE_LIMITS } from "../src/core/state-limits.js";

function apiWithGet(get) {
  return {
    storage: {
      session: {
        get,
        async set() {}
      }
    }
  };
}

test("session storage result accessors are rejected without invocation", async () => {
  let invoked = false;
  const result = {};
  Object.defineProperty(result, SESSION_STORAGE_KEY, {
    enumerable: true,
    get() {
      invoked = true;
      throw new Error("must not run");
    }
  });
  await assert.rejects(loadSessionState(apiWithGet(async () => result)), /data field/);
  assert.equal(invoked, false);
});

test("session disabledSites accessors are rejected without invocation", () => {
  let invoked = false;
  const state = {};
  Object.defineProperty(state, "disabledSites", {
    enumerable: true,
    get() {
      invoked = true;
      return [];
    }
  });
  assert.throws(() => normalizeSessionState(state, { strictShape: true }), /data field/);
  assert.equal(invoked, false);
});

test("revoked session state proxies fail closed", () => {
  const { proxy, revoke } = Proxy.revocable({ disabledSites: [] }, {});
  revoke();
  assert.throws(() => normalizeSessionState(proxy, { strictShape: true }), /inspectable|plain object|array kind/);
});

test("sparse and oversized session domain arrays are rejected", () => {
  const sparse = new Array(2);
  sparse[1] = "example.com";
  assert.throws(() => normalizeSessionState({ disabledSites: sparse }, { strictShape: true }), /dense array indices/);

  const oversized = new Array(LIVE_STATE_LIMITS.domains + 1).fill("example.com");
  assert.throws(() => normalizeSessionState({ disabledSites: oversized }, { strictShape: true }), /length must be at most/);
});

test("valid session state remains canonical and immutable beside hostile cases", () => {
  const normalized = normalizeSessionState({ disabledSites: ["B.Example", "a.example"] }, { strictShape: true });
  assert.deepEqual(normalized.disabledSites, ["a.example", "b.example"]);
  assert.equal(Object.isFrozen(normalized), true);
  assert.equal(Object.isFrozen(normalized.disabledSites), true);
});
