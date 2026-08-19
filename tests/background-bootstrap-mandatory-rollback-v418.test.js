import test from "node:test";
import assert from "node:assert/strict";
import { bootstrapBackground } from "../src/core/background-bootstrap.js";

test("M418 mandatory installation failure rolls back an already-started core", () => {
  const calls = [];
  const core = { dispose() { assert.equal(this, core); calls.push("core-dispose"); } };
  const mandatoryFailure = new Error("mandatory install failed");
  assert.throws(() => bootstrapBackground({
    startCore() { calls.push("core-start"); return core; },
    installMandatoryRecovery(receivedCore) {
      assert.equal(receivedCore, core);
      calls.push("mandatory-start");
      throw mandatoryFailure;
    },
    logger: { warn() {} }
  }), (error) => error === mandatoryFailure);
  assert.deepEqual(calls, ["core-start", "mandatory-start", "core-dispose"]);
});

test("M418 failed-startup core disposer failure never replaces the mandatory failure", async () => {
  const warnings = [];
  const mandatoryFailure = new Error("mandatory install failed");
  const core = { dispose() { return Promise.reject(new Error("core rollback failed")); } };
  assert.throws(() => bootstrapBackground({
    startCore: () => core,
    installMandatoryRecovery() { throw mandatoryFailure; },
    logger: { warn(...args) { warnings.push(args); } }
  }), (error) => error === mandatoryFailure);
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(warnings.length, 1);
  assert.match(warnings[0][0], /failed-startup rollback/);
});

test("M418 unsafe mandatory disposer admission also rolls back core", () => {
  let disposed = 0;
  let getterCalls = 0;
  const mandatory = {};
  Object.defineProperty(mandatory, "dispose", {
    enumerable: true,
    get() { getterCalls += 1; return () => {}; }
  });
  assert.throws(() => bootstrapBackground({
    startCore: () => ({ dispose() { disposed += 1; } }),
    installMandatoryRecovery: () => mandatory,
    logger: { warn() {} }
  }), /Mandatory recovery/);
  assert.equal(getterCalls, 0);
  assert.equal(disposed, 1);
});
