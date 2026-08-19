import test from "node:test";
import assert from "node:assert/strict";
import { installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

test("M441 registration storage does not read a poisoned Map instance set property", () => {
  const registrations = new Map();
  Object.defineProperty(registrations, "set", {
    configurable: true,
    get() {
      throw new Error("instance set property must not be read");
    }
  });

  const status = installOptionalBackgroundFeatures([
    { name: "feature", install: () => ({ dispose() {} }) }
  ], { registrations });

  assert.equal(status.feature, "installed");
  assert.equal(typeof Reflect.apply(Map.prototype.get, registrations, ["feature"])?.dispose, "function");
});
