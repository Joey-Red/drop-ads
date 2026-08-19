import assert from "node:assert/strict";
import test from "node:test";

import { bootstrapBackground, installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

function dataObject(entries) {
  const value = Object.create(null);
  for (const [key, field] of Object.entries(entries)) {
    Object.defineProperty(value, key, { value: field, enumerable: true, writable: true, configurable: true });
  }
  return value;
}

test("bootstrap reads options without normal property gets", () => {
  let gets = 0;
  const target = dataObject({
    startCore: () => ({ dispose() {} }),
    installMandatoryRecovery: () => ({ dispose() {} }),
    optionalFeatures: [],
    logger: dataObject({ warn() {} })
  });
  const options = new Proxy(target, {
    get(object, key, receiver) {
      gets += 1;
      return Reflect.get(object, key, receiver);
    }
  });
  const registration = bootstrapBackground(options);
  assert.equal(gets, 0);
  return registration.disposeBackground();
});

test("optional feature descriptors do not execute getters", () => {
  let getterCalls = 0;
  const feature = {};
  Object.defineProperty(feature, "name", { enumerable: true, get() { getterCalls += 1; return "unsafe"; } });
  Object.defineProperty(feature, "install", { enumerable: true, value() {} });
  assert.throws(() => installOptionalBackgroundFeatures([feature], { logger: dataObject({ warn() {} }) }));
  assert.equal(getterCalls, 0);
});

test("supplied logger warn is captured as a plain data function", () => {
  let getterCalls = 0;
  const logger = {};
  Object.defineProperty(logger, "warn", { enumerable: true, get() { getterCalls += 1; return () => {}; } });
  assert.throws(() => installOptionalBackgroundFeatures([], { logger }));
  assert.equal(getterCalls, 0);
});
