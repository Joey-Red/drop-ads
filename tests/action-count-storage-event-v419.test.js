import test from "node:test";
import assert from "node:assert/strict";
import { installActionCount } from "../src/core/action-count.js";

function eventSource() {
  const listeners = new Set();
  return {
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); },
    listenerCount() { return listeners.size; }
  };
}

test("M419 action-count teardown uses the exact storage-change event captured at install", async () => {
  const originalEvent = eventSource();
  const replacementEvent = eventSource();
  const api = {
    storage: {
      local: { async get() { return {}; } },
      onChanged: originalEvent
    },
    declarativeNetRequest: {
      async setExtensionActionOptions() {}
    }
  };
  const registration = installActionCount({ api });
  await registration.whenIdle();
  assert.equal(originalEvent.listenerCount(), 1);

  api.storage.onChanged = replacementEvent;
  registration.dispose();

  assert.equal(originalEvent.listenerCount(), 0);
  assert.equal(replacementEvent.listenerCount(), 0);
});

test("M419 listener-removal failure still releases installation identity", async () => {
  let addCalls = 0;
  const event = {
    addListener() { addCalls += 1; },
    removeListener() { throw new Error("synthetic remove failure"); }
  };
  const api = {
    storage: { local: { async get() { return {}; } }, onChanged: event },
    declarativeNetRequest: { async setExtensionActionOptions() {} }
  };
  const first = installActionCount({ api });
  await first.whenIdle();
  assert.doesNotThrow(() => first.dispose());
  const second = installActionCount({ api });
  await second.whenIdle();
  assert.notEqual(second, first);
  assert.equal(addCalls, 2);
  second.dispose();
});
