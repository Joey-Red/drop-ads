import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-controller.js", import.meta.url), "utf8");

test("late cookie-banner discovery is mutation-driven and strictly bounded", () => {
  assert.match(source, /MAX_SCAN_ATTEMPTS = 16/);
  assert.match(source, /MAX_OBSERVE_MS = 30_000/);
  assert.match(source, /MUTATION_SETTLE_MS = 150/);
  assert.match(source, /Reflect\.construct\(Observer, \[\(\) => \{ scheduleMutationScan\(\); \}\]\)/);
  assert.match(source, /attempts \+= 1/);
  assert.match(source, /attempts >= MAX_SCAN_ATTEMPTS/);
  assert.match(source, /stopTimer = scheduleTimeout\(stop, MAX_OBSERVE_MS\)/);
  assert.doesNotMatch(source, /setInterval/);
});

test("late cookie-banner observation tears down on success, exhaustion, failure, and pagehide", () => {
  assert.match(source, /observer\?\.disconnect\(\)/);
  assert.match(source, /clearTimer\(stopTimer\)/);
  assert.match(source, /clearTimer\(scanTimer\)/);
  assert.match(source, /Reflect\.apply\(activateRejectionCandidate, undefined, \[candidate\]\) === true/);
  assert.match(source, /if \(activated\) \{\s*stop\(\)/s);
  assert.match(source, /addGlobalListener\("pagehide", stop, \{ once: true \}\)/);
});

test("policy is requested once before observation begins", () => {
  assert.match(source, /if \(!active \|\| started\) return false/);
  assert.match(source, /started = true/);
  assert.match(source, /response = await sendMessage\(/);
  assert.match(source, /if \(!activated && active\) beginObservation\(\)/);
  assert.doesNotMatch(source, /api\.runtime\.sendMessage\(/);
});
