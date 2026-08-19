import test from "node:test";
import assert from "node:assert/strict";
import { installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

function feature(install) {
  return [{ name: "feature", install }];
}

test("optional feature disposer is captured once with its original registration receiver", async () => {
  const registrations = new Map();
  const calls = [];
  const registration = {
    value: 7,
    dispose() { calls.push(this.value); }
  };
  const status = installOptionalBackgroundFeatures(feature(() => registration), {
    logger: { warn() {} },
    registrations
  });
  assert.equal(status.feature, "installed");
  registration.dispose = () => calls.push(99);
  registration.value = 8;
  await registrations.get("feature").dispose();
  assert.deepEqual(calls, [8]);
});

test("optional feature disposer rejects accessors without getter execution and tolerates custom prototypes", () => {
  let getterCalls = 0;
  const accessor = {};
  Object.defineProperty(accessor, "dispose", {
    enumerable: true,
    get() { getterCalls += 1; return () => {}; }
  });
  const custom = Object.create({ inherited: true });
  custom.dispose = () => {};
  const warnings = [];

  const accessorStatus = installOptionalBackgroundFeatures(feature(() => accessor), {
    logger: { warn(...args) { warnings.push(args); } }
  });
  const customStatus = installOptionalBackgroundFeatures(feature(() => custom), {
    logger: { warn(...args) { warnings.push(args); } }
  });

  assert.equal(accessorStatus.feature, "failed");
  assert.equal(customStatus.feature, "installed");
  assert.equal(getterCalls, 0);
  assert.equal(warnings.length, 1);
});

test("null-prototype optional registrations with own data disposer remain supported", async () => {
  const registrations = new Map();
  let calls = 0;
  const registration = Object.create(null);
  registration.dispose = function () { calls += 1; };
  const status = installOptionalBackgroundFeatures(feature(() => registration), {
    logger: { warn() {} },
    registrations
  });
  assert.equal(status.feature, "installed");
  await registrations.get("feature").dispose();
  assert.equal(calls, 1);
});
