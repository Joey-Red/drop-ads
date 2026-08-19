import test from "node:test";
import assert from "node:assert/strict";
import { installContextBlockFeedback } from "../src/core/context-feedback.js";

function eventSource({ addError = null, removeError = null } = {}) {
  const listeners = new Set();
  return {
    listeners,
    setAddError(error) { addError = error; },
    addListener(listener) {
      if (addError) throw addError;
      listeners.add(listener);
    },
    removeListener(listener) {
      if (removeError) throw removeError;
      listeners.delete(listener);
    }
  };
}

function makeApi(contextClicked, storageChanged) {
  return {
    contextMenus: { onClicked: contextClicked },
    storage: { onChanged: storageChanged },
    action: { async setTitle() {} },
    tabs: {}
  };
}

test("M416 rolls back an earlier context listener when storage listener install fails", () => {
  const contextClicked = eventSource();
  const storageChanged = eventSource({ addError: new Error("storage listener install failed") });
  const api = makeApi(contextClicked, storageChanged);

  assert.throws(
    () => installContextBlockFeedback({ api }),
    /storage listener install failed/
  );
  assert.equal(contextClicked.listeners.size, 0);
  assert.equal(storageChanged.listeners.size, 0);

  storageChanged.setAddError(null);
  const registration = installContextBlockFeedback({ api });
  assert.equal(contextClicked.listeners.size, 1);
  assert.equal(storageChanged.listeners.size, 1);

  registration.dispose();
  assert.equal(contextClicked.listeners.size, 0);
  assert.equal(storageChanged.listeners.size, 0);
});

test("M416 failed installation publishes no reusable installation identity", () => {
  const contextClicked = eventSource();
  const storageChanged = eventSource({ addError: new Error("first install fails") });
  const api = makeApi(contextClicked, storageChanged);

  assert.throws(() => installContextBlockFeedback({ api }), /first install fails/);
  storageChanged.setAddError(null);

  const firstSuccessful = installContextBlockFeedback({ api });
  const deduped = installContextBlockFeedback({ api });
  assert.equal(deduped, firstSuccessful);

  firstSuccessful.dispose();
  const afterDispose = installContextBlockFeedback({ api });
  assert.notEqual(afterDispose, firstSuccessful);
  afterDispose.dispose();
});
