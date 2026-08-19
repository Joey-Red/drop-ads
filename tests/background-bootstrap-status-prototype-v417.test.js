import test from "node:test";
import assert from "node:assert/strict";
import { installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

test("M417 optional feature status is a frozen null-prototype record", () => {
  const status = installOptionalBackgroundFeatures([
    { name: "ordinary", install() {} },
    { name: "__proto__", install() {} },
    { name: "constructor", install() { throw new Error("expected install failure"); } }
  ], { logger: { warn() {} } });

  assert.equal(Object.getPrototypeOf(status), null);
  assert.equal(Object.isFrozen(status), true);
  assert.deepEqual(Object.keys(status), ["ordinary", "__proto__", "constructor"]);
  assert.equal(status.ordinary, "installed");
  assert.equal(status.__proto__, "installed");
  assert.equal(status.constructor, "failed");
  assert.equal(Object.hasOwn(status, "__proto__"), true);
  assert.equal(Object.hasOwn(status, "constructor"), true);
});

test("M417 prototype-like names do not mutate global or local prototypes", () => {
  const before = Object.prototype.__dropAdsOptionalFeatureStatus;
  const status = installOptionalBackgroundFeatures([
    { name: "__proto__", install() {} }
  ]);

  assert.equal(Object.getPrototypeOf(status), null);
  assert.equal(status.__proto__, "installed");
  assert.equal(Object.prototype.__dropAdsOptionalFeatureStatus, before);
});
