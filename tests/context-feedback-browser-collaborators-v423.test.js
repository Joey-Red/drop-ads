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

test("M423 context feedback keeps captured browser method receivers after API mutation", async () => {
  const clicked = eventSource();
  const changed = eventSource();
  const calls = [];
  const action = {
    marker: "action",
    async setTitle(details) {
      calls.push(["title", this.marker, details.title]);
    }
  };
  const tabs = {
    marker: "tabs",
    async sendMessage(tabId, message) {
      calls.push(["send", this.marker, tabId, message.targetUrl]);
      return { cleaned: true };
    }
  };
  const api = {
    contextMenus: { onClicked: clicked },
    storage: { onChanged: changed },
    action,
    tabs
  };

  const registration = installContextBlockFeedback({
    api,
    pendingMs: 100,
    visibleMs: 100,
    setTimeoutImpl() { return 1; },
    clearTimeoutImpl() {}
  });

  action.setTitle = async () => { throw new Error("mutated title collaborator used"); };
  tabs.sendMessage = async () => { throw new Error("mutated send collaborator used"); };

  clicked.emit({
    menuItemId: MENU_BLOCK_DEFAULT,
    srcUrl: "https://ads.example/banner.png",
    frameId: 0
  }, { id: 9 });
  changed.emit({
    [STORAGE_KEY]: {
      newValue: { personalBlock: [{ kind: "domain", value: "ads.example" }] }
    }
  }, "local");

  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();

  assert.deepEqual(calls[0], ["send", "tabs", 9, "https://ads.example/banner.png"]);
  assert.equal(calls.some((entry) => entry[0] === "title" && entry[1] === "action"), true);
  registration.dispose();
});
