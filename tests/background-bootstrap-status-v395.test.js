import test from "node:test";
import assert from "node:assert/strict";
import { installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

function feature(name, install = () => null) {
  return { name, install };
}

test("optional feature status preserves Object-prototype-like names", () => {
  const status = installOptionalBackgroundFeatures([
    feature("__proto__"),
    feature("constructor"),
    feature("toString")
  ]);

  assert.equal(Object.getPrototypeOf(status), null);
  assert.equal(status.__proto__, "installed");
  assert.equal(status.constructor, "installed");
  assert.equal(status.toString, "installed");
  assert.deepEqual(Object.keys(status), ["__proto__", "constructor", "toString"]);
  assert.equal(Object.isFrozen(status), true);
});

test("failed prototype-like feature names remain faithful status keys", () => {
  const status = installOptionalBackgroundFeatures([
    feature("__proto__", () => { throw new Error("expected failure"); })
  ], { logger: { warn() {} } });

  assert.equal(Object.getPrototypeOf(status), null);
  assert.equal(status.__proto__, "failed");
  assert.deepEqual(Object.keys(status), ["__proto__"]);
});
