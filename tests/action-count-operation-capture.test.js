import test from "node:test";
import assert from "node:assert/strict";
import { loadActionCountEnabled, setActionCountEnabled } from "../src/core/action-count.js";

test("action-count storage operation accessors are rejected without getter execution", async () => {
  let getterCalls = 0;
  const local = {};
  Object.defineProperty(local, "get", {
    enumerable: true,
    get() { getterCalls += 1; return async () => ({}); }
  });
  const api = { storage: { local }, declarativeNetRequest: {} };
  await assert.rejects(() => loadActionCountEnabled(api), /storage\.local\.get must be a data function/);
  assert.equal(getterCalls, 0);
});

test("setActionCountEnabled keeps one captured operation set across activation and persistence", async () => {
  let stored = true;
  let originalSetCalls = 0;
  let dnrCalls = 0;
  const local = {
    async get() { return { dropAdsActionCountBadgeEnabled: stored }; },
    async set(value) {
      originalSetCalls += 1;
      stored = value.dropAdsActionCountBadgeEnabled;
    }
  };
  const dnr = {
    async setExtensionActionOptions() {
      dnrCalls += 1;
      local.set = async () => { throw new Error("mutated setter must not run"); };
      dnr.setExtensionActionOptions = async () => { throw new Error("mutated DNR setter must not run"); };
    }
  };
  const result = await setActionCountEnabled({ storage: { local }, declarativeNetRequest: dnr }, false);
  assert.deepEqual(result, { enabled: false, supported: true, changed: true });
  assert.equal(originalSetCalls, 1);
  assert.equal(dnrCalls, 1);
  assert.equal(stored, false);
});

test("persistence failure rolls browser preference back through the captured DNR setter", async () => {
  let dnrCalls = 0;
  const local = {
    async get() { return { dropAdsActionCountBadgeEnabled: true }; },
    async set() { throw new Error("persist failed"); }
  };
  const dnr = {
    async setExtensionActionOptions() {
      dnrCalls += 1;
      if (dnrCalls === 1) dnr.setExtensionActionOptions = async () => { throw new Error("mutated DNR setter must not run"); };
    }
  };
  await assert.rejects(
    () => setActionCountEnabled({ storage: { local }, declarativeNetRequest: dnr }, false),
    /persist failed/
  );
  assert.equal(dnrCalls, 2);
});
