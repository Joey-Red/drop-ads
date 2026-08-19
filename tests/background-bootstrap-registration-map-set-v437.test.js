import test from "node:test";
import assert from "node:assert/strict";
import { installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

test("M441 stores registrations without reading a poisoned Map.set property", () => {
  const registrations = new Map();
  Object.defineProperty(registrations, "set", {
    configurable: true,
    get() {
      throw new Error("Map.set property must not be read");
    }
  });

  const status = installOptionalBackgroundFeatures([
    { name: "feature", install: () => ({ dispose() {} }) }
  ], { registrations });

  assert.equal(status.feature, "installed");
  const stored = Reflect.apply(Map.prototype.get, registrations, ["feature"]);
  assert.equal(typeof stored?.dispose, "function");
});
