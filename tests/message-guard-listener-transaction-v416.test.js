import test from "node:test";
import assert from "node:assert/strict";
import { createMessageGuardedApi } from "../src/core/message-contract.js";

function makeRuntimeEvent({ failAddOnce = false, failRemove = false } = {}) {
  const listeners = new Set();
  let addFailures = failAddOnce ? 1 : 0;
  return {
    listeners,
    addListener(listener) {
      if (addFailures) {
        addFailures -= 1;
        throw new Error("synthetic add failure");
      }
      listeners.add(listener);
    },
    removeListener(listener) {
      if (failRemove) throw new Error("synthetic remove failure");
      listeners.delete(listener);
    }
  };
}

test("M416 failed browser registration rolls back logical identity and allows retry", () => {
  const onMessage = makeRuntimeEvent({ failAddOnce: true });
  const guarded = createMessageGuardedApi({ runtime: { onMessage } }, { group: "core" });
  const listener = () => false;

  assert.throws(() => guarded.runtime.onMessage.addListener(listener), /synthetic add failure/);
  assert.equal(guarded.runtime.onMessage.hasListener(listener), false);
  assert.doesNotThrow(() => guarded.runtime.onMessage.addListener(listener));
  assert.equal(guarded.runtime.onMessage.hasListener(listener), true);
  assert.equal(onMessage.listeners.size, 1);
});

test("M416 throwing browser removal leaves retained wrapper inert and allows logical reinstall", () => {
  const onMessage = makeRuntimeEvent({ failRemove: true });
  const guarded = createMessageGuardedApi({ runtime: { onMessage } }, { group: "core" });
  const calls = [];
  const listener = () => { calls.push("called"); return false; };

  guarded.runtime.onMessage.addListener(listener);
  const staleWrapper = [...onMessage.listeners][0];
  assert.doesNotThrow(() => guarded.runtime.onMessage.removeListener(listener));
  assert.equal(guarded.runtime.onMessage.hasListener(listener), false);
  assert.equal(staleWrapper({ type: "drop-ads:get-ui-state" }, {}, () => {}), false);
  assert.deepEqual(calls, []);
});
