import test from "node:test";
import assert from "node:assert/strict";
import { installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

test("M440 optional status supports Object-prototype-looking feature names", () => {
  const status = installOptionalBackgroundFeatures([
    { name: "__proto__", install: () => null },
    { name: "constructor", install: () => null },
    { name: "toString", install: () => null }
  ]);

  assert.equal(Object.getPrototypeOf(status), null);
  assert.equal(Object.hasOwn(status, "__proto__"), true);
  assert.equal(Object.hasOwn(status, "constructor"), true);
  assert.equal(Object.hasOwn(status, "toString"), true);
  assert.equal(status.__proto__, "installed");
  assert.equal(status.constructor, "installed");
  assert.equal(status.toString, "installed");
  assert.equal(Object.isFrozen(status), true);
});

test("M440 real Map registration uses intrinsic storage and captured disposer", async () => {
  const registrations = new Map();
  registrations.set = () => { throw new Error("shadowed set must not run"); };
  let disposed = 0;
  const registration = {
    dispose() { disposed += 1; }
  };

  const status = installOptionalBackgroundFeatures([
    { name: "feature", install: () => registration }
  ], { registrations });

  assert.equal(status.feature, "installed");
  const captured = Map.prototype.get.call(registrations, "feature");
  assert.equal(typeof captured.dispose, "function");
  registration.dispose = () => { throw new Error("later mutation must not run"); };
  await captured.dispose();
  assert.equal(disposed, 1);
});

test("M440 raw optional feature names are bounded before trim", () => {
  assert.throws(
    () => installOptionalBackgroundFeatures([{ name: " ".repeat(65), install: () => null }]),
    /exceeds 64 characters/
  );
});
