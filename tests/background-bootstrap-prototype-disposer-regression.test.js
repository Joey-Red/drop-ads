import test from "node:test";
import assert from "node:assert/strict";
import { bootstrapBackground, installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

test("class-style prototype disposers are captured and preserve teardown order", async () => {
  const calls = [];
  class Core { dispose() { calls.push("core"); } }
  class Mandatory { dispose() { calls.push("mandatory"); } }
  class Optional { dispose() { calls.push("optional"); } }

  const registration = bootstrapBackground({
    startCore: () => new Core(),
    installMandatoryRecovery: () => new Mandatory(),
    optionalFeatures: [{ name: "class-feature", install: () => new Optional() }],
    logger: { warn() {} }
  });
  await registration.disposeBackground();
  assert.deepEqual(calls, ["optional", "mandatory", "core"]);
});

test("accessor-backed optional dispose is rejected without invoking the getter", () => {
  let getterCalls = 0;
  const prototype = {};
  Object.defineProperty(prototype, "dispose", {
    get() { getterCalls += 1; return () => {}; }
  });
  const registration = Object.create(prototype);
  const status = installOptionalBackgroundFeatures(
    [{ name: "unsafe-disposer", install: () => registration }],
    { logger: { warn() {} } }
  );
  assert.equal(status["unsafe-disposer"], "failed");
  assert.equal(getterCalls, 0);
});
