import test from "node:test";
import assert from "node:assert/strict";

import { installPolicyConvergence } from "../src/core/policy-convergence.js";

class EventSurface {
  constructor() { this.listeners = []; }
  addListener(listener) { this.listeners.push(listener); }
  removeListener(listener) { this.listeners = this.listeners.filter((item) => item !== listener); }
}

function makeApi() {
  return {
    runtime: { onMessage: new EventSurface() },
    contextMenus: { onClicked: new EventSurface() },
    alarms: { onAlarm: new EventSurface() }
  };
}

test("policy convergence returns existing registration before collaborator recapture", () => {
  const api = makeApi();
  const first = installPolicyConvergence({
    api,
    controller: { async syncRules() {} },
    logger: { error() {} }
  });

  let controllerGetterCalls = 0;
  const hostileController = {};
  Object.defineProperty(hostileController, "syncRules", {
    enumerable: true,
    get() {
      controllerGetterCalls += 1;
      throw new Error("controller getter must not run on reinstall");
    }
  });
  let loggerGetterCalls = 0;
  const hostileLogger = {};
  Object.defineProperty(hostileLogger, "error", {
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

  const second = installPolicyConvergence({ api, controller: hostileController, logger: hostileLogger });
  assert.equal(second, first);
  assert.equal(controllerGetterCalls, 0);
  assert.equal(loggerGetterCalls, 0);
  assert.equal(runtimeGetterCalls, 0);

  first.dispose();
});
