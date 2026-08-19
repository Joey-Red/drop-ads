import test from "node:test";
import assert from "node:assert/strict";
import { bootstrapBackground, installOptionalBackgroundFeatures } from "../src/core/background-bootstrap.js";

test("M409 throwing warning logger cannot turn optional install failure into bootstrap failure", () => {
  const logger = { warn() { throw new Error("synthetic logger failure"); } };
  const status = installOptionalBackgroundFeatures([
    { name: "broken", install() { throw new Error("synthetic optional failure"); } },
    { name: "healthy", install() { return null; } }
  ], { logger });

  assert.equal(status.broken, "failed");
  assert.equal(status.healthy, "installed");
});

test("M409 throwing diagnostics cannot abort reverse teardown or mandatory/core cleanup", async () => {
  const calls = [];
  const logger = { warn() { calls.push("warn"); throw new Error("synthetic logger failure"); } };
  const core = { dispose() { calls.push("core"); } };
  const mandatory = { dispose() { calls.push("mandatory"); throw new Error("synthetic mandatory failure"); } };

  const background = bootstrapBackground({
    logger,
    startCore: () => core,
    installMandatoryRecovery: () => mandatory,
    optionalFeatures: [
      { name: "first", install() { return { dispose() { calls.push("first"); } }; } },
      { name: "second", install() { return { dispose() { calls.push("second"); throw new Error("synthetic optional teardown failure"); } }; } }
    ]
  });

  await background.disposeBackground();
  assert.deepEqual(calls.filter((value) => value !== "warn"), ["second", "first", "mandatory", "core"]);
  const warningCount = calls.filter((value) => value === "warn").length;
  assert.equal(warningCount, 2);

  await background.disposeBackground();
  assert.deepEqual(calls.filter((value) => value !== "warn"), ["second", "first", "mandatory", "core"]);
});
