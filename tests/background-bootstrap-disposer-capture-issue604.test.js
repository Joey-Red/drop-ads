import test from "node:test";
import assert from "node:assert/strict";

import { installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

test("optional feature disposer is captured once and later mutation cannot redirect teardown", async () => {
  const registrations = new Map();
  let originalCalls = 0;
  let replacementCalls = 0;
  const registration = {
    dispose() {
      originalCalls += 1;
    }
  };

  const status = installOptionalBackgroundFeatures([
    { name: "captured-disposer", install: () => registration }
  ], { registrations });

  assert.equal(status["captured-disposer"], "installed");
  registration.dispose = () => { replacementCalls += 1; };

  const stored = registrations.get("captured-disposer");
  assert.ok(stored);
  await stored.dispose();
  assert.equal(originalCalls, 1);
  assert.equal(replacementCalls, 0);
});

test("accessor-backed optional disposer fails the optional feature without executing the getter", () => {
  let getterCalls = 0;
  const registration = {};
  Object.defineProperty(registration, "dispose", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return () => {};
    }
  });

  const status = installOptionalBackgroundFeatures([
    { name: "unsafe-disposer", install: () => registration }
  ], { logger: { warn() {} } });

  assert.equal(status["unsafe-disposer"], "failed");
  assert.equal(getterCalls, 0);
});

test("prototype data-method disposers remain supported and receiver-bound", async () => {
  class Registration {
    constructor() {
      this.calls = 0;
    }
    dispose() {
      this.calls += 1;
    }
  }

  const registration = new Registration();
  const registrations = new Map();
  const status = installOptionalBackgroundFeatures([
    { name: "class-disposer", install: () => registration }
  ], { registrations });

  assert.equal(status["class-disposer"], "installed");
  await registrations.get("class-disposer").dispose();
  assert.equal(registration.calls, 1);
});
