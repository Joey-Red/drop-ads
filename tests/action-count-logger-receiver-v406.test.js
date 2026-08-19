import test from "node:test";
import assert from "node:assert/strict";

import { installActionCount } from "../src/core/action-count.js";

function fakeApi({ applyThrows = false } = {}) {
  return {
    storage: {
      local: {
        async get() { return { dropAdsActionCountBadgeEnabled: true }; },
        async set() {}
      },
      onChanged: {
        addListener() {},
        removeListener() {}
      }
    },
    declarativeNetRequest: {
      async setExtensionActionOptions() {
        if (applyThrows) throw new Error("apply failed");
      }
    }
  };
}

test("M406 preserves supplied logger receiver and contains warning failure", async () => {
  const api = fakeApi({ applyThrows: true });
  const receivers = [];
  const logger = {
    marker: "original",
    warn() {
      receivers.push(this.marker);
      throw new Error("logger failed");
    }
  };

  const registration = installActionCount({ api, logger });
  await registration.whenIdle();
  await Promise.resolve();

  assert.deepEqual(receivers, ["original"]);
  assert.doesNotThrow(() => registration.dispose());
});

test("M406 accessor-backed logger warning is rejected without getter execution", () => {
  let reads = 0;
  const logger = {};
  Object.defineProperty(logger, "warn", {
    enumerable: true,
    get() {
      reads += 1;
      return () => undefined;
    }
  });

  assert.throws(() => installActionCount({ api: fakeApi(), logger }), /must provide warn/);
  assert.equal(reads, 0);
});
