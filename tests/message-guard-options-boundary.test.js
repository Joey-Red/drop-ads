import assert from "node:assert/strict";
import test from "node:test";

import { createMessageGuardedApi } from "../src/core/message-contract.js";

function api() {
  const listeners = new Set();
  return {
    runtime: {
      onMessage: {
        addListener(listener) { listeners.add(listener); },
        removeListener(listener) { listeners.delete(listener); },
        hasListener(listener) { return listeners.has(listener); }
      }
    }
  };
}

test("message guard options never use normal property gets", () => {
  let gets = 0;
  const options = new Proxy({ group: "core" }, {
    get(target, key, receiver) { gets += 1; return Reflect.get(target, key, receiver); }
  });
  createMessageGuardedApi(api(), options);
  assert.equal(gets, 0);
});

test("message guard options do not execute getters", () => {
  let calls = 0;
  const options = {};
  Object.defineProperty(options, "group", { enumerable: true, get() { calls += 1; return "core"; } });
  assert.throws(() => createMessageGuardedApi(api(), options));
  assert.equal(calls, 0);
});

test("message guard rejectUnknown is strictly boolean", () => {
  assert.throws(() => createMessageGuardedApi(api(), { group: "core", rejectUnknown: "true" }));
  assert.doesNotThrow(() => createMessageGuardedApi(api(), { group: "cosmetic", rejectUnknown: false }));
});
