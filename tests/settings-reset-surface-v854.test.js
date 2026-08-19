import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/reset-settings-ui.js", import.meta.url), "utf8");

test("M854 configured reset surface states scope, session separation, and local privacy", () => {
  assert.match(source, /link\.href = "#reset-settings-section"/);
  assert.match(source, /section\.id = "reset-settings-section"/);
  assert.match(source, /Reset configured settings/);
  assert.match(source, /Temporary session pauses are separate ephemeral recovery state and are not cleared by this action/);
  assert.match(source, /This is a local recovery action/);
  assert.match(source, /does not keep a reset history, browsing history, request history, statistics, identifiers, or telemetry/);
  assert.match(source, /backupSection\.insertAdjacentElement\("afterend", section\)/);
});
