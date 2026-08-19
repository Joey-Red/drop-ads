import test from "node:test";
import assert from "node:assert/strict";

import {
  bootstrapBackground,
  installOptionalBackgroundFeatures
} from "../src/core/background-bootstrap.js";

test("M443 captures class-style teardown methods before later prototype mutation", async () => {
  const calls = [];

  class CoreRegistration {
    dispose() { calls.push("core-original"); }
  }
  class RecoveryRegistration {
    dispose() { calls.push("recovery-original"); }
  }
  class OptionalRegistration {
    dispose() { calls.push("optional-original"); }
  }

  const core = new CoreRegistration();
  const recovery = new RecoveryRegistration();
  const optional = new OptionalRegistration();
  const background = bootstrapBackground({
    startCore: () => core,
    installMandatoryRecovery: () => recovery,
    optionalFeatures: [{ name: "optional", install: () => optional }]
  });

  CoreRegistration.prototype.dispose = function changedCore() { calls.push("core-mutated"); };
  RecoveryRegistration.prototype.dispose = function changedRecovery() { calls.push("recovery-mutated"); };
  OptionalRegistration.prototype.dispose = function changedOptional() { calls.push("optional-mutated"); };

  await background.disposeBackground();
  assert.deepEqual(calls, ["optional-original", "recovery-original", "core-original"]);

  await background.disposeBackground();
  assert.deepEqual(calls, ["optional-original", "recovery-original", "core-original"]);
});

test("M443 rejects accessor teardown collaborators without executing them", () => {
  let getterReads = 0;
  const registration = {};
  Object.defineProperty(registration, "dispose", {
    enumerable: true,
    configurable: true,
    get() {
      getterReads += 1;
      return () => undefined;
    }
  });

  const status = installOptionalBackgroundFeatures([
    { name: "accessor", install: () => registration }
  ]);

  assert.equal(status.accessor, "failed");
  assert.equal(getterReads, 0);
});

test("M443 contains hostile prototype inspection for optional teardown", () => {
  const registration = new Proxy({}, {
    getOwnPropertyDescriptor() { throw new Error("descriptor trap"); }
  });

  const status = installOptionalBackgroundFeatures([
    { name: "trapped", install: () => registration }
  ]);

  assert.equal(status.trapped, "failed");
});
