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
    clearTimeout(id) { tasks.delete(id); },
    get count() { return tasks.size; }
  };
}

function install(mock, timers) {
  return installContextBlockFeedback({
    api: mock.api,
    setTimeoutImpl: timers.setTimeout,
    clearTimeoutImpl: timers.clearTimeout
  });
}

test("context feedback ignores accessor and inherited click discriminators without invoking them", () => {
  const mock = createMockWebExtension();
  const timers = fakeTimers();
  install(mock, timers);

  let reads = 0;
  const accessorInfo = {};
  Object.defineProperty(accessorInfo, "menuItemId", { enumerable: true, get() { reads += 1; return MENU_BLOCK_DEFAULT; } });
  Object.defineProperty(accessorInfo, "srcUrl", { enumerable: true, get() { reads += 1; return "https://getter.example/ad.png"; } });
  mock.events.menuClicked.emit(accessorInfo, { id: 1 });
  assert.equal(reads, 0);
  assert.equal(timers.count, 0);

  const inheritedInfo = Object.create({ menuItemId: MENU_BLOCK_DEFAULT, srcUrl: "https://inherited.example/ad.png" });
  mock.events.menuClicked.emit(inheritedInfo, { id: 2 });
  assert.equal(timers.count, 0);

  let tabReads = 0;
  const accessorTab = {};
  Object.defineProperty(accessorTab, "id", { enumerable: true, get() { tabReads += 1; return 3; } });
  mock.events.menuClicked.emit({ menuItemId: MENU_BLOCK_DEFAULT, srcUrl: "https://tab-getter.example/ad.png" }, accessorTab);
  assert.equal(tabReads, 0);
  assert.equal(timers.count, 0);
});

test("context feedback ignores accessor storage changes without invoking them", () => {
  const mock = createMockWebExtension();
  const timers = fakeTimers();
  install(mock, timers);
  mock.events.menuClicked.emit({ menuItemId: MENU_BLOCK_DEFAULT, srcUrl: "https://pending.example/ad.png" }, { id: 4 });
  assert.equal(timers.count, 1);

  let reads = 0;
  const changes = {};
  Object.defineProperty(changes, STORAGE_KEY, {
    enumerable: true,
    get() {
      reads += 1;
      return { newValue: { personalBlock: [{ kind: "domain", value: "pending.example" }] } };
    }
  });
  mock.events.storageChanged.emit(changes, "local");
  assert.equal(reads, 0);
  assert.equal(timers.count, 1);
});

test("context cleanup trusts only an own data cleaned response", async () => {
  const mock = createMockWebExtension();
  const timers = fakeTimers();
  let cleanedReads = 0;
  mock.api.tabs.sendMessage = async () => {
    const response = {};
    Object.defineProperty(response, "cleaned", {
      enumerable: true,
      get() { cleanedReads += 1; return true; }
    });
    return response;
  };
  install(mock, timers);

  mock.events.menuClicked.emit({ menuItemId: MENU_BLOCK_DEFAULT, srcUrl: "https://cleanup-shape.example/ad.png" }, { id: 5 });
  await mock.api.storage.local.set({
    [STORAGE_KEY]: { personalBlock: [{ kind: "domain", value: "cleanup-shape.example" }] }
  });
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(cleanedReads, 0);
  assert.match(mock.inspect.actionTitles.get(5), /Refresh the page/i);
});
