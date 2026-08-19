import test from "node:test";
import assert from "node:assert/strict";
import { bootstrapBackground } from "../src/core/background-bootstrap.js";

function logger() {
  const warnings = [];
  return { warnings, warn(...args) { warnings.push(args); } };
}

test("optional feature teardown runs disposable registrations in reverse installation order once", async () => {
  const order = [];
  const result = bootstrapBackground({
    startCore() { return {}; },
    installMandatoryRecovery() {},
    optionalFeatures: [
      { name: "first", install() { order.push("install:first"); return { dispose() { order.push("dispose:first"); } }; } },
      { name: "plain", install() { order.push("install:plain"); } },
      { name: "last", install() { order.push("install:last"); return { async dispose() { order.push("dispose:last"); } }; } }
    ]
  });

  assert.equal(Object.getPrototypeOf(result.features), null);
  assert.deepEqual({ ...result.features }, { first: "installed", plain: "installed", last: "installed" });
  await result.disposeOptionalFeatures();
  await result.disposeOptionalFeatures();
  assert.deepEqual(order, ["install:first", "install:plain", "install:last", "dispose:last", "dispose:first"]);
});

test("optional disposer failure is isolated from remaining teardown", async () => {
  const order = [];
  const log = logger();
  const result = bootstrapBackground({
    startCore() { return {}; },
    installMandatoryRecovery() {},
    logger: log,
    optionalFeatures: [
      { name: "healthy", install() { return { dispose() { order.push("healthy"); } }; } },
      { name: "broken", install() { return { dispose() { order.push("broken"); throw new Error("dispose failed"); } }; } },
      { name: "last", install() { return { dispose() { order.push("last"); } }; } }
    ]
  });

  await result.disposeOptionalFeatures();
  assert.deepEqual(order, ["last", "broken", "healthy"]);
  assert.equal(log.warnings.length, 1);
  assert.match(String(log.warnings[0][0]), /broken/);
});
