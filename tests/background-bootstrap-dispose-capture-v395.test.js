import test from "node:test";
import assert from "node:assert/strict";

import { bootstrapBackground, installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

test("M395 optional teardown capture never invokes accessor-backed dispose", () => {
  let getterCalls = 0;
  const warnings = [];
  const registration = {};
  Object.defineProperty(registration, "dispose", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return () => {};
    }
  });

  const status = installOptionalBackgroundFeatures([
    { name: "unsafe", install: () => registration }
  ], {
    logger: { warn: (...args) => warnings.push(args) }
  });

  assert.equal(getterCalls, 0);
  assert.equal(status.unsafe, "failed");
  assert.equal(warnings.length, 1);
});

test("M395 prototype data-method disposers are captured once and survive later mutation", async () => {
  const calls = [];
  class Registration {
    dispose() { calls.push("prototype-original"); }
  }
  const registration = new Registration();

  const background = bootstrapBackground({
    startCore: () => ({ dispose() { calls.push("core"); } }),
    installMandatoryRecovery: () => ({ dispose() { calls.push("mandatory"); } }),
    optionalFeatures: [
      { name: "class-registration", install: () => registration }
    ],
    logger: { warn() {} }
  });

  registration.dispose = () => calls.push("mutated");
  await background.disposeBackground();
  await background.disposeBackground();

  assert.deepEqual(calls, ["prototype-original", "mandatory", "core"]);
});

test("M395 shared core/mandatory registration is disposed only once", async () => {
  let disposals = 0;
  const shared = { dispose() { disposals += 1; } };
  const background = bootstrapBackground({
    startCore: () => shared,
    installMandatoryRecovery: () => shared,
    optionalFeatures: [],
    logger: { warn() {} }
  });

  await background.disposeBackground();
  assert.equal(disposals, 1);
});
