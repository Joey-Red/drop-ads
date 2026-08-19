import test from "node:test";
import assert from "node:assert/strict";
import { installContextBlockFeedback } from "../src/core/context-feedback.js";
import { MENU_BLOCK_DEFAULT } from "../src/core/runtime.js";
import { createMockWebExtension } from "./helpers/mock-webextension.js";

function timers() {
  let next = 1;
  const pending = new Map();
  return {
    setTimeout(fn) { const id = next++; pending.set(id, fn); return id; },
    clearTimeout(id) { pending.delete(id); },
    get count() { return pending.size; }
  };
}

test("context feedback reads validated options without normal property gets", () => {
  const mock = createMockWebExtension();
  const clock = timers();
  let gets = 0;
  const options = new Proxy({
    api: mock.api,
    pendingMs: 10,
    visibleMs: 20,
    setTimeoutImpl: clock.setTimeout,
    clearTimeoutImpl: clock.clearTimeout
  }, {
    get(target, key, receiver) {
      gets += 1;
      return Reflect.get(target, key, receiver);
    }
  });
  const registration = installContextBlockFeedback(options);
  assert.equal(gets, 0);
  registration.dispose();
});

test("context feedback keeps valid null-prototype event data and timer overrides", () => {
  const mock = createMockWebExtension();
  const clock = timers();
  const registration = installContextBlockFeedback({
    api: mock.api,
    pendingMs: 25,
    visibleMs: 30,
    setTimeoutImpl: clock.setTimeout,
    clearTimeoutImpl: clock.clearTimeout
  });
  const info = Object.create(null);
  info.menuItemId = MENU_BLOCK_DEFAULT;
  info.srcUrl = "https://shared-fields.example/ad.png";
  const tab = Object.create(null);
  tab.id = 17;
  mock.events.menuClicked.emit(info, tab);
  assert.equal(clock.count, 1);
  registration.dispose();
  assert.equal(clock.count, 0);
});
