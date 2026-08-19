import test from "node:test";
import assert from "node:assert/strict";
import { installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

test("optional feature status treats prototype-sensitive names as inert own keys", () => {
  const status = installOptionalBackgroundFeatures([
    { name: "__proto__", install() { return null; } },
    { name: "constructor", install() { throw new Error("expected"); } }
  ], { logger: { warn() {} } });

  assert.equal(Object.getPrototypeOf(status), null);
  assert.equal(Object.getOwnPropertyDescriptor(status, "__proto__")?.value, "installed");
  assert.equal(Object.getOwnPropertyDescriptor(status, "constructor")?.value, "failed");
  assert.equal(Object.isFrozen(status), true);
});
