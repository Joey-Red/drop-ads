import test from "node:test";
import assert from "node:assert/strict";

import { installContextBlockFeedback } from "../src/core/context-feedback.js";

function eventSource({ removeThrows = false } = {}) {
  const listeners = new Set();
  return {
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) {
      if (removeThrows) throw new Error("remove failed");
      listeners.delete(listener);
    },
    fire(...args) { for (const listener of [...listeners]) listener(...args); },
    listeners
  };
}

function makeApi({ removeThrows = false } = {}) {
  const contextClicked = eventSource({ removeThrows });
  const storageChanged = eventSource({ removeThrows });
  const titleCalls = [];
  const api = {
    contextMenus: { onClicked: contextClicked },
    storage: { onChanged: storageChanged, local: {} },
    action: {
      setTitle(value) { titleCalls.push(value); return Promise.resolve(); }
    },
    declarativeNetRequest: {}
  };
  return { api, contextClicked, storageChanged, titleCalls };
}

test("M415 context-feedback dispose releases installation identity when listener removal throws", () => {
  const harness = makeApi({ removeThrows: true });
  const first = installContextBlockFeedback({ api: harness.api });

  assert.doesNotThrow(() => first.dispose());

  const second = installContextBlockFeedback({ api: harness.api });
  assert.notEqual(second, first);
  assert.doesNotThrow(() => second.dispose());
});

test("M415 stale browser listeners are inert after failed removal", () => {
  const harness = makeApi({ removeThrows: true });
  const first = installContextBlockFeedback({ api: harness.api });
  first.dispose();

  assert.doesNotThrow(() => {
    harness.contextClicked.fire(
      { menuItemId: "drop-ads:block-default", srcUrl: "https://example.com/ad.js" },
      { id: 9 }
    );
    harness.storageChanged.fire({}, "local");
  });
  assert.deepEqual(harness.titleCalls, []);
});
