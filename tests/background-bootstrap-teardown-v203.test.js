import assert from "node:assert/strict";
import test from "node:test";

import { bootstrapBackground } from "../src/core/background-bootstrap.js";

test("full background teardown is reverse-optional then mandatory then core and idempotent", async () => {
  const order = [];
  const core = { dispose() { order.push("core"); } };
  const boot = bootstrapBackground({
    startCore() { return core; },
    installMandatoryRecovery(received) {
      assert.equal(received, core);
      return { dispose() { order.push("mandatory"); } };
    },
    optionalFeatures: [
      { name: "first", install() { return { dispose() { order.push("first"); } }; } },
      { name: "second", install() { return { dispose() { order.push("second"); } }; } }
    ],
    logger: { warn() {} }
  });

  const first = boot.disposeBackground();
  const second = boot.disposeBackground();
  assert.equal(first, second);
  await first;
  await boot.disposeBackground();
  assert.deepEqual(order, ["second", "first", "mandatory", "core"]);
});

test("teardown failures are isolated so later layers still dispose", async () => {
  const order = [];
  const warnings = [];
  const boot = bootstrapBackground({
    startCore() { return { dispose() { order.push("core"); } }; },
    installMandatoryRecovery() {
      return { dispose() { order.push("mandatory"); throw new Error("mandatory failed"); } };
    },
    optionalFeatures: [
      { name: "bad", install() { return { dispose() { order.push("optional"); throw new Error("optional failed"); } }; } }
    ],
    logger: { warn(message) { warnings.push(message); } }
  });
  await boot.disposeBackground();
  assert.deepEqual(order, ["optional", "mandatory", "core"]);
  assert.equal(warnings.length, 2);
});

test("full teardown remains compatible with non-disposable core and mandatory recovery", async () => {
  const boot = bootstrapBackground({
    startCore() { return { started: true }; },
    installMandatoryRecovery() { return undefined; },
    logger: { warn() {} }
  });
  await assert.doesNotReject(() => boot.disposeBackground());
});
