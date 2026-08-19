import test from "node:test";
import assert from "node:assert/strict";
import { installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

test("M425 optional feature status treats prototype-looking names as inert own keys", () => {
  const status = installOptionalBackgroundFeatures([
    { name: "__proto__", install() { return null; } },
    { name: "constructor", install() { return null; } },
    { name: "ordinary", install() { return null; } }
  ]);

  assert.equal(Object.getPrototypeOf(status), null);
  assert.equal(Object.isFrozen(status), true);
  assert.equal(Object.hasOwn(status, "__proto__"), true);
  assert.equal(Object.hasOwn(status, "constructor"), true);
  assert.equal(Object.hasOwn(status, "ordinary"), true);
  assert.equal(status.__proto__, "installed");
  assert.equal(status.constructor, "installed");
  assert.equal(status.ordinary, "installed");
});

test("M425 failed prototype-looking feature remains a data status without prototype mutation", () => {
  const status = installOptionalBackgroundFeatures([
    { name: "__proto__", install() { throw new Error("expected test failure"); } }
  ], { logger: { warn() {} } });

  assert.equal(Object.getPrototypeOf(status), null);
  assert.equal(status.__proto__, "failed");
});
