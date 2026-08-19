import test from "node:test";
import assert from "node:assert/strict";
import { bootstrapBackground } from "../src/core/background-bootstrap.js";

function throwingLogger() {
  return {
    warn() { throw new Error("logger failed"); }
  };
}

test("M409 optional install diagnostics cannot turn optional failure into bootstrap failure", () => {
  const order = [];
  const result = bootstrapBackground({
    logger: throwingLogger(),
    startCore() {
      return { dispose() { order.push("core"); } };
    },
    installMandatoryRecovery() {
      return { dispose() { order.push("mandatory"); } };
    },
    optionalFeatures: [
      { name: "bad", install() { throw new Error("optional install failed"); } },
      { name: "good", install() { return { dispose() { order.push("good"); } }; } }
    ]
  });

  assert.equal(result.features.bad, "failed");
  assert.equal(result.features.good, "installed");
});

test("M409 throwing diagnostics do not stop reverse optional, mandatory, or core teardown", async () => {
  const order = [];
  const result = bootstrapBackground({
    logger: throwingLogger(),
    startCore() {
      return { dispose() { order.push("core"); throw new Error("core dispose failed"); } };
    },
    installMandatoryRecovery() {
      return { dispose() { order.push("mandatory"); throw new Error("mandatory dispose failed"); } };
    },
    optionalFeatures: [
      { name: "one", install() { return { dispose() { order.push("one"); throw new Error("one dispose failed"); } }; } },
      { name: "two", install() { return { dispose() { order.push("two"); throw new Error("two dispose failed"); } }; } }
    ]
  });

  await assert.doesNotReject(result.disposeBackground());
  assert.deepEqual(order, ["two", "one", "mandatory", "core"]);
  await assert.doesNotReject(result.disposeBackground());
  assert.deepEqual(order, ["two", "one", "mandatory", "core"]);
});
