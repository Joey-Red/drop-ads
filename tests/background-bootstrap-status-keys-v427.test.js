import test from "node:test";
import assert from "node:assert/strict";
import { installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

test("optional feature status record preserves prototype-looking names as inert own keys", () => {
  const status = installOptionalBackgroundFeatures([
    { name: "__proto__", install: () => null },
    { name: "constructor", install: () => null },
    { name: "toString", install: () => null },
    { name: "normal", install: () => null }
  ]);

  assert.equal(Object.getPrototypeOf(status), null);
  assert.equal(Object.isFrozen(status), true);
  assert.equal(status.__proto__, "installed");
  assert.equal(status.constructor, "installed");
  assert.equal(status.toString, "installed");
  assert.equal(status.normal, "installed");
  assert.deepEqual(Object.keys(status), ["__proto__", "constructor", "toString", "normal"]);
});
