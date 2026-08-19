import test from "node:test";
import assert from "node:assert/strict";

import { installCosmeticRuntime } from "../src/core/cosmetic-runtime.js";

function event() {
  const listeners = new Set();
  return {
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); }
  };
}

function fakeApi() {
  return {
    runtime: { onMessage: event() },
    storage: { onChanged: event() },
    tabs: {
      async query() { return []; },
      async sendMessage() {}
    }
  };
}

test("M462 duplicate cosmetic install returns the existing runtime before logger recapture", () => {
  const api = fakeApi();
  const first = installCosmeticRuntime({ api, logger: { warn() {} } });
  let getterRuns = 0;
  const hostileLogger = {};
  Object.defineProperty(hostileLogger, "warn", {
    enumerable: true,
    get() { getterRuns += 1; throw new Error("must not run"); }
  });

  const second = installCosmeticRuntime({ api, logger: hostileLogger });
  assert.equal(second, first);
  assert.equal(getterRuns, 0);
  first.dispose();
});

test("M462 first cosmetic install still validates the supplied logger", () => {
  const api = fakeApi();
  let getterRuns = 0;
  const hostileLogger = {};
  Object.defineProperty(hostileLogger, "warn", {
    enumerable: true,
    get() { getterRuns += 1; return () => {}; }
  });

  assert.throws(() => installCosmeticRuntime({ api, logger: hostileLogger }), /logger must provide warn/);
  assert.equal(getterRuns, 0);
});
