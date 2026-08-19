import test from "node:test";
import assert from "node:assert/strict";
import { installContextBlockFeedback } from "../src/core/context-feedback.js";

function eventSource({ failAdd = false, failRemove = false } = {}) {
  const listeners = new Set();
  return {
    listeners,
    addListener(listener) {
      if (failAdd) throw new Error("synthetic add failure");
      listeners.add(listener);
    },
    removeListener(listener) {
      if (failRemove) throw new Error("synthetic remove failure");
      listeners.delete(listener);
    }
  };
}

function apiWithEvents(clicked, changed) {
  return {
    contextMenus: { onClicked: clicked },
    storage: { onChanged: changed },
    action: { setTitle: async () => undefined }
  };
}

test("M418 partial context-feedback listener installation rolls back in reverse-safe form", () => {
  const clicked = eventSource();
  const changed = eventSource({ failAdd: true });
  const api = apiWithEvents(clicked, changed);

  assert.throws(() => installContextBlockFeedback({ api }), /synthetic add failure/);
  assert.equal(clicked.listeners.size, 0);
  assert.equal(changed.listeners.size, 0);
});

test("M418 teardown failure still releases installation identity and allows reinstall", () => {
  const clicked = eventSource({ failRemove: true });
  const changed = eventSource({ failRemove: true });
  const api = apiWithEvents(clicked, changed);

  const first = installContextBlockFeedback({ api });
  assert.doesNotThrow(() => first.dispose());
  const second = installContextBlockFeedback({ api });
  assert.notEqual(second, first);
  assert.doesNotThrow(() => second.dispose());
});
