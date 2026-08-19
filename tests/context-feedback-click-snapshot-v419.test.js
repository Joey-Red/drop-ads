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

function mutableClickInfo() {
  let srcReads = 0;
  const target = {};
  const info = new Proxy(target, {
    getOwnPropertyDescriptor(_target, key) {
      if (key === "menuItemId") {
        return { configurable: true, enumerable: true, writable: true, value: MENU_BLOCK_DEFAULT };
      }
      if (key === "srcUrl") {
        srcReads += 1;
        return {
          configurable: true,
          enumerable: true,
          writable: true,
          value: srcReads === 1 ? "https://first.example/ad.png" : "https://second.example/ad.png"
        };
      }
      return undefined;
    }
  });
  return { info, srcReads: () => srcReads };
}

test("M419 derives the pending rule key and cleanup target from one detached click snapshot", async () => {
  const clicked = eventSource();
  const changed = eventSource();
  const sent = [];
  const api = {
    contextMenus: { onClicked: clicked },
    storage: { onChanged: changed },
    action: { setTitle: async () => undefined },
    tabs: {
      async sendMessage(_tabId, message) {
        sent.push(message);
        return { cleaned: true };
      }
    }
  };
  const registration = installContextBlockFeedback({
    api,
    pendingMs: 100,
    visibleMs: 100,
    setTimeoutImpl() { return 1; },
    clearTimeoutImpl() {}
  });
  const click = mutableClickInfo();

  clicked.emit(click.info, { id: 7 });
  changed.emit({
    [STORAGE_KEY]: {
      newValue: { personalBlock: [{ kind: "domain", value: "first.example" }] }
    }
  }, "local");
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();

  assert.equal(click.srcReads(), 1);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].targetUrl, "https://first.example/ad.png");
  registration.dispose();
});
