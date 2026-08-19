import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M442 configured list refresh captures alarm clear/create once", () => {
  assert.match(source, /const alarmClear = captureBoundMethod\(api\.alarms, "clear", "Background runtime alarms\.clear"\);/);
  assert.match(source, /const alarmCreate = captureBoundMethod\(api\.alarms, "create", "Background runtime alarms\.create"\);/);
});

test("M442 scheduler awaits both clear and create and keeps the 60 minute floor", () => {
  const start = source.indexOf("async function scheduleListRefresh");
  const end = source.indexOf("async function initializeRuntime", start);
  assert.ok(start >= 0 && end > start);
  const block = source.slice(start, end);
  assert.match(block, /Math\.max\(60, effectiveState\.updateIntervalHours \* 60\)/);
  assert.match(block, /await Promise\.resolve\(alarmClear\(LIST_REFRESH_ALARM\)\);/);
  assert.match(block, /await Promise\.resolve\(alarmCreate\(LIST_REFRESH_ALARM, \{ periodInMinutes \}\)\);/);
  assert.doesNotMatch(block, /api\.alarms\.(?:clear|create)/);
});
