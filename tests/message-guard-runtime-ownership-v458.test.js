import test from "node:test";
import assert from "node:assert/strict";

import { createMessageGuardedApi } from "../src/core/message-contract.js";

function eventHarness() {
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
  return { event, listeners };
}

test("M458 captured onMessage methods retain the original event receiver after mutation", () => {
  const { event, listeners } = eventHarness();
  const api = { runtime: { onMessage: event } };
  const guarded = createMessageGuardedApi(api, { group: "core" });
  const messages = guarded.runtime.onMessage;
  event.addListener = () => { throw new Error("mutated addListener must not run"); };
  event.removeListener = () => { throw new Error("mutated removeListener must not run"); };

  const listener = () => false;
  messages.addListener(listener);
  assert.equal(messages.hasListener(listener), true);
  assert.equal(listeners.size, 1);
  messages.removeListener(listener);
  assert.equal(messages.hasListener(listener), false);
  assert.equal(listeners.size, 0);
});

test("M458 accessor-backed runtime namespace is rejected without getter execution", () => {
  let getterRuns = 0;
  const api = {};
  Object.defineProperty(api, "runtime", {
    enumerable: true,
    get() {
      getterRuns += 1;
      return { onMessage: eventHarness().event };
    }
  });

  assert.throws(() => createMessageGuardedApi(api, { group: "core" }), /runtime namespace.*data property/i);
  assert.equal(getterRuns, 0);
});
