import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/refresh-watchdog.js", import.meta.url), "utf8");

test("M425 watchdog ready awaits sync or promise alarm creation", () => {
  assert.match(source, /\.then\(async \(existing\) => \{/);
  assert.match(source, /await Promise\.resolve\(createAlarm\(LIST_REFRESH_WATCHDOG_ALARM, \{ periodInMinutes: LIST_REFRESH_WATCHDOG_MINUTES \}\)\);/);
  assert.match(source, /return active;/);
});

test("M425 create rejection remains contained by the ready failure path", () => {
  assert.match(source, /\.catch\(\(error\) => \{\s*if \(active\) warnBestEffort\(warn, "drop-ads could not establish the due-source refresh watchdog", error\);\s*return false;\s*\}\)/s);
});
