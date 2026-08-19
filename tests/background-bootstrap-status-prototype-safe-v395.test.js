import test from "node:test";
import assert from "node:assert/strict";
import { installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

test("M395 optional feature status keeps prototype-like names as inert own keys", () => {
  const status = installOptionalBackgroundFeatures([
    { name: "__proto__", install() { return null; } },
    { name: "constructor", install() { return null; } },
    { name: "toString", install() { throw new Error("expected optional failure"); } }
  ], { logger: { warn() {} } });

  assert.equal(Object.getPrototypeOf(status), null);
  assert.equal(Object.hasOwn(status, "__proto__"), true);
  assert.equal(Object.hasOwn(status, "constructor"), true);
  assert.equal(Object.hasOwn(status, "toString"), true);
  assert.equal(status.__proto__, "installed");
  assert.equal(status.constructor, "installed");
  assert.equal(status.toString, "failed");
  assert.equal(Object.isFrozen(status), true);
});
