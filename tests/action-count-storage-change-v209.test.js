import assert from "node:assert/strict";
import test from "node:test";

import { ACTION_COUNT_PREFERENCE_KEY, installActionCount } from "../src/core/action-count.js";

function harness() {
  let listener;
  let reads = 0;
  let applied = 0;
  const api = {
    storage: {
      local: {
        async get() {
          reads += 1;
          return { [ACTION_COUNT_PREFERENCE_KEY]: true };
        }
      },
      onChanged: {
        addListener(value) { listener = value; },
        removeListener() {}
      }
    },
    declarativeNetRequest: {
      async setExtensionActionOptions() { applied += 1; }
    }
  };
  return { api, fire: (...args) => listener(...args), reads: () => reads, applied: () => applied };
}

test("action count change routing ignores accessor/inherited/custom-prototype preference keys", async () => {
  const h = harness();
  const registration = installActionCount({ api: h.api, logger: { warn() {} } });
  await registration.whenIdle();
  const baseline = h.reads();

  let getterReads = 0;
  const accessor = {};
  Object.defineProperty(accessor, ACTION_COUNT_PREFERENCE_KEY, {
    enumerable: true,
    get() {
      getterReads += 1;
      return {};
    }
  });
  h.fire(accessor, "local");
  h.fire(Object.create({ [ACTION_COUNT_PREFERENCE_KEY]: {} }), "local");
  h.fire(Object.assign(Object.create({ custom: true }), { [ACTION_COUNT_PREFERENCE_KEY]: {} }), "local");
  await registration.whenIdle();
  assert.equal(getterReads, 0);
  assert.equal(h.reads(), baseline);
  registration.dispose();
});

test("action count change routing ignores unrelated keys but accepts own-data preference changes", async () => {
  const h = harness();
  const registration = installActionCount({ api: h.api, logger: { warn() {} } });
  await registration.whenIdle();
  const baseline = h.reads();

  h.fire({ other: { newValue: true } }, "local");
  await registration.whenIdle();
  assert.equal(h.reads(), baseline);

  h.fire({ other: {}, [ACTION_COUNT_PREFERENCE_KEY]: { newValue: false } }, "local");
  await registration.whenIdle();
  assert.equal(h.reads(), baseline + 1);
  assert.equal(h.applied(), 2);
  registration.dispose();
});
