import assert from "node:assert/strict";
import test from "node:test";

import { createBackgroundRuntime } from "../src/core/runtime.js";
import { completeBackgroundApiFixture } from "./helpers/background-api-fixture.js";

function minimalApi() {
  return completeBackgroundApiFixture({
    runtime: {},
    storage: {},
    declarativeNetRequest: {},
    contextMenus: {},
    alarms: {},
    tabs: {}
  });
}

test("background runtime options reject accessors without executing them", () => {
  let reads = 0;
  const options = {};
  Object.defineProperty(options, "api", {
    enumerable: true,
    get() {
      reads += 1;
      return minimalApi();
    }
  });
  assert.throws(() => createBackgroundRuntime(options));
  assert.equal(reads, 0);
});

test("background runtime options reject unknown fields before API inspection", () => {
  const api = new Proxy({}, { get() { throw new Error("API inspected"); } });
  assert.throws(() => createBackgroundRuntime({ api, surprise: true }), /Background runtime options/);
});

test("background runtime options reject custom prototypes and malformed loggers", () => {
  assert.throws(() => createBackgroundRuntime(Object.assign(Object.create({}), { api: minimalApi() })));
  assert.throws(() => createBackgroundRuntime({ api: minimalApi(), logger: { warn() {} } }), /warn\(\) and error\(\)/);
});

test("background runtime defaults are admitted through the exact option boundary", () => {
  const controller = createBackgroundRuntime({ api: minimalApi() });
  assert.equal(typeof controller.start, "function");
  assert.equal(typeof controller.dynamicRuleLimit, "function");
});
