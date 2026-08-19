import test from "node:test";
import assert from "node:assert/strict";
import { installContextBlockFeedback } from "../src/core/context-feedback.js";

function event({ failAdd = false, throwOnRemove = false } = {}) {
  const listeners = new Set();
  let addCalls = 0;
  let removeCalls = 0;
  return {
    listeners,
    addListener(listener) {
      addCalls += 1;
      if (failAdd) throw new Error("browser refused listener registration");
      listeners.add(listener);
    },
    removeListener(listener) {
      removeCalls += 1;
      if (throwOnRemove) throw new Error("browser refused listener removal");
      listeners.delete(listener);
    },
    counts() { return { addCalls, removeCalls }; }
  };
}

function apiFor(clicked, changed) {
  return {
    contextMenus: { onClicked: clicked },
    storage: { onChanged: changed },
    action: { setTitle: async () => undefined }
  };
}

test("M419 failed second listener registration rolls back the first and publishes no installation identity", () => {
  const clicked = event();
  const changed = event({ failAdd: true });
  const api = apiFor(clicked, changed);

  assert.throws(() => installContextBlockFeedback({ api }), /browser refused listener registration/);
  assert.deepEqual(clicked.counts(), { addCalls: 1, removeCalls: 1 });
  assert.equal(clicked.listeners.size, 0);

  changed.addListener = function addListener(listener) { this.listeners.add(listener); };
  const retry = installContextBlockFeedback({ api });
  assert.equal(typeof retry.dispose, "function");
  assert.doesNotThrow(() => retry.dispose());
});

test("M419 teardown isolates listener-removal failures and always releases installation identity", () => {
  const clicked = event({ throwOnRemove: true });
  const changed = event({ throwOnRemove: true });
  const api = apiFor(clicked, changed);

  const first = installContextBlockFeedback({ api });
  assert.doesNotThrow(() => first.dispose());
  assert.doesNotThrow(() => first.dispose());
  assert.equal(clicked.counts().removeCalls, 1);
  assert.equal(changed.counts().removeCalls, 1);

  const second = installContextBlockFeedback({ api });
  assert.notEqual(second, first);
  assert.doesNotThrow(() => second.dispose());
});

test("M419 teardown uses captured event collaborators rather than mutable namespace paths", () => {
  const clicked = event();
  const changed = event();
  const api = apiFor(clicked, changed);
  const registration = installContextBlockFeedback({ api });
  api.contextMenus.onClicked = null;
  api.storage.onChanged = null;
  assert.doesNotThrow(() => registration.dispose());
  assert.equal(clicked.listeners.size, 0);
  assert.equal(changed.listeners.size, 0);
});
