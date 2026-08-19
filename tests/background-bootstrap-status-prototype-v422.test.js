import test from "node:test";
import assert from "node:assert/strict";
import { installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

test("M422 optional feature status safely represents prototype-looking names", () => {
  const status = installOptionalBackgroundFeatures([
    { name: "__proto__", install() {} },
    { name: "constructor", install() {} },
    { name: "normal", install() {} }
  ]);

  assert.equal(Object.getPrototypeOf(status), null);
  assert.equal(status.__proto__, "installed");
  assert.equal(status.constructor, "installed");
  assert.equal(status.normal, "installed");
  assert.deepEqual(Object.keys(status), ["__proto__", "constructor", "normal"]);
  assert.equal(Object.isFrozen(status), true);
});
