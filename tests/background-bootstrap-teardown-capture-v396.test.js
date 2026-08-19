import test from "node:test";
import assert from "node:assert/strict";
import { bootstrapBackground, installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

test("optional feature disposer is captured once and not reread during teardown", async () => {
  let disposeCalls = 0;
  let disposeReads = 0;
  const registration = {};
  Object.defineProperty(registration, "dispose", {
    enumerable: true,
    configurable: true,
    value() { disposeCalls += 1; }
  });

  const entries = new Map();
  const status = installOptionalBackgroundFeatures([
    { name: "captured", install: () => registration }
  ], { registrations: entries, logger: { warn() {} } });

  assert.equal(status.captured, "installed");
  const captured = entries.get("captured");
  assert.equal(typeof captured.dispose, "function");

  Object.defineProperty(registration, "dispose", {
    configurable: true,
    get() { disposeReads += 1; throw new Error("late getter must not run"); }
  });

  await captured.dispose();
  assert.equal(disposeCalls, 1);
  assert.equal(disposeReads, 0);
});

test("malformed mandatory disposer fails startup and rolls back captured core disposer", () => {
  let coreDisposed = 0;
  let optionalStarted = 0;
  const mandatory = {};
  Object.defineProperty(mandatory, "dispose", {
    configurable: true,
    get() { throw new Error("must not execute"); }
  });

  assert.throws(() => bootstrapBackground({
    startCore: () => ({ dispose() { coreDisposed += 1; } }),
    installMandatoryRecovery: () => mandatory,
    optionalFeatures: [{ name: "optional", install() { optionalStarted += 1; } }],
    logger: { warn() {} }
  }), /dispose must be a data function/);

  assert.equal(coreDisposed, 1);
  assert.equal(optionalStarted, 0);
});
