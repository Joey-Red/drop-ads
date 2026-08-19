import test from "node:test";
import assert from "node:assert/strict";
import { ACTION_COUNT_PREFERENCE_KEY, installActionCount } from "../src/core/action-count.js";

function eventHarness() {
  const listeners = new Set();
  return {
    event: {
      addListener(listener) { listeners.add(listener); },
      removeListener(listener) { listeners.delete(listener); }
    },
    listeners
  };
}

test("R5 action-count duplicate install returns existing registration before hostile logger inspection", async () => {
  const changed = eventHarness();
  const api = {
    storage: {
      local: {
        async get() { return { [ACTION_COUNT_PREFERENCE_KEY]: true }; },
        async set() {}
      },
      onChanged: changed.event
    },
    declarativeNetRequest: {
      async setExtensionActionOptions() {}
    }
  };

  const first = installActionCount({ api, logger: { warn() {} } });
  await first.whenIdle();
  assert.equal(changed.listeners.size, 1);

  let warnGets = 0;
  const hostileLogger = {};
  Object.defineProperty(hostileLogger, "warn", {
    enumerable: true,
    get() {
      warnGets += 1;
      throw new Error("duplicate install must not inspect logger.warn");
    }
  });

  const second = installActionCount({ api, logger: hostileLogger });
  assert.equal(second, first);
  assert.equal(warnGets, 0);
  assert.equal(changed.listeners.size, 1);

  first.dispose();
  assert.equal(changed.listeners.size, 0);

  const third = installActionCount({ api, logger: { warn() {} } });
  assert.notEqual(third, first);
  await third.whenIdle();
  third.dispose();
});
