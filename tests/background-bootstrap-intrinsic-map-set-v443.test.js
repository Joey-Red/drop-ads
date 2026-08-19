import test from "node:test";
import assert from "node:assert/strict";

import { installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

test("M443 optional registration storage never reads a poisoned Map.set property", () => {
  const registrations = new Map();
  Object.defineProperty(registrations, "set", {
    configurable: true,
    get() {
      throw new Error("poisoned Map.set getter must not run");
    }
  });

  let disposed = false;
  const status = installOptionalBackgroundFeatures([
    {
      name: "alpha",
      install() {
        return {
          dispose() {
            disposed = true;
          }
        };
      }
    }
  ], {
    registrations,
    logger: { warn() {} }
  });

  assert.equal(status.alpha, "installed");
  const stored = Reflect.apply(Map.prototype.get, registrations, ["alpha"]);
  assert.ok(stored);
  assert.equal(typeof stored.dispose, "function");
  stored.dispose();
  assert.equal(disposed, true);
});
