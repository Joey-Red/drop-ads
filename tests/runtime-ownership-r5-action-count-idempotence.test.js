import test from "node:test";
import assert from "node:assert/strict";
import { installActionCount } from "../src/core/action-count.js";

function storageEvent() {
  const listeners = new Set();
  return {
    listeners,
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); }
  };
}

test("R5 duplicate action-count install returns the healthy registration before logger recapture", async () => {
  const onChanged = storageEvent();
  const api = {
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

  const first = installActionCount({ api, logger: { warn() {} } });
  await first.whenIdle();
  let getterCalls = 0;
  const hostileLogger = {};
  Object.defineProperty(hostileLogger, "warn", {
    enumerable: true,
    get() { getterCalls += 1; throw new Error("duplicate install must not recapture logger"); }
  });

  const second = installActionCount({ api, logger: hostileLogger });
  assert.equal(second, first);
  assert.equal(getterCalls, 0);
  first.dispose();
});
