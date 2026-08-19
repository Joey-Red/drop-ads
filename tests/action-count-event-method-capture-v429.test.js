import test from "node:test";
import assert from "node:assert/strict";

import { installActionCount } from "../src/core/action-count.js";

function makeApi(onChanged) {
  return {
    storage: {
      local: {
        async get() { return {}; },
        async set() {}
      },
      onChanged
    },
    declarativeNetRequest: {
      async setExtensionActionOptions() {}
    }
  };
}

test("M429 captures storage-change add/remove methods once with their receiver", async () => {
  const listeners = new Set();
  const event = {
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); }
  };
  const registration = installActionCount({ api: makeApi(event), logger: { warn() {} } });
  await registration.whenIdle();
  assert.equal(listeners.size, 1);

  event.removeListener = () => { throw new Error("later mutation must not be observed"); };
  registration.dispose();
  assert.equal(listeners.size, 0);
});

test("M429 rejects accessor-backed event methods without invoking the getter", () => {
  let getterCalls = 0;
  const event = { removeListener() {} };
  Object.defineProperty(event, "addListener", {
    configurable: true,
    get() {
      getterCalls += 1;
      return () => {};
    }
  });
  assert.throws(
    () => installActionCount({ api: makeApi(event), logger: { warn() {} } }),
    /addListener/
  );
  assert.equal(getterCalls, 0);
});
