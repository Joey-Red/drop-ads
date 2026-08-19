import test from "node:test";
import assert from "node:assert/strict";
import {
  bootstrapBackground,
  installOptionalBackgroundFeatures
} from "../src/core/background-bootstrap.js";

function poisonBind(callback, counter) {
  Object.defineProperty(callback, "bind", {
    configurable: true,
    get() {
      counter.count += 1;
      throw new Error("callable .bind must not be read");
    }
  });
  return callback;
}

test("M434 supplied warning callback is receiver-bound without reading callback.bind", () => {
  const bindReads = { count: 0 };
  const receiver = { calls: 0 };
  const warn = poisonBind(function warn() { this.calls += 1; }, bindReads);
  receiver.warn = warn;

  const status = installOptionalBackgroundFeatures([
    { name: "fails", install() { throw new Error("expected feature failure"); } }
  ], { logger: receiver });

  assert.equal(bindReads.count, 0);
  assert.equal(receiver.calls, 1);
  assert.equal(status.fails, "failed");
});

test("M434 optional and mandatory/core disposers never read callable.bind", async () => {
  const bindReads = { count: 0 };
  const calls = [];

  const core = {};
  core.dispose = poisonBind(function disposeCore() {
    assert.equal(this, core);
    calls.push("core");
  }, bindReads);

  const mandatory = {};
  mandatory.dispose = poisonBind(function disposeMandatory() {
    assert.equal(this, mandatory);
    calls.push("mandatory");
  }, bindReads);

  const optional = {};
  optional.dispose = poisonBind(function disposeOptional() {
    assert.equal(this, optional);
    calls.push("optional");
  }, bindReads);

  const background = bootstrapBackground({
    startCore: () => core,
    installMandatoryRecovery: () => mandatory,
    optionalFeatures: [{ name: "optional", install: () => optional }]
  });

  await background.disposeBackground();
  assert.equal(bindReads.count, 0);
  assert.deepEqual(calls, ["optional", "mandatory", "core"]);
});
