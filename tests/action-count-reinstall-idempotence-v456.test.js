import test from "node:test";
import assert from "node:assert/strict";

import { installActionCount } from "../src/core/action-count.js";

class EventSurface {
  constructor() { this.listeners = []; }
  addListener(listener) { this.listeners.push(listener); }
  removeListener(listener) { this.listeners = this.listeners.filter((item) => item !== listener); }
}

function makeApi() {
  return {
    storage: {
      local: {
        async get() { return { dropAdsActionCountBadgeEnabled: true }; },
        async set() {}
      },
      onChanged: new EventSurface()
    },
    declarativeNetRequest: {
      async setExtensionActionOptions() {}
    }
  };
}

test("M456 repeated action-count install returns existing registration before collaborator recapture", async () => {
  const api = makeApi();
  const first = installActionCount({ api, logger: { warn() {} } });
  await first.whenIdle();

  let loggerGetterCalls = 0;
  const hostileLogger = {};
  Object.defineProperty(hostileLogger, "warn", {
    enumerable: true,
    get() {
      loggerGetterCalls += 1;
      throw new Error("logger getter must not run on reinstall");
    }
  });

  let storageGetterCalls = 0;
  Object.defineProperty(api.storage, "local", {
    configurable: true,
    get() {
      storageGetterCalls += 1;
      throw new Error("storage getter must not run on reinstall");
    }
  });

  const second = installActionCount({ api, logger: hostileLogger });
  assert.equal(second, first);
  assert.equal(loggerGetterCalls, 0);
  assert.equal(storageGetterCalls, 0);

  first.dispose();
});
