import test from "node:test";
import assert from "node:assert/strict";
import { bootstrapBackground, installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

class DisposableRegistration {
  constructor(calls, label) { this.calls = calls; this.label = label; }
  dispose() { this.calls.push(this.label); }
}

test("M443 class-style prototype disposers are captured and survive later mutation", async () => {
  const calls = [];
  const core = new DisposableRegistration(calls, "core");
  const mandatory = new DisposableRegistration(calls, "mandatory");
  const registration = bootstrapBackground({
    startCore: () => core,
    installMandatoryRecovery: () => mandatory,
    optionalFeatures: []
  });
  DisposableRegistration.prototype.dispose = function mutated() { throw new Error("late mutation"); };
  await registration.disposeBackground();
  assert.deepEqual(calls, ["mandatory", "core"]);
});

test("M443 accessor-shaped optional disposer is rejected without getter execution", () => {
  let getterRuns = 0;
  const registration = {};
  Object.defineProperty(registration, "dispose", {
    get() { getterRuns += 1; return () => {}; }
  });
  const status = installOptionalBackgroundFeatures([
    { name: "bad", install: () => registration }
  ], { logger: { warn() {} } });
  assert.equal(status.bad, "failed");
  assert.equal(getterRuns, 0);
});
