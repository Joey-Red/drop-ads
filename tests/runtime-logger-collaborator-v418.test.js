import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createBackgroundRuntime } from "../src/core/runtime.js";

function eventSource() {
  const listeners = new Set();
  return {
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); },
    emit(...args) { for (const listener of [...listeners]) listener(...args); }
  };
}

function makeApi() {
  const startup = eventSource();
  return {
    startup,
    api: {
      runtime: { onInstalled: eventSource(), onStartup: startup, onMessage: eventSource() },
      storage: { onChanged: eventSource() },
      declarativeNetRequest: {},
      contextMenus: {
        onClicked: eventSource(),
        async removeAll() { throw new Error("menu setup failed"); },
        create() {}
      },
      alarms: { onAlarm: eventSource(), async clear() { return false; }, create() {} },
      tabs: {}
    }
  };
}

test("M418 background logger accessors are rejected without getter execution", () => {
  const harness = makeApi();
  let getterCalls = 0;
  const logger = { error() {} };
  Object.defineProperty(logger, "warn", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return () => {};
    }
  });
  assert.throws(() => createBackgroundRuntime({ api: harness.api, logger }), /own enumerable data warn\(\) and error\(\) functions/);
  assert.equal(getterCalls, 0);
});

test("M418 captured logger callbacks preserve receiver, ignore mutation, and contain diagnostic throws", async () => {
  const harness = makeApi();
  const calls = [];
  let normalGets = 0;
  const target = {
    warn() {
      assert.equal(this, logger);
      calls.push("warn-original");
      throw new Error("warning sink failed");
    },
    error(message) {
      assert.equal(this, logger);
      calls.push(["error-original", message]);
      throw new Error("error sink failed");
    }
  };
  const logger = new Proxy(target, {
    get(targetObject, property, receiver) {
      normalGets += 1;
      return Reflect.get(targetObject, property, receiver);
    }
  });

  const runtime = createBackgroundRuntime({ api: harness.api, logger });
  assert.equal(normalGets, 0);
  target.error = () => calls.push("error-mutated");
  target.warn = () => calls.push("warn-mutated");

  runtime.start();
  harness.startup.emit();
  await runtime.whenIdle();
  await Promise.resolve();

  assert.deepEqual(calls, [["error-original", "drop-ads startup initialization failed"]]);
  assert.equal(normalGets, 0);
});

test("M418 runtime source keeps diagnostics behind the captured best-effort facade", () => {
  const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");
  assert.match(source, /function bestEffortBoundLogger\(callback, receiver\)/);
  assert.match(source, /warn: bestEffortBoundLogger\(warnField\.value, logger\)/);
  assert.match(source, /error: bestEffortBoundLogger\(errorField\.value, logger\)/);
  const runtimeBody = source.slice(source.indexOf("export function createBackgroundRuntime"));
  assert.match(runtimeBody, /const runtimeOptions = runtimeOptionsSnapshot\(options\)/);
  assert.match(runtimeBody, /const logger = captureRuntimeLogger\(runtimeOptions\)/);
  assert.doesNotMatch(runtimeBody, /optionValue\(options, "logger"\)/);
});
