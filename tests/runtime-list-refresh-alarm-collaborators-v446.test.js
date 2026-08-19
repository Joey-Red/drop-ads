import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M446 captures configured refresh alarm methods once during runtime admission", () => {
  assert.match(source, /const alarmClear = captureBoundMethod\(api\.alarms, "clear", "Background runtime alarms\.clear"\);/);
  assert.match(source, /const alarmCreate = captureBoundMethod\(api\.alarms, "create", "Background runtime alarms\.create"\);/);
  assert.doesNotMatch(source, /api\.alarms\.clear\(/);
  assert.doesNotMatch(source, /api\.alarms\.create\(/);
});

test("M446 waits for both clear and create before reporting scheduling success", () => {
  assert.match(source, /async function scheduleListRefresh\(state = null\)[\s\S]*await Promise\.resolve\(alarmClear\(LIST_REFRESH_ALARM\)\);[\s\S]*await Promise\.resolve\(alarmCreate\(LIST_REFRESH_ALARM, \{ periodInMinutes \}\)\);/);
  assert.match(source, /const periodInMinutes = Math\.max\(60, effectiveState\.updateIntervalHours \* 60\);/);
});

test("M446 initialization and import still await the shared scheduler", () => {
  assert.match(source, /try \{ await scheduleListRefresh\(candidateState\); \}/);
  assert.match(source, /await scheduleListRefresh\(\);/);
});
