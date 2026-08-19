import test from "node:test";
import assert from "node:assert/strict";
import { installPolicyConvergence } from "../src/core/policy-convergence.js";
import { createMockWebExtension } from "./helpers/mock-webextension.js";

function quietLogger() {
  return { log() {}, warn() {}, error() {} };
}

test("policy convergence installation is idempotent per API object", async () => {
  const mock = createMockWebExtension();
  let syncCalls = 0;
  const controller = { async syncRules() { syncCalls += 1; } };
  const first = installPolicyConvergence({ api: mock.api, controller, logger: quietLogger() });
  const second = installPolicyConvergence({ api: mock.api, controller, logger: quietLogger() });
  assert.equal(second, first);

  mock.events.runtimeMessage.emit({ type: "drop-ads:set-enabled" }, {}, () => {});
  await first.whenIdle();
  assert.equal(syncCalls, 1, "duplicate install must not duplicate recovery work");
});

test("dispose silences callbacks and allows a clean reinstall", async () => {
  const mock = createMockWebExtension();
  let firstCalls = 0;
  const first = installPolicyConvergence({
    api: mock.api,
    controller: { async syncRules() { firstCalls += 1; } },
    logger: quietLogger()
  });
  first.dispose();
  first.dispose();

  mock.events.runtimeMessage.emit({ type: "drop-ads:set-enabled" }, {}, () => {});
  await first.whenIdle();
  assert.equal(firstCalls, 0);

  let secondCalls = 0;
  const second = installPolicyConvergence({
    api: mock.api,
    controller: { async syncRules() { secondCalls += 1; } },
    logger: quietLogger()
  });
  assert.notEqual(second, first);
  mock.events.runtimeMessage.emit({ type: "drop-ads:set-cookie-mode" }, {}, () => {});
  await second.whenIdle();
  assert.equal(secondCalls, 1);
});
