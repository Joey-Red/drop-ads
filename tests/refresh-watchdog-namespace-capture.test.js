import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const source = fs.readFileSync(new URL("../src/core/refresh-watchdog.js", import.meta.url), "utf8");
test("watchdog captures alarms namespace and event without ordinary reads", () => {
  assert.match(source, /const alarms = captureDataValue\(api, "alarms", "Refresh watchdog alarms namespace"\);/);
  assert.match(source, /const alarmEvent = captureDataValue\(alarms, "onAlarm", "Refresh watchdog alarms\.onAlarm event"\);/);
  assert.match(source, /captureBoundMethod\(alarms, "get"/);
  assert.match(source, /captureBoundMethod\(alarms, "create"/);
  assert.match(source, /captureBoundMethod\(alarmEvent, "addListener"/);
  assert.match(source, /captureBoundMethod\(alarmEvent, "removeListener"/);
});
