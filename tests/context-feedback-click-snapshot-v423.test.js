import test from "node:test";
import assert from "node:assert/strict";
import { installContextBlockFeedback } from "../src/core/context-feedback.js";
import { MENU_BLOCK_DEFAULT } from "../src/core/runtime.js";
import { STORAGE_KEY } from "../src/core/storage.js";
import { createMockWebExtension } from "./helpers/mock-webextension.js";

function fakeTimers() {
  let nextId = 1;
  const tasks = new Map();
  return {
    setTimeout(fn) {
      const id = nextId++;
      tasks.set(id, fn);
      return id;
    },
    clearTimeout(id) { tasks.delete(id); }
  };
}

test("M423 click target and cleanup target come from one detached descriptor snapshot", async () => {
  const mock = createMockWebExtension();
  const timers = fakeTimers();
  const cleanupTargets = [];
  mock.api.tabs.sendMessage = async (_tabId, message) => {
    cleanupTargets.push(message.targetUrl);
    return { cleaned: true };
  };

  installContextBlockFeedback({
    api: mock.api,
    setTimeoutImpl: timers.setTimeout,
    clearTimeoutImpl: timers.clearTimeout
  });

  let srcDescriptorReads = 0;
  const firstUrl = "https://snapshot.example/ad.png";
  const laterUrl = "https://changed.example/other.png";
  const target = {
    menuItemId: MENU_BLOCK_DEFAULT,
    srcUrl: firstUrl,
    frameId: 0
  };
  const info = new Proxy(target, {
    getOwnPropertyDescriptor(object, key) {
      if (key === "srcUrl") {
        srcDescriptorReads += 1;
        const value = srcDescriptorReads === 1 ? firstUrl : laterUrl;
        return { value, enumerable: true, configurable: true, writable: true };
      }
      return Reflect.getOwnPropertyDescriptor(object, key);
    }
  });

  mock.events.menuClicked.emit(info, { id: 9 });
  await mock.api.storage.local.set({
    [STORAGE_KEY]: { personalBlock: [{ kind: "domain", value: "snapshot.example" }] }
  });
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(srcDescriptorReads, 1);
  assert.deepEqual(cleanupTargets, [firstUrl]);
});
