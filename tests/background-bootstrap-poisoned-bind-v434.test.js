import test from "node:test";
import assert from "node:assert/strict";

import { bootstrapBackground, installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

function poisonBind(fn) {
  Object.defineProperty(fn, "bind", {
    configurable: true,
    get() { throw new Error("callable.bind must not be read"); }
  });
  return fn;
}

test("M434 supplied warning callback is captured without reading callback.bind", () => {
  let warnings = 0;
  const logger = {};
  Object.defineProperty(logger, "warn", {
    enumerable: true,
    value: poisonBind(function warn() {
      assert.equal(this, logger);
      warnings += 1;
    })
  });
  const status = installOptionalBackgroundFeatures([
    { name: "broken", install() { throw new Error("feature failure"); } }
  ], { logger });
  assert.equal(status.broken, "failed");
  assert.equal(warnings, 1);
});

test("M434 layer and optional disposers are captured without reading callable.bind", async () => {
  const calls = [];
  const core = { dispose: poisonBind(function dispose() { assert.equal(this, core); calls.push("core"); }) };
  const mandatory = { dispose: poisonBind(function dispose() { assert.equal(this, mandatory); calls.push("mandatory"); }) };
  const optional = {
    name: "optional",
    install() {
      const registration = {};
      Object.defineProperty(registration, "dispose", {
        enumerable: true,
        value: poisonBind(function dispose() { assert.equal(this, registration); calls.push("optional"); })
      });
      return registration;
    }
  };

  const background = bootstrapBackground({
    startCore: () => core,
    installMandatoryRecovery: () => mandatory,
    optionalFeatures: [optional]
  });
  await background.disposeBackground();
  assert.deepEqual(calls, ["optional", "mandatory", "core"]);
});
