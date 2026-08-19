import test from "node:test";
import assert from "node:assert/strict";

import { installCosmeticRuntime } from "../src/core/cosmetic-runtime.js";

class EventSurface {
  constructor() { this.listeners = []; }
  addListener(listener) { this.listeners.push(listener); }
  removeListener(listener) { this.listeners = this.listeners.filter((item) => item !== listener); }
}

function makeApi() {
  return {
    runtime: { onMessage: new EventSurface() },
    storage: { onChanged: new EventSurface() },
    tabs: { async query() { return []; } }
  };
}

test("cosmetic runtime returns existing installation before logger recapture", () => {
  const api = makeApi();
  const first = installCosmeticRuntime({ api, logger: { warn() {} } });

  let loggerGetterCalls = 0;
  const hostileLogger = {};
  Object.defineProperty(hostileLogger, "warn", {
    enumerable: true,
    get() {
      loggerGetterCalls += 1;
      throw new Error("logger getter must not run on reinstall");
    }
  });
  let runtimeGetterCalls = 0;
  Object.defineProperty(api, "runtime", {
    configurable: true,
    get() {
      runtimeGetterCalls += 1;
      throw new Error("runtime namespace getter must not run on reinstall");
    }
  });

  const second = installCosmeticRuntime({ api, logger: hostileLogger });
  assert.equal(second, first);
  assert.equal(loggerGetterCalls, 0);
  assert.equal(runtimeGetterCalls, 0);

  first.dispose();
});
