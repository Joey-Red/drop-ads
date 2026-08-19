import test from "node:test";
import assert from "node:assert/strict";
import { installContextBlockFeedback } from "../src/core/context-feedback.js";

function trackedEvent({ failAdd = false } = {}) {
  const listeners = new Set();
  const calls = [];
  return {
    calls,
    listeners,
    setFailAdd(value) { failAdd = value; },
    addListener(listener) {
      calls.push("add");
      if (failAdd) throw new Error("listener install failed");
      listeners.add(listener);
    },
    removeListener(listener) {
      calls.push("remove");
      listeners.delete(listener);
    }
  };
}

function apiFor(clicked, changed) {
  return {
    contextMenus: { onClicked: clicked },
    storage: { onChanged: changed },
    action: { setTitle: async () => undefined }
  };
}

test("M418 later listener failure rolls back earlier context listener and publishes no registration", () => {
  const clicked = trackedEvent();
  const changed = trackedEvent({ failAdd: true });
  const api = apiFor(clicked, changed);

  assert.throws(() => installContextBlockFeedback({ api }), /listener install failed/);
  assert.equal(clicked.listeners.size, 0);
  assert.deepEqual(clicked.calls, ["add", "remove"]);
  assert.deepEqual(changed.calls, ["add"]);

  changed.setFailAdd(false);
  const registration = installContextBlockFeedback({ api });
  assert.equal(clicked.listeners.size, 1);
  assert.equal(changed.listeners.size, 1);
  registration.dispose();
});

test("M418 unavailable optional browser surfaces remain a no-op", () => {
  const registration = installContextBlockFeedback({ api: { action: {} } });
  assert.equal(typeof registration.dispose, "function");
  assert.doesNotThrow(() => registration.dispose());
});
