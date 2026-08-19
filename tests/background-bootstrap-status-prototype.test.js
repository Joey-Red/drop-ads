import test from "node:test";
import assert from "node:assert/strict";

import { installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

function feature(name) {
  return { name, install() { return null; } };
}

test("optional feature status treats prototype-looking names as inert own keys", () => {
  const status = installOptionalBackgroundFeatures([
    feature("__proto__"),
    feature("constructor"),
    feature("ordinary")
  ]);

  assert.equal(Object.getPrototypeOf(status), null);
  assert.equal(status.__proto__, "installed");
  assert.equal(status.constructor, "installed");
  assert.equal(status.ordinary, "installed");
  assert.deepEqual(Object.keys(status).sort(), ["__proto__", "constructor", "ordinary"].sort());
  assert.equal(Object.isFrozen(status), true);
});
