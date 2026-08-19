import test from "node:test";
import assert from "node:assert/strict";
import { installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

function descriptor(name) {
  return { name, install() { return null; } };
}

test("optional feature status preserves Object-prototype-looking feature names as own data", () => {
  const status = installOptionalBackgroundFeatures([
    descriptor("__proto__"),
    descriptor("constructor"),
    descriptor("toString")
  ], { logger: { warn() {} } });

  assert.equal(Object.getPrototypeOf(status), null);
  assert.equal(status.__proto__, "installed");
  assert.equal(status.constructor, "installed");
  assert.equal(status.toString, "installed");
  assert.deepEqual(Object.keys(status), ["__proto__", "constructor", "toString"]);
  assert.equal(Object.isFrozen(status), true);
});
