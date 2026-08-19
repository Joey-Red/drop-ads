import assert from "node:assert/strict";
import test from "node:test";

import { installActionCount } from "../src/core/action-count.js";

function fixture() {
  const listeners = [];
  const api = {
    storage: {
      local: {
        async get() { return {}; },
        async set() {}
      },
      onChanged: {
        addListener(listener) { listeners.push(listener); },
        removeListener() {}
      }
    }
  };
  return { api, listeners };
}

test("action count rejects option accessors before listener registration", () => {
  const { api, listeners } = fixture();
  let reads = 0;
  const options = {};
  Object.defineProperty(options, "api", {
    enumerable: true,
    get() {
      reads += 1;
      return api;
    }
  });
  assert.throws(() => installActionCount(options), /data field/);
  assert.equal(reads, 0);
  assert.equal(listeners.length, 0);
});

test("action count rejects unknown/custom-prototype options and malformed logger", () => {
  const { api, listeners } = fixture();
  assert.throws(() => installActionCount({ api, history: true }), /unsupported field/);
  assert.throws(() => installActionCount(Object.assign(Object.create({}), { api })), /plain object/);
  assert.throws(() => installActionCount({ api, logger: {} }), /logger/);
  assert.equal(listeners.length, 0);
});

test("unsupported action-count API still returns a no-op disposable after valid parsing", () => {
  const registration = installActionCount({ api: {} });
  assert.equal(typeof registration.dispose, "function");
  assert.doesNotThrow(() => registration.dispose());
});

test("valid action-count options still install once", () => {
  const { api, listeners } = fixture();
  const logger = { warn() {} };
  const first = installActionCount({ api, logger });
  const second = installActionCount({ api, logger });
  assert.equal(first, second);
  assert.equal(listeners.length, 1);
  first.dispose();
});
