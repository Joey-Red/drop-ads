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
    setTimeout(fn) { const id = nextId++; tasks.set(id, fn); return id; },
    clearTimeout(id) { tasks.delete(id); }
  };
}

test("pending cleanup keeps the captured tab and action collaborators", async () => {
  const mock = createMockWebExtension();
  const timers = fakeTimers();
  let originalSends = 0;
  let redirectedSends = 0;
  let originalTitles = 0;
  let redirectedTitles = 0;
  mock.api.tabs.sendMessage = async () => { originalSends += 1; return { cleaned: true }; };
  mock.api.action.setTitle = async () => { originalTitles += 1; };

  const registration = installContextBlockFeedback({
    api: mock.api,
    setTimeoutImpl: timers.setTimeout,
    clearTimeoutImpl: timers.clearTimeout
  });

  mock.api.tabs.sendMessage = async () => { redirectedSends += 1; return { cleaned: true }; };
  mock.api.action.setTitle = async () => { redirectedTitles += 1; };

  mock.events.menuClicked.emit({ menuItemId: MENU_BLOCK_DEFAULT, srcUrl: "https://capture.example/ad.png" }, { id: 7 });
  await mock.api.storage.local.set({
    [STORAGE_KEY]: { personalBlock: [{ kind: "domain", value: "capture.example" }] }
  });
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(originalSends, 1);
  assert.equal(redirectedSends, 0);
  assert.ok(originalTitles >= 1);
  assert.equal(redirectedTitles, 0);
  registration.dispose();
});
