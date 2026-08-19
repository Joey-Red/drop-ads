import test from "node:test";
import assert from "node:assert/strict";
import { bootstrapBackground, installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

function poisonBind(fn) {
  Object.defineProperty(fn, "bind", { configurable: true, get() { throw new Error("callable bind property must not be read"); } });
  return fn;
}

test("M438 optional logger and disposer capture never reads callable.bind", async () => {
  let warnings = 0;
  let disposed = 0;
  const warn = poisonBind(function warn() { warnings += 1; });
  const dispose = poisonBind(function dispose() { disposed += 1; });
  const registrations = new Map();
  const status = installOptionalBackgroundFeatures([
    { name: "safe", install: () => ({ dispose }) },
    { name: "fails", install: () => { throw new Error("expected"); } }
  ], { logger: { warn }, registrations });
  assert.equal(status.safe, "installed");
  assert.equal(status.fails, "failed");
  assert.equal(warnings, 1);
  await registrations.get("safe").dispose();
  assert.equal(disposed, 1);
});

test("M438 core and mandatory disposers retain receivers without reading callable.bind", async () => {
  const calls = [];
  const core = { value: "core", dispose: poisonBind(function dispose() { calls.push(this.value); }) };
  const mandatory = { value: "mandatory", dispose: poisonBind(function dispose() { calls.push(this.value); }) };
  const registration = bootstrapBackground({
    startCore: () => core,
    installMandatoryRecovery: () => mandatory,
    optionalFeatures: [],
    logger: { warn() {} }
  });
  await registration.disposeBackground();
  assert.deepEqual(calls, ["mandatory", "core"]);
});
