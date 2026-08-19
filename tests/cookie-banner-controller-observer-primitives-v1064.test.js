import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-controller.js", import.meta.url), "utf8");

test("M1064 captures MutationObserver prototype methods before construction", () => {
  assert.match(source, /const Observer = captureData\(globalThis, "MutationObserver"\)/);
  assert.match(source, /const ObserverPrototype = captureData\(Observer, "prototype"\)/);
  assert.match(source, /const observerObserve = captureData\(ObserverPrototype, "observe"\)/);
  assert.match(source, /const observerDisconnect = captureData\(ObserverPrototype, "disconnect"\)/);
  assert.match(source, /Reflect\.construct\(Observer, \[\(\) => \{ scheduleMutationScan\(\); \}\]\)/);
  assert.match(source, /Reflect\.apply\(observerObserve, instance, \[target, options\]\)/);
  assert.match(source, /Reflect\.apply\(observerDisconnect, instance, \[\]\)/);
});

test("M1064 preserves bounded late observation and avoids instance method rediscovery", () => {
  assert.match(source, /MAX_SCAN_ATTEMPTS = 16/);
  assert.match(source, /MAX_OBSERVE_MS = 30_000/);
  assert.match(source, /MUTATION_SETTLE_MS = 150/);
  assert.doesNotMatch(source, /captureMethod\(instance, "observe"\)|captureMethod\(instance, "disconnect"\)/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry/i);
});
