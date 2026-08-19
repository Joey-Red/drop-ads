import test from "node:test";
import assert from "node:assert/strict";
import { installContextBlockFeedback } from "../src/core/context-feedback.js";

function poisonBind(fn) {
  Object.defineProperty(fn, "bind", {
    configurable: true,
    get() { throw new Error("callback-owned bind must not be read"); }
  });
  return fn;
}

function eventHarness() {
  const listeners = new Set();
  let addCalls = 0;
  let removeCalls = 0;
  const addListener = poisonBind(function addListener(listener) {
    assert.equal(this, event);
    addCalls += 1;
    listeners.add(listener);
  });
  const removeListener = poisonBind(function removeListener(listener) {
    assert.equal(this, event);
    removeCalls += 1;
    listeners.delete(listener);
  });
  const event = { addListener, removeListener };
  return { event, listeners, get addCalls() { return addCalls; }, get removeCalls() { return removeCalls; } };
}

function apiHarness(contextEvent, storageEvent) {
  return {
    contextMenus: { onClicked: contextEvent },
    storage: {
      onChanged: storageEvent,
      local: { get() { return Promise.resolve({}); } }
    },
    action: { setTitle() {}, setBadgeText() {} },
    tabs: { sendMessage() { return Promise.resolve({ cleaned: false }); } },
    declarativeNetRequest: {}
  };
}

test("M444 captures event add/remove operations with receiver identity and without callback bind", () => {
  const context = eventHarness();
  const storage = eventHarness();
  const registration = installContextBlockFeedback({ api: apiHarness(context.event, storage.event) });

  assert.equal(context.addCalls, 1);
  assert.equal(storage.addCalls, 1);
  assert.equal(context.listeners.size, 1);
  assert.equal(storage.listeners.size, 1);

  context.event.removeListener = () => { throw new Error("mutated remover must not run"); };
  storage.event.removeListener = () => { throw new Error("mutated remover must not run"); };
  registration.dispose();

  assert.equal(context.removeCalls, 1);
  assert.equal(storage.removeCalls, 1);
  assert.equal(context.listeners.size, 0);
  assert.equal(storage.listeners.size, 0);
});

test("M444 rejects accessor-shaped listener collaborators without executing them", () => {
  let getterCalls = 0;
  const badEvent = {};
  Object.defineProperty(badEvent, "addListener", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return () => {};
    }
  });
  badEvent.removeListener = () => {};
  const storage = eventHarness();

  assert.throws(
    () => installContextBlockFeedback({ api: apiHarness(badEvent, storage.event) }),
    /addListener.*data function/i
  );
  assert.equal(getterCalls, 0);
  assert.equal(storage.addCalls, 0);
});
