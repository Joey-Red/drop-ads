import test from "node:test";
import assert from "node:assert/strict";
import { bootstrapBackground, installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

test("M438 optional disposer accessors are rejected without getter execution and remain isolated", () => {
  let getterCalls = 0;
  const registration = {};
  Object.defineProperty(registration, "dispose", {
    get() { getterCalls += 1; return () => {}; }
  });
  const statuses = installOptionalBackgroundFeatures([
    { name: "bad", install() { return registration; } }
  ], { logger: { warn() {} } });
  assert.equal(statuses.bad, "failed");
  assert.equal(getterCalls, 0);
});

test("M438 core and mandatory prototype disposers are captured before later mutation", async () => {
  const calls = [];
  class Registration {
    constructor(name) { this.name = name; }
    dispose() { calls.push(this.name); }
  }
  const core = new Registration("core");
  const mandatory = new Registration("mandatory");
  const background = bootstrapBackground({
    startCore() { return core; },
    installMandatoryRecovery() { return mandatory; },
    logger: { warn() {} }
  });
  Registration.prototype.dispose = function replacement() { calls.push("late"); };
  await background.disposeBackground();
  assert.deepEqual(calls, ["mandatory", "core"]);
});
