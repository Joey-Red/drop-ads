import test from "node:test";
import assert from "node:assert/strict";
import { installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

test("optional feature status treats prototype-like names as ordinary keys", () => {
  const status = installOptionalBackgroundFeatures([
    { name: "__proto__", install: () => null },
    { name: "constructor", install: () => null },
    { name: "toString", install: () => null }
  ]);

  assert.equal(Object.getPrototypeOf(status), null);
  assert.deepEqual(Object.keys(status), ["__proto__", "constructor", "toString"]);
  assert.equal(status["__proto__"], "installed");
  assert.equal(status.constructor, "installed");
  assert.equal(status.toString, "installed");
  assert.equal(Object.isFrozen(status), true);
});
