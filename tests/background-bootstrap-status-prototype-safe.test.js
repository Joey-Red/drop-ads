import test from "node:test";
import assert from "node:assert/strict";

import { installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

const quietLogger = { warn() {} };

test("optional feature status treats prototype-sensitive names as inert own data", () => {
  const status = installOptionalBackgroundFeatures([
    { name: "__proto__", install() { return null; } },
    { name: "constructor", install() { throw new Error("expected"); } }
  ], { logger: quietLogger });

  assert.equal(Object.getPrototypeOf(status), null);
  assert.equal(Object.isFrozen(status), true);
  assert.equal(Object.hasOwn(status, "__proto__"), true);
  assert.equal(Object.hasOwn(status, "constructor"), true);
  assert.equal(status.__proto__, "installed");
  assert.equal(status.constructor, "failed");
});
