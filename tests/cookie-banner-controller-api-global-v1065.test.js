import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-controller.js", import.meta.url), "utf8");

test("M1065 captures browser/chrome globals without live property access", () => {
  assert.match(source, /function capturedGlobalValue\(key\)/);
  assert.match(source, /const data = captureData\(globalThis, key\)/);
  assert.match(source, /readGetter\(captureGetter\(globalThis, key\), globalThis\)/);
  assert.match(source, /const api = capturedGlobalValue\("browser"\) \?\? capturedGlobalValue\("chrome"\)/);
  assert.match(source, /const runtime = captureData\(browserApi, "runtime"\)/);
  assert.match(source, /return captureMethod\(runtime, "sendMessage"\)/);
  assert.doesNotMatch(source, /globalThis\.browser\b|globalThis\.chrome\b/);
});

test("M1065 keeps policy messaging domain-only and private", () => {
  assert.match(source, /Object\.freeze\(\{ type: MESSAGE_TYPE, domain \}\)/);
  assert.doesNotMatch(source, /location\.href|document\.title|innerHTML|outerHTML|localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry/i);
});
