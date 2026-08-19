import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { createMessageGuardedApi } from "../src/core/message-contract.js";

const source = fs.readFileSync(new URL("../src/core/message-contract.js", import.meta.url), "utf8");

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

test("M458 message guard captures runtime/onMessage and event methods once", () => {
  const { event, listeners } = eventHarness();
  const runtime = { onMessage: event };
  const api = { runtime };
  const guarded = createMessageGuardedApi(api, { group: "core" });
  const listener = () => false;
  guarded.runtime.onMessage.addListener(listener);
  assert.equal(listeners.size, 1);

  Object.defineProperty(event, "removeListener", {
    configurable: true,
    get() { throw new Error("late event method read"); }
  });
  Object.defineProperty(runtime, "onMessage", {
    configurable: true,
    get() { throw new Error("late onMessage read"); }
  });
  guarded.runtime.onMessage.removeListener(listener);
  assert.equal(listeners.size, 0);
});

test("M458 accessor-shaped runtime collaborators fail without getter execution", () => {
  let getterCalls = 0;
  const api = {};
  Object.defineProperty(api, "runtime", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return { onMessage: eventHarness().event };
    }
  });
  assert.throws(() => createMessageGuardedApi(api, { group: "core" }), /runtime namespace must be a data property/);
  assert.equal(getterCalls, 0);
});

test("M458 event callbacks use receiver-preserving Reflect.apply capture", () => {
  assert.match(source, /function captureMessageGuardMethod\(receiver, key, label, required = true\)/);
  assert.match(source, /return \(\.\.\.args\) => Reflect\.apply\(callback, receiver, args\);/);
  assert.match(source, /const addMessageListener = captureMessageGuardMethod\(rawOnMessage, "addListener"/);
  assert.match(source, /const removeMessageListener = captureMessageGuardMethod\(rawOnMessage, "removeListener"/);
  assert.doesNotMatch(source, /rawOnMessage\.addListener\(/);
  assert.doesNotMatch(source, /rawOnMessage\.removeListener/);
});
