import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/refresh-watchdog.js", import.meta.url), "utf8");

test("M424 watchdog listener registration is rollback-safe", () => {
  assert.match(source, /try \{\s*addAlarmListener\(onAlarm\);\s*\} catch \(error\) \{\s*active = false;\s*removeListenerBestEffort\(removeAlarmListener, onAlarm\);\s*throw error;\s*\}/s);
  assert.match(source, /if \(!active\) return;/);
  assert.match(source, /installations\.set\(api, installation\);/);
});
