import test from "node:test";
import assert from "node:assert/strict";
import { installPolicyConvergence } from "../src/core/policy-convergence.js";
import { createMockWebExtension } from "./helpers/mock-webextension.js";

test("policy convergence reads validated options without normal get access", () => {
  const mock = createMockWebExtension();
  let gets = 0;
  const controller = { syncRules: async () => {} };
  const options = new Proxy({ api: mock.api, controller }, {
    get(target, key, receiver) {
      gets += 1;
      return Reflect.get(target, key, receiver);
    }
  });
  const registration = installPolicyConvergence(options);
  assert.equal(gets, 0);
  registration.dispose();
});

test("policy convergence rejects controller and logger accessors without invoking them", () => {
  const mock = createMockWebExtension();
  let reads = 0;
  const controller = {};
  Object.defineProperty(controller, "syncRules", { enumerable: true, get() { reads += 1; return async () => {}; } });
  assert.throws(() => installPolicyConvergence({ api: mock.api, controller }), /controller/i);
  assert.equal(reads, 0);

  const logger = {};
  Object.defineProperty(logger, "error", { enumerable: true, get() { reads += 1; return () => {}; } });
  assert.throws(() => installPolicyConvergence({ api: mock.api, controller: { syncRules: async () => {} }, logger }), /logger/i);
  assert.equal(reads, 0);
});

test("policy convergence uses a captured plain syncRules function", async () => {
  const mock = createMockWebExtension();
  let calls = 0;
  const registration = installPolicyConvergence({
    api: mock.api,
    controller: { syncRules: async () => { calls += 1; } },
    logger: { error() {} }
  });
  await registration.queueConvergence("test");
  assert.equal(calls, 1);
  registration.dispose();
});
