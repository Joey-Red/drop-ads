import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M448 captures configured refresh alarm clear/create once", () => {
  assert.match(source, /const alarmClear = captureBoundMethod\(api\.alarms, "clear", "Background runtime alarms\.clear"\);/);
  assert.match(source, /const alarmCreate = captureBoundMethod\(api\.alarms, "create", "Background runtime alarms\.create"\);/);
});

test("M448 awaits both alarm operations in clear-then-create order", () => {
  const scheduler = source.match(/async function scheduleListRefresh\(state = null\) \{[\s\S]*?\n  \}/)?.[0] ?? "";
  const clearIndex = scheduler.indexOf("await Promise.resolve(alarmClear(LIST_REFRESH_ALARM))");
  const createIndex = scheduler.indexOf("await Promise.resolve(alarmCreate(LIST_REFRESH_ALARM, { periodInMinutes }))");
  assert.ok(clearIndex >= 0, "captured alarm clear is awaited");
  assert.ok(createIndex > clearIndex, "captured alarm create is awaited after clear");
  assert.match(scheduler, /Math\.max\(60, effectiveState\.updateIntervalHours \* 60\)/);
  assert.doesNotMatch(scheduler, /api\.alarms\.(?:clear|create)/);
});
