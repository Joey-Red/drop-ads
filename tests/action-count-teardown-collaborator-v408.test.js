import test from "node:test";
import assert from "node:assert/strict";
import { ACTION_COUNT_PREFERENCE_KEY, installActionCount } from "../src/core/action-count.js";

function makeApi() {
  const listeners = new Set();
  let removeCalls = 0;
  return {
    storage: {
      local: {
        async get() { return { [ACTION_COUNT_PREFERENCE_KEY]: true }; }
      },
      onChanged: {
        addListener(listener) { listeners.add(listener); },
        removeListener(listener) {
          removeCalls += 1;
          listeners.delete(listener);
          throw new Error("synthetic remove failure");
        }
      }
    },
    declarativeNetRequest: {
      async setExtensionActionOptions() {}
    },
    listenerCount() { return listeners.size; },
    removeCalls() { return removeCalls; }
  };
}

test("M408 teardown collaborator failure still releases installation identity", async () => {
  const api = makeApi();
  const first = installActionCount({ api });
  await first.whenIdle();
  assert.equal(api.listenerCount(), 1);

  assert.doesNotThrow(() => first.dispose());
  assert.equal(api.removeCalls(), 1);

  const second = installActionCount({ api });
  assert.notEqual(second, first);
  await second.whenIdle();
  assert.equal(api.listenerCount(), 1);
  assert.doesNotThrow(() => second.dispose());
});

test("M408 action-count dispose remains idempotent after listener removal failure", async () => {
  const api = makeApi();
  const registration = installActionCount({ api });
  await registration.whenIdle();

  registration.dispose();
  registration.dispose();
  assert.equal(api.removeCalls(), 1);
});
