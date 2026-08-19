import test from "node:test";
import assert from "node:assert/strict";
import { installActionCount } from "../src/core/action-count.js";

function poisonBind(fn, onRead) {
  Object.defineProperty(fn, "bind", {
    configurable: true,
    get() {
      onRead();
      throw new Error("callable bind must not be read");
    }
  });
  return fn;
}

test("M434 Protection-actions does not consult callback-owned bind", async () => {
  let bindReads = 0;
  const listeners = new Set();
  const addListener = poisonBind(function addListener(listener) { this.listeners.add(listener); }, () => { bindReads += 1; });
  const removeListener = poisonBind(function removeListener(listener) { this.listeners.delete(listener); }, () => { bindReads += 1; });
  const warn = poisonBind(function warn() {}, () => { bindReads += 1; });
  const onChanged = { listeners, addListener, removeListener };
  const api = {
    storage: {
      local: { async get() { return {}; }, async set() {} },
      onChanged
    },
    declarativeNetRequest: { async setExtensionActionOptions() {} }
  };

  const registration = installActionCount({ api, logger: { warn } });
  await registration.whenIdle();
  assert.equal(listeners.size, 1);
  registration.dispose();
  assert.equal(listeners.size, 0);
  assert.equal(bindReads, 0);
});
