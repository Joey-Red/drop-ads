import test from "node:test";
import assert from "node:assert/strict";
import { installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

const silentLogger = { warn() {} };

test("M422 rejects accessor-backed optional disposer without executing the getter", () => {
  let gets = 0;
  const registration = {};
  Object.defineProperty(registration, "dispose", {
    enumerable: true,
    get() { gets += 1; return () => undefined; }
  });

  const status = installOptionalBackgroundFeatures([
    { name: "accessor", install: () => registration }
  ], { logger: silentLogger });

  assert.equal(status.accessor, "failed");
  assert.equal(gets, 0);
});

test("M422 accepts a custom-prototype registration when dispose is an own data function", () => {
  const registration = Object.create({ inherited: true });
  Object.defineProperty(registration, "dispose", {
    enumerable: true,
    value() {}
  });
  const status = installOptionalBackgroundFeatures([
    { name: "custom-prototype", install: () => registration }
  ], { logger: silentLogger });
  assert.equal(status["custom-prototype"], "installed");
});

test("M422 captures safe optional disposer once with original receiver", async () => {
  const calls = [];
  const registration = {
    marker: "original",
    dispose() { calls.push(this.marker); }
  };
  const registrations = new Map();
  const status = installOptionalBackgroundFeatures([
    { name: "safe", install: () => registration }
  ], { logger: silentLogger, registrations });

  assert.equal(status.safe, "installed");
  registration.dispose = function mutated() { calls.push("mutated"); };
  registration.marker = "original";
  await registrations.get("safe").dispose();
  assert.deepEqual(calls, ["original"]);
});
