import test from "node:test";
import assert from "node:assert/strict";
import { createMessageGuardedApi } from "../src/core/message-contract.js";

test("R1 message guard keeps the originally captured onMessage receiver and methods", () => {
  const listeners = new Set();
  const event = {
    addListener(listener) {
      assert.equal(this, event);
      listeners.add(listener);
    },
    removeListener(listener) {
      assert.equal(this, event);
      listeners.delete(listener);
    }
  };
  const runtime = { onMessage: event };
  const api = { runtime };
  const guarded = createMessageGuardedApi(api, { group: "core" });

  event.addListener = () => { throw new Error("later mutation must not redirect registration"); };
  const listener = () => false;
  guarded.runtime.onMessage.addListener(listener);
  assert.equal(listeners.size, 1);
  guarded.runtime.onMessage.removeListener(listener);
  assert.equal(listeners.size, 0);
});

test("R1 message guard rejects accessor runtime namespaces without executing them", () => {
  let getterCalls = 0;
  const api = {};
  Object.defineProperty(api, "runtime", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return { onMessage: { addListener() {} } };
    }
  });

  assert.throws(() => createMessageGuardedApi(api, { group: "core" }), /data property/);
  assert.equal(getterCalls, 0);
});
