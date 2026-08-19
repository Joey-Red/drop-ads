import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/core/settings-reset-message.js", import.meta.url), "utf8");

test("configured reset message is an exact descriptor-safe no-payload envelope", () => {
  assert.match(source, /SETTINGS_RESET_MESSAGE_TYPE = "drop-ads:reset-settings"/);
  assert.match(source, /Reflect\.ownKeys\(message\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(message, "type"\)/);
  assert.match(source, /keys\.length !== 1 \|\| keys\[0\] !== "type"/);
  assert.match(source, /descriptor\.value !== SETTINGS_RESET_MESSAGE_TYPE/);
  assert.doesNotMatch(source, /backupText|domain|rule|url|history|telemetry|statistics/i);
});
