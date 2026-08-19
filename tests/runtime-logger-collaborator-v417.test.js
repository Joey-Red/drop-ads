import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createBackgroundRuntime } from "../src/core/runtime.js";

function incompleteApi() {
  return {};
}

test("M417 supplied runtime logger accessors are rejected without getter execution", () => {
  let getterCalls = 0;
  const logger = { error() {} };
  Object.defineProperty(logger, "warn", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return () => {};
    }
  });

  assert.throws(
    () => createBackgroundRuntime({ api: incompleteApi(), logger }),
    /own enumerable data warn\(\) and error\(\) functions/
  );
  assert.equal(getterCalls, 0);
});

test("M417 runtime logger admission does not use normal property gets", () => {
  let normalGets = 0;
  const target = {
    warn() {},
    error() {}
  };
  const logger = new Proxy(target, {
    get(inner, key, receiver) {
      normalGets += 1;
      return Reflect.get(inner, key, receiver);
    }
  });

  assert.throws(
    () => createBackgroundRuntime({ api: incompleteApi(), logger }),
    /WebExtension API is missing runtime/
  );
  assert.equal(normalGets, 0);
});

test("M417 custom-prototype logger objects fail before API capability inspection", () => {
  const logger = Object.create({ inherited: true });
  logger.warn = () => {};
  logger.error = () => {};

  assert.throws(
    () => createBackgroundRuntime({ api: incompleteApi(), logger }),
    /own enumerable data warn\(\) and error\(\) functions/
  );
});

test("M417 every captured runtime diagnostic callback is best-effort and receiver-bound", () => {
  const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");
  assert.match(source, /function bestEffortBoundLogger\(callback, receiver\)/);
  assert.match(source, /const bound = callback\.bind\(receiver\)/);
  assert.match(source, /try \{ return bound\(\.\.\.args\); \}\s*catch \{ return undefined; \}/s);
  assert.match(source, /warn: bestEffortBoundLogger\(warnField\.value, logger\)/);
  assert.match(source, /error: bestEffortBoundLogger\(errorField\.value, logger\)/);
  assert.doesNotMatch(source, /const logger = optionValue\(options, "logger"\);\s*if \(!logger \|\| typeof logger\.warn/s);
});
