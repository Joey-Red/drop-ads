import test from "node:test";
import assert from "node:assert/strict";

import { installContextBlockFeedback } from "../src/core/context-feedback.js";

function makeEvent() {
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

test("M446 context feedback captures event/action callbacks without callback-owned bind", () => {
  const context = makeEvent();
  const storage = makeEvent();
  const calls = [];
  function setTitle(details) {
    assert.equal(this, action);
    calls.push(details.title);
  }
  Object.defineProperty(setTitle, "bind", {
    configurable: true,
    get() { throw new Error("bind must not be read"); }
  });
  const action = { setTitle };
  const api = {
    contextMenus: { onClicked: context.event },
    storage: { onChanged: storage.event },
    action,
    tabs: {},
    declarativeNetRequest: {}
  };
  const registration = installContextBlockFeedback({ api });
  assert.equal(context.listeners.size, 1);
  assert.equal(storage.listeners.size, 1);
  registration.dispose();
  assert.equal(context.listeners.size, 0);
  assert.equal(storage.listeners.size, 0);
  assert.deepEqual(calls, []);
});

test("M446 accessor-shaped browser methods fail without executing getters", () => {
  const context = makeEvent();
  const storage = makeEvent();
  let getterCalls = 0;
  const action = {};
  Object.defineProperty(action, "setTitle", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return () => undefined;
    }
  });
  assert.throws(() => installContextBlockFeedback({
    api: {
      contextMenus: { onClicked: context.event },
      storage: { onChanged: storage.event },
      action,
      tabs: {},
      declarativeNetRequest: {}
    }
  }), /data function/);
  assert.equal(getterCalls, 0);
  assert.equal(context.listeners.size, 0);
  assert.equal(storage.listeners.size, 0);
});

test("M446 failed second listener registration rolls back the first through captured remover", () => {
  const context = makeEvent();
  const storage = {
    addListener() { throw new Error("storage registration failed"); },
    removeListener() {}
  };
  assert.throws(() => installContextBlockFeedback({
    api: {
      contextMenus: { onClicked: context.event },
      storage: { onChanged: storage },
      action: { setTitle() {} },
      tabs: {},
      declarativeNetRequest: {}
    }
  }), /storage registration failed/);
  assert.equal(context.listeners.size, 0);
});
