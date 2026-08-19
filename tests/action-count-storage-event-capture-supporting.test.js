import test from "node:test";
import assert from "node:assert/strict";

import { ACTION_COUNT_PREFERENCE_KEY, installActionCount } from "../src/core/action-count.js";

function makeApi(onChanged) {
  const state = { [ACTION_COUNT_PREFERENCE_KEY]: true };
  return {
    storage: {
      local: {
        async get() { return { [ACTION_COUNT_PREFERENCE_KEY]: state[ACTION_COUNT_PREFERENCE_KEY] }; },
        async set(value) { Object.assign(state, value); }
      },
      onChanged
    },
    declarativeNetRequest: {
      async setExtensionActionOptions() {}
    }
  };
}

test("supporting hardening: storage event addListener accessors fail without getter execution", () => {
  let getterCalls = 0;
  const onChanged = { removeListener() {} };
  Object.defineProperty(onChanged, "addListener", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return () => {};
    }
  });

  assert.throws(() => installActionCount({
    api: makeApi(onChanged),
    logger: { warn() {} }
  }), /data function|safely inspectable/);
  assert.equal(getterCalls, 0);
});

test("supporting hardening: disposal uses the originally captured storage remover", async () => {
  const listeners = new Set();
  const removals = [];
  const onChanged = {
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) {
      removals.push("original");
      listeners.delete(listener);
    }
  };
  const api = makeApi(onChanged);
  const registration = installActionCount({ api, logger: { warn() {} } });
  await registration.whenIdle();

  onChanged.removeListener = () => removals.push("mutated");
  registration.dispose();

  assert.deepEqual(removals, ["original"]);
  assert.equal(listeners.size, 0);
});

test("supporting hardening: failed registration performs best-effort cleanup with the captured remover", () => {
  let removals = 0;
  const onChanged = {
    addListener() { throw new Error("registration failed"); },
    removeListener() { removals += 1; }
  };

  assert.throws(() => installActionCount({
    api: makeApi(onChanged),
    logger: { warn() {} }
  }), /registration failed/);
  assert.equal(removals, 1);
});
