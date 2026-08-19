import test from "node:test";
import assert from "node:assert/strict";

import { bootstrapBackground, installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

test("supporting hardening: class-style prototype disposers preserve teardown order", async () => {
  const calls = [];
  class Core { dispose() { calls.push("core"); } }
  class Mandatory { dispose() { calls.push("mandatory"); } }
  class Optional { constructor(name) { this.name = name; } dispose() { calls.push(this.name); } }
  const registration = bootstrapBackground({
    startCore: () => new Core(),
    installMandatoryRecovery: () => new Mandatory(),
    optionalFeatures: [
      { name: "first", install: () => new Optional("first") },
      { name: "second", install: () => new Optional("second") }
    ],
    logger: { warn() {} }
  });
  await registration.disposeBackground();
  assert.deepEqual(calls, ["second", "first", "mandatory", "core"]);
});

test("supporting hardening: accessor-backed optional dispose is rejected without invoking the getter", () => {
  let getterCalls = 0;
  const prototype = {};
  Object.defineProperty(prototype, "dispose", { get() { getterCalls += 1; return () => {}; } });
  const status = installOptionalBackgroundFeatures(
    [{ name: "unsafe-disposer", install: () => Object.create(prototype) }],
    { logger: { warn() {} } }
  );
  assert.equal(status["unsafe-disposer"], "failed");
  assert.equal(getterCalls, 0);
});

test("supporting hardening: optional teardown uses the originally captured data method", async () => {
  const calls = [];
  const registrations = new Map();
  const registration = { dispose() { calls.push("original"); } };
  const status = installOptionalBackgroundFeatures(
    [{ name: "captured", install: () => registration }],
    { logger: { warn() {} }, registrations }
  );
  registration.dispose = () => calls.push("mutated");
  assert.equal(status.captured, "installed");
  await registrations.get("captured").dispose();
  assert.deepEqual(calls, ["original"]);
});
