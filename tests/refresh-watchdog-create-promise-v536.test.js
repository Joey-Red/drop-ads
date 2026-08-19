import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/refresh-watchdog.js", import.meta.url), "utf8");

test("watchdog ready awaits void or promise-returning alarm creation", () => {
  assert.match(source, /\.then\(async \(existing\) => \{/);
  assert.match(source, /await Promise\.resolve\(createAlarm\(LIST_REFRESH_WATCHDOG_ALARM, \{ periodInMinutes: LIST_REFRESH_WATCHDOG_MINUTES \}\)\);/);
  assert.match(source, /return active;/);
});

test("watchdog alarm creation failures remain on the existing contained ready path", () => {
  assert.match(source, /\.catch\(\(error\) => \{\s*if \(active\) warnBestEffort\(warn, "drop-ads could not establish the due-source refresh watchdog", error\);\s*return false;/s);
});
