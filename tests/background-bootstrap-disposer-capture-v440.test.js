import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

const source = fs.readFileSync(new URL("../src/core/background-bootstrap.js", import.meta.url), "utf8");

test("optional feature disposer is captured once before later registration mutation", async () => {
  const registrations = new Map();
  let originalCalls = 0;
  let replacementCalls = 0;
  const registration = {
    dispose() { originalCalls += 1; }
  };

  const status = installOptionalBackgroundFeatures([
    { name: "captured-disposer", install() { return registration; } }
  ], { registrations, logger: { warn() {} } });

  assert.equal(status["captured-disposer"], "installed");
  registration.dispose = () => { replacementCalls += 1; };
  await registrations.get("captured-disposer").dispose();
  assert.equal(originalCalls, 1);
  assert.equal(replacementCalls, 0);
});

test("accessor disposer is rejected without getter execution inside optional failure isolation", () => {
  let getterRuns = 0;
  const registration = {};
  Object.defineProperty(registration, "dispose", {
    get() { getterRuns += 1; return () => {}; }
  });
  const warnings = [];
  const status = installOptionalBackgroundFeatures([
    { name: "unsafe-disposer", install() { return registration; } }
  ], { registrations: new Map(), logger: { warn(...args) { warnings.push(args); } } });

  assert.equal(status["unsafe-disposer"], "failed");
  assert.equal(getterRuns, 0);
  assert.equal(warnings.length, 1);
});

test("teardown capture uses bounded prototype inspection and stores detached disposer only", () => {
  assert.match(source, /const MAX_TEARDOWN_PROTOTYPE_DEPTH = 8;/);
  assert.match(source, /function captureBoundDisposer\(registration, label\)/);
  assert.match(source, /storeRegistration\(registrations, feature\.name, disposable\)/);
  assert.doesNotMatch(source, /storeRegistration\(registrations, feature\.name, registration\)/);
});
