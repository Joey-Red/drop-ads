import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M452 configured list-refresh scheduling uses captured awaited alarm collaborators", () => {
  assert.match(source, /const alarmClear = captureBoundMethod\(api\.alarms, "clear", "Background runtime alarms\.clear"\);/);
  assert.match(source, /const alarmCreate = captureBoundMethod\(api\.alarms, "create", "Background runtime alarms\.create"\);/);
  assert.match(source, /await Promise\.resolve\(alarmClear\(LIST_REFRESH_ALARM\)\);/);
  assert.match(source, /await Promise\.resolve\(alarmCreate\(LIST_REFRESH_ALARM, \{ periodInMinutes \}\)\);/);
  assert.doesNotMatch(source, /await api\.alarms\.clear\(/);
  assert.doesNotMatch(source, /api\.alarms\.create\(LIST_REFRESH_ALARM/);
});
