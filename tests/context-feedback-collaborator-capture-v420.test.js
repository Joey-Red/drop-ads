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

test("M420 context feedback retains receiver-bound action/tab collaborators captured at install", async () => {
  const clicked = eventSource();
  const changed = eventSource();
  const titleCalls = [];
  const sendCalls = [];
  const action = {
    async setTitle(payload) {
      assert.equal(this, action);
      titleCalls.push(payload);
    }
  };
  const tabs = {
    async sendMessage(tabId, message, options) {
      assert.equal(this, tabs);
      sendCalls.push({ tabId, message, options });
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

  action.setTitle = () => { throw new Error("late action mutation"); };
  tabs.sendMessage = () => { throw new Error("late tabs mutation"); };

  clicked.emit({ menuItemId: MENU_BLOCK_DEFAULT, srcUrl: "https://ads.example/pixel.png", frameId: 4 }, { id: 9 });
  changed.emit({
    [STORAGE_KEY]: { newValue: { personalBlock: [{ kind: "domain", value: "ads.example" }] } }
  }, "local");
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();

  assert.equal(sendCalls.length, 1);
  assert.equal(sendCalls[0].tabId, 9);
  assert.equal(sendCalls[0].message.targetUrl, "https://ads.example/pixel.png");
  assert.deepEqual(sendCalls[0].options, { frameId: 4 });
  assert.ok(titleCalls.some((call) => call.tabId === 9 && call.title.includes("removed from this page")));
  registration.dispose();
});
