import test from "node:test";
import assert from "node:assert/strict";
import { installActionCount } from "../src/core/action-count.js";

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function event() {
  const listeners = [];
  return {
    addListener(listener) { listeners.push(listener); },
    removeListener(listener) {
      const index = listeners.indexOf(listener);
      if (index >= 0) listeners.splice(index, 1);
    }
  };
}

test("disposing during action-count preference read prevents later browser UI mutation", async () => {
  const read = deferred();
  const browserCalls = [];
  let getCalls = 0;
  const api = {
    declarativeNetRequest: {
      async setExtensionActionOptions(options) { browserCalls.push(options); }
    },
    storage: {
      local: {
        async get() { getCalls += 1; return read.promise; },
        async set() {}
      },
      onChanged: event()
    }
  };

  const registration = installActionCount({ api, logger: { warn() {} } });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(getCalls, 1);

  registration.dispose();
  read.resolve({});
  await registration.whenIdle();
  assert.deepEqual(browserCalls, []);
});
