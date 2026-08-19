import test from "node:test";
import assert from "node:assert/strict";
import { installContextBlockFeedback } from "../src/core/context-feedback.js";

function eventSource(options = {}) {
  const listeners = new Set();
  let throwAdd = options.throwAdd === true;
  let throwRemove = options.throwRemove === true;
  return {
    listeners,
    addListener(listener) {
      if (throwAdd) throw new Error("add failed");
      listeners.add(listener);
    },
    removeListener(listener) {
      listeners.delete(listener);
      if (throwRemove) throw new Error("remove failed");
    },
    setThrowAdd(value) { throwAdd = value; },
    setThrowRemove(value) { throwRemove = value; }
  };
}

function makeApi(contextClicked = eventSource(), storageChanged = eventSource()) {
  return {
    contextMenus: { onClicked: contextClicked },
    storage: { onChanged: storageChanged },
    action: { async setTitle() {} }
  };
}

test("M416 rolls back an earlier context-feedback listener when later registration fails", () => {
  const contextClicked = eventSource();
  const storageChanged = eventSource({ throwAdd: true });
  const api = makeApi(contextClicked, storageChanged);

  assert.throws(() => installContextBlockFeedback({ api }), /add failed/);
  assert.equal(contextClicked.listeners.size, 0);
  assert.equal(storageChanged.listeners.size, 0);

  storageChanged.setThrowAdd(false);
  const registration = installContextBlockFeedback({ api });
  assert.equal(contextClicked.listeners.size, 1);
  assert.equal(storageChanged.listeners.size, 1);
  registration.dispose();
});

test("M416 teardown failure cannot pin installation identity or block reinstall", () => {
  const contextClicked = eventSource();
  const storageChanged = eventSource();
  const api = makeApi(contextClicked, storageChanged);
  const first = installContextBlockFeedback({ api });

  contextClicked.setThrowRemove(true);
  storageChanged.setThrowRemove(true);
  assert.doesNotThrow(() => first.dispose());

  contextClicked.setThrowRemove(false);
  storageChanged.setThrowRemove(false);
  const second = installContextBlockFeedback({ api });
  assert.notEqual(second, first);
  second.dispose();
});
