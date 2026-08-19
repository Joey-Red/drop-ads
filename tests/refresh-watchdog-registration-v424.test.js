import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/refresh-watchdog.js", import.meta.url), "utf8");

test("M424 watchdog listener registration is transactional", () => {
  assert.match(source, /try \{\s*addAlarmListener\(onAlarm\);\s*\} catch \(error\) \{\s*active = false;\s*removeListenerBestEffort\(removeAlarmListener, onAlarm\);\s*throw error;\s*\}/s);
});

test("M424 retained callbacks are inert after failed registration or disposal", () => {
  assert.match(source, /const onAlarm = \(alarm\) => \{\s*if \(!active\) return;/s);
  assert.match(source, /dispose\(\) \{\s*if \(!active\) return;\s*active = false;/s);
  assert.match(source, /installations\.delete\(api\)/);
});

test("M424 persistent 30-minute non-forced watchdog semantics remain", () => {
  assert.match(source, /LIST_REFRESH_WATCHDOG_MINUTES = 30/);
  assert.match(source, /refreshListsOnce\(false\)/);
  assert.match(source, /periodInMinutes: LIST_REFRESH_WATCHDOG_MINUTES/);
});
