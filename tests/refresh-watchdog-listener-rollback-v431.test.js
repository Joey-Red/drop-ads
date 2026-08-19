import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/refresh-watchdog.js", import.meta.url), "utf8");

test("M431 watchdog listener registration failure marks callback inert and rolls back exact listener", () => {
  assert.match(source, /try \{\s*addAlarmListener\(onAlarm\);\s*\} catch \(error\) \{\s*active = false;\s*removeListenerBestEffort\(removeAlarmListener, onAlarm\);\s*throw error;/s);
  assert.match(source, /const onAlarm = \(alarm\) => \{\s*if \(!active\) return;/s);
});
