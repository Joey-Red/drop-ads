import test from "node:test";
import assert from "node:assert/strict";

import { installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

test("optional feature status treats Object prototype names as inert own keys", () => {
  const status = installOptionalBackgroundFeatures([
    { name: "__proto__", install: () => null },
    { name: "constructor", install: () => null },
    { name: "toString", install: () => null }
  ]);

  assert.equal(Object.getPrototypeOf(status), null);
  assert.equal(Object.isFrozen(status), true);
  assert.deepEqual(Object.keys(status), ["__proto__", "constructor", "toString"]);
  assert.equal(Object.hasOwn(status, "__proto__"), true);
  assert.equal(Object.hasOwn(status, "constructor"), true);
  assert.equal(Object.hasOwn(status, "toString"), true);
  assert.equal(status.__proto__, "installed");
  assert.equal(status.constructor, "installed");
  assert.equal(status.toString, "installed");
});

test("prototype-sensitive failed feature names remain ordinary status entries", () => {
  const status = installOptionalBackgroundFeatures([
    { name: "__proto__", install: () => { throw new Error("expected"); } }
  ], { logger: { warn() {} } });

  assert.equal(Object.getPrototypeOf(status), null);
  assert.equal(status.__proto__, "failed");
  assert.equal(Object.hasOwn(status, "__proto__"), true);
});
