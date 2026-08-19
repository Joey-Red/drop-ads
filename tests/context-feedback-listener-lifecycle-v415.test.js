import test from "node:test";
import assert from "node:assert/strict";
import { installContextBlockFeedback } from "../src/core/context-feedback.js";

function eventSource({ throwOnAdd = false, throwOnRemove = false } = {}) {
  const listeners = new Set();
  return {
    listeners,
    throwOnAdd,
    throwOnRemove,
    addListener(listener) {
      if (this.throwOnAdd) throw new Error("synthetic add failure");
      listeners.add(listener);
    },
    removeListener(listener) {
      if (this.throwOnRemove) throw new Error("synthetic remove failure");
      listeners.delete(listener);
    }
  };
}

function makeApi(contextClicked, storageChanged) {
  return {
    contextMenus: { onClicked: contextClicked },
    storage: { onChanged: storageChanged },
    action: { setTitle: async () => undefined }
  };
}

test("M415 context-feedback listener installation rolls back an earlier event when a later add fails", () => {
  const clicked = eventSource();
  const changed = eventSource({ throwOnAdd: true });
  const api = makeApi(clicked, changed);

  assert.throws(() => installContextBlockFeedback({ api }), /synthetic add failure/);
  assert.equal(clicked.listeners.size, 0);

  changed.throwOnAdd = false;
  const registration = installContextBlockFeedback({ api });
  assert.equal(clicked.listeners.size, 1);
  assert.equal(changed.listeners.size, 1);
  registration.dispose();
});

test("M415 teardown failure cannot retain installation identity", () => {
  const clicked = eventSource({ throwOnRemove: true });
  const changed = eventSource({ throwOnRemove: true });
  const api = makeApi(clicked, changed);
  const first = installContextBlockFeedback({ api });

  assert.doesNotThrow(() => first.dispose());
  const second = installContextBlockFeedback({ api });
  assert.notEqual(second, first);
  assert.doesNotThrow(() => second.dispose());
});
