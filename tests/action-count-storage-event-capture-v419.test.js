import test from "node:test";
import assert from "node:assert/strict";
import { installActionCount } from "../src/core/action-count.js";

function eventSource() {
  const listeners = new Set();
  return {
    listeners,
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); }
  };
}

test("M419 Protection-actions disposal removes from the exact captured storage event", async () => {
  const original = eventSource();
  const replacement = eventSource();
  const api = {
    storage: {
      local: { async get() { return {}; } },
      onChanged: original
    },
    declarativeNetRequest: {
      async setExtensionActionOptions() {}
    }
  };

  const registration = installActionCount({ api });
  await registration.whenIdle();
  assert.equal(original.listeners.size, 1);

  api.storage.onChanged = replacement;
  registration.dispose();
  assert.equal(original.listeners.size, 0);
  assert.equal(replacement.listeners.size, 0);
});
