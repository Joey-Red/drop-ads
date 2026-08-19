import test from "node:test";
import assert from "node:assert/strict";

import { installActionCount } from "../src/core/action-count.js";

function fakeApi({ removeThrows = false } = {}) {
  return {
    storage: {
      local: {
        async get() { return { dropAdsActionCountBadgeEnabled: true }; },
        async set() {}
      },
      onChanged: {
        addListener() {},
        removeListener() {
          if (removeThrows) throw new Error("remove failed");
        }
      }
    },
    declarativeNetRequest: {
      async setExtensionActionOptions() {}
    }
  };
}

test("M408 releases action-count installation identity when listener removal throws", async () => {
  const api = fakeApi({ removeThrows: true });
  const first = installActionCount({ api, logger: { warn() {} } });
  await first.whenIdle();

  assert.doesNotThrow(() => first.dispose());
  const second = installActionCount({ api, logger: { warn() {} } });
  assert.notStrictEqual(second, first);
  await second.whenIdle();
  assert.doesNotThrow(() => second.dispose());
});

test("M408 action-count disposal remains idempotent", async () => {
  const api = fakeApi();
  const registration = installActionCount({ api });
  await registration.whenIdle();
  registration.dispose();
  assert.doesNotThrow(() => registration.dispose());
});
