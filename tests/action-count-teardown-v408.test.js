import test from "node:test";
import assert from "node:assert/strict";

import { installActionCount } from "../src/core/action-count.js";

function fakeApi() {
  return {
    storage: {
      local: {
        async get() { return { dropAdsActionCountBadgeEnabled: true }; },
        async set() {}
      },
      onChanged: {
        addListener() {},
        removeListener() { throw new Error("remove failure"); }
      }
    },
    declarativeNetRequest: {
      async setExtensionActionOptions() {}
    }
  };
}

test("M408 teardown removal failure releases installation identity", () => {
  const api = fakeApi();
  const first = installActionCount({ api });
  assert.doesNotThrow(() => first.dispose());

  const second = installActionCount({ api });
  assert.notEqual(second, first);
  assert.doesNotThrow(() => second.dispose());
});

test("M408 disposal remains idempotent when listener removal throws", () => {
  const registration = installActionCount({ api: fakeApi() });
  assert.doesNotThrow(() => registration.dispose());
  assert.doesNotThrow(() => registration.dispose());
});
