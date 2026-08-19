import test from "node:test";
import assert from "node:assert/strict";
import { bootstrapBackground } from "../src/core/background-bootstrap.js";

const logger = { warn() {} };

test("background teardown uses captured disposers after later mutation", async () => {
  const calls = [];
  const core = { dispose() { calls.push("core-original"); } };
  const mandatory = { dispose() { calls.push("mandatory-original"); } };
  const registration = bootstrapBackground({
    logger,
    startCore: () => core,
    installMandatoryRecovery: () => mandatory,
    optionalFeatures: []
  });

  core.dispose = () => calls.push("core-mutated");
  mandatory.dispose = () => calls.push("mandatory-mutated");
  await registration.disposeBackground();
  await registration.disposeBackground();

  assert.deepEqual(calls, ["mandatory-original", "core-original"]);
});

test("prototype data-function disposers are captured without getter execution", async () => {
  const calls = [];
  class Layer { dispose() { calls.push("prototype"); } }
  const layer = new Layer();
  const registration = bootstrapBackground({
    logger,
    startCore: () => layer,
    installMandatoryRecovery: (core) => core,
    optionalFeatures: []
  });
  await registration.disposeBackground();
  assert.deepEqual(calls, ["prototype"]);
});

test("accessor disposers fail closed without invoking the accessor", () => {
  let getterCalls = 0;
  const core = {};
  Object.defineProperty(core, "dispose", {
    get() { getterCalls += 1; return () => {}; }
  });
  assert.throws(
    () => bootstrapBackground({
      logger,
      startCore: () => core,
      installMandatoryRecovery: () => ({}),
      optionalFeatures: []
    }),
    /dispose must be a data function/
  );
  assert.equal(getterCalls, 0);
});
