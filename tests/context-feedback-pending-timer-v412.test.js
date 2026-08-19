import test from "node:test";
import assert from "node:assert/strict";
import { installContextBlockFeedback } from "../src/core/context-feedback.js";
import { STORAGE_KEY } from "../src/core/storage.js";
import { MENU_BLOCK_DEFAULT } from "../src/core/runtime.js";

function eventSource() {
  const listeners = new Set();
  return {
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); },
    emit(...args) { for (const listener of [...listeners]) listener(...args); }
  };
}

function makeApi() {
  const clicked = eventSource();
  const changed = eventSource();
  let sends = 0;
  return {
    api: {
      contextMenus: { onClicked: clicked },
      storage: { onChanged: changed },
      action: { setTitle: async () => undefined },
      tabs: { sendMessage: async () => { sends += 1; return { cleaned: true }; } }
    },
    clicked,
    changed,
    sends: () => sends
  };
}

function committedChange() {
  return {
    [STORAGE_KEY]: {
      newValue: {
        personalBlock: [{ kind: "domain", value: "ads.example" }]
      }
    }
  };
}

test("M412 synchronous pending expiry cannot leave a stale retained entry", async () => {
  const harness = makeApi();
  const registration = installContextBlockFeedback({
    api: harness.api,
    pendingMs: 100,
    visibleMs: 100,
    setTimeoutImpl(callback) {
      callback();
      return 17;
    },
    clearTimeoutImpl() {}
  });

  harness.clicked.emit({ menuItemId: MENU_BLOCK_DEFAULT, srcUrl: "https://ads.example/banner.png" }, { id: 4 });
  harness.changed.emit(committedChange(), "local");
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(harness.sends(), 0);
  registration.dispose();
});

test("M412 timer scheduling failure fails closed without retaining the pending entry", async () => {
  const harness = makeApi();
  const registration = installContextBlockFeedback({
    api: harness.api,
    pendingMs: 100,
    visibleMs: 100,
    setTimeoutImpl() { throw new Error("timer unavailable"); },
    clearTimeoutImpl() {}
  });

  assert.doesNotThrow(() => {
    harness.clicked.emit({ menuItemId: MENU_BLOCK_DEFAULT, srcUrl: "https://ads.example/banner.png" }, { id: 4 });
  });
  harness.changed.emit(committedChange(), "local");
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(harness.sends(), 0);
  registration.dispose();
});
