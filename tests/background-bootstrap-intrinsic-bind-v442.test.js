import test from "node:test";
import assert from "node:assert/strict";

import { bootstrapBackground } from "../src/core/background-bootstrap.js";

function poisonBind(callback, counter) {
  Object.defineProperty(callback, "bind", {
    configurable: true,
    get() {
      counter.reads += 1;
      throw new Error("callable bind property must not be read");
    }
  });
  return callback;
}

test("M442 bootstrap logger capture never reads a supplied callable bind property", async () => {
  const counter = { reads: 0 };
  const logger = {
    warn: poisonBind(function warn() {
      assert.equal(this, logger);
    }, counter)
  };
  const core = { dispose() {} };
  const mandatory = { dispose() {} };
  const background = bootstrapBackground({
    logger,
    startCore: () => core,
    installMandatoryRecovery: () => mandatory,
    optionalFeatures: []
  });
  await background.disposeBackground();
  assert.equal(counter.reads, 0);
});

test("M442 captured layer disposers use intrinsic bind without reading callable bind", async () => {
  const counter = { reads: 0 };
  const calls = [];
  const core = {
    dispose: poisonBind(function disposeCore() {
      assert.equal(this, core);
      calls.push("core");
    }, counter)
  };
  const mandatory = {
    dispose: poisonBind(function disposeMandatory() {
      assert.equal(this, mandatory);
      calls.push("mandatory");
    }, counter)
  };
  const background = bootstrapBackground({
    startCore: () => core,
    installMandatoryRecovery: () => mandatory,
    optionalFeatures: []
  });

  await background.disposeBackground();
  assert.deepEqual(calls, ["mandatory", "core"]);
  assert.equal(counter.reads, 0);
});
