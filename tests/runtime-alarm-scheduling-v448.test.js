import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M448 core runtime captures configured refresh alarm collaborators once", () => {
  assert.match(source, /const alarmClear = captureBoundMethod\(api\.alarms, "clear", "Background runtime alarms\.clear"\);/);
  assert.match(source, /const alarmCreate = captureBoundMethod\(api\.alarms, "create", "Background runtime alarms\.create"\);/);
  assert.doesNotMatch(source, /api\.alarms\.clear\(LIST_REFRESH_ALARM\)/);
  assert.doesNotMatch(source, /api\.alarms\.create\(LIST_REFRESH_ALARM/);
});

test("M448 configured refresh scheduling awaits clear then create", () => {
  assert.match(source, /async function scheduleListRefresh\(state = null\) \{[\s\S]*await Promise\.resolve\(alarmClear\(LIST_REFRESH_ALARM\)\);[\s\S]*await Promise\.resolve\(alarmCreate\(LIST_REFRESH_ALARM, \{ periodInMinutes \}\)\);[\s\S]*\}/);
  assert.match(source, /const periodInMinutes = Math\.max\(60, effectiveState\.updateIntervalHours \* 60\);/);
});
